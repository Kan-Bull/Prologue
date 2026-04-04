import * as readline from "node:readline";
import kleur from "kleur";
import type { ElementInfo } from "../scanner/page-analyzer";
import {
  escapeStr,
  getAccessibleName,
  getImplicitRole,
  isGeneratedId,
  rankLocator,
  suggestVariableName,
} from "../scanner/locator-ranker";

/** Utility CSS classes that make poor locators. */
const UTILITY_CLASS_PATTERNS = [
  /^[mp][trblxy]?-\d/,   // margin/padding utilities (mt-3, px-4, etc.)
  /^[wh]-\d/,             // width/height utilities
  /^(d|flex|grid|block|inline|hidden|visible|show|fade|collapse)/,
  /^(text|font|bg|border|rounded|shadow|overflow|cursor|opacity|transition|animate)/,
  /^(justify|items|self|content|place|gap|space|order)/,
  /^(col|row|container|wrapper|clearfix)/,
  /^(sr-only|visually-hidden|screenreader)/,
  /^(active|disabled|focus|hover|selected|open|closed|collapsed)/,
];

/** HTML void elements that never have closing tags. */
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

function isUtilityClass(cls: string): boolean {
  return UTILITY_CLASS_PATTERNS.some((p) => p.test(cls));
}

interface LocatorCandidate {
  strategy: string;
  code: string;
  score: number;
}

// ──────────────────────────────────────────────
//  HTML Parsing
// ──────────────────────────────────────────────

/**
 * Parse attributes from an opening tag's attribute string.
 */
function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2] ?? match[3] ?? "";
  }
  return attrs;
}

/**
 * Build an ElementInfo from a tag name, attributes, and optional text content.
 */
function buildElementInfo(tagName: string, attrs: Record<string, string>, text: string | null): ElementInfo {
  const testIdAttrs = ["data-testid", "data-test", "data-cy", "data-qa"];
  let testId: string | null = null;
  for (const attr of testIdAttrs) {
    if (attrs[attr]) {
      testId = attrs[attr];
      break;
    }
  }

  const classes = attrs.class
    ? attrs.class.split(/\s+/).filter(Boolean)
    : [];

  let visibleText: string | null = null;
  if (text) {
    const cleaned = text.trim();
    if (cleaned.length > 0) {
      visibleText = cleaned.length > 50 ? cleaned.slice(0, 47) + "..." : cleaned;
    }
  }

  return {
    tagName,
    type: attrs.type || null,
    id: attrs.id || null,
    name: attrs.name || null,
    placeholder: attrs.placeholder || null,
    ariaLabel: attrs["aria-label"] || null,
    ariaLabelledBy: attrs["aria-labelledby"] || null,
    role: attrs.role || null,
    testId,
    visibleText,
    associatedLabel: null,
    classes,
  };
}

/**
 * Check if an element has meaningful attributes worth showing locators for.
 */
function hasMeaningfulAttributes(el: ElementInfo): boolean {
  return !!(
    el.testId ||
    el.id ||
    el.role ||
    el.ariaLabel ||
    el.ariaLabelledBy ||
    el.name ||
    el.placeholder ||
    el.classes.some((c) => !isUtilityClass(c))
  );
}

/**
 * Parse a single HTML element string into an ElementInfo.
 * Handles self-closing tags and elements with content.
 */
export function parseHtmlElement(html: string): ElementInfo {
  const trimmed = html.trim();

  const tagMatch = trimmed.match(/^<(\w+)[\s>/]/);
  const tagName = tagMatch ? tagMatch[1].toLowerCase() : "div";

  const openTagMatch = trimmed.match(/^<\w+([^>]*)>/);
  const attrString = openTagMatch ? openTagMatch[1] : "";
  const attrs = parseAttributes(attrString);

  // Extract visible text: strip all inner HTML tags
  let text: string | null = null;
  const contentMatch = trimmed.match(/^<\w+[^>]*>([\s\S]*?)<\/\w+>$/);
  if (contentMatch) {
    text = contentMatch[1].replace(/<[^>]*>/g, "").trim() || null;
  }

  return buildElementInfo(tagName, attrs, text);
}

/**
 * Parse ALL elements from an HTML string — root + children.
 * Returns an array of ElementInfo, one per distinct element found.
 */
export function parseAllElements(html: string): ElementInfo[] {
  const elements: ElementInfo[] = [];
  const trimmed = html.trim();

  // Match every opening tag with its attributes
  const tagRegex = /<(\w+)((?:\s+[\w-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*\/?>/g;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = tagRegex.exec(trimmed)) !== null) {
    const tagName = tagMatch[1].toLowerCase();
    const attrString = tagMatch[2] || "";
    const attrs = parseAttributes(attrString);

    // Find visible text for this element
    let text: string | null = null;
    if (!VOID_ELEMENTS.has(tagName) && !tagMatch[0].endsWith("/>")) {
      // Find content between this opening tag and its closing tag
      const afterTag = trimmed.slice(tagMatch.index + tagMatch[0].length);
      const closePattern = new RegExp(`^([\\s\\S]*?)</${tagName}>`);
      const closeMatch = afterTag.match(closePattern);
      if (closeMatch) {
        // Strip child tags to get only direct text content
        text = closeMatch[1].replace(/<[^>]*>/g, "").trim() || null;
      }
    }

    elements.push(buildElementInfo(tagName, attrs, text));
  }

  return elements;
}

// ──────────────────────────────────────────────
//  Generate ALL locator candidates
// ──────────────────────────────────────────────

/**
 * Generate all possible Playwright locator candidates for the given element,
 * each with a stability score.
 */
function generateAllLocators(el: ElementInfo): LocatorCandidate[] {
  const candidates: LocatorCandidate[] = [];
  const role = getImplicitRole(el);
  const accessibleName = getAccessibleName(el);

  // testId — score 5
  if (el.testId) {
    candidates.push({
      strategy: "getByTestId",
      code: `getByTestId("${escapeStr(el.testId)}")`,
      score: 5,
    });
  }

  // id (non-generated) — score 4
  if (el.id && !isGeneratedId(el.id)) {
    candidates.push({
      strategy: "locator#id",
      code: `locator("#${escapeStr(el.id)}")`,
      score: 4,
    });
  }

  // role — score 3
  if (role) {
    if (accessibleName) {
      candidates.push({
        strategy: "getByRole",
        code: `getByRole("${role}", { name: "${escapeStr(accessibleName)}" })`,
        score: 3,
      });
    } else {
      candidates.push({
        strategy: "getByRole",
        code: `getByRole("${role}")`,
        score: 3,
      });
    }
  }

  // aria-label — score 3 (only if not already used as role name)
  if (el.ariaLabel && !(role && accessibleName === el.ariaLabel)) {
    candidates.push({
      strategy: "getByLabel",
      code: `getByLabel("${escapeStr(el.ariaLabel)}")`,
      score: 3,
    });
  }

  // placeholder — score 2
  if (el.placeholder) {
    candidates.push({
      strategy: "getByPlaceholder",
      code: `getByPlaceholder("${escapeStr(el.placeholder)}")`,
      score: 2,
    });
  }

  // visible text — score 2
  if (el.visibleText) {
    candidates.push({
      strategy: "getByText",
      code: `getByText("${escapeStr(el.visibleText)}")`,
      score: 2,
    });
  }

  // name attribute — score 1
  if (el.name) {
    candidates.push({
      strategy: "locator[name]",
      code: `locator('[name="${escapeStr(el.name)}"]')`,
      score: 1,
    });
  }

  // classes (non-utility) — score 1
  for (const cls of el.classes) {
    if (!isUtilityClass(cls)) {
      candidates.push({
        strategy: "locator(css)",
        code: `locator(".${escapeStr(cls)}")`,
        score: 1,
      });
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  return candidates;
}

// ──────────────────────────────────────────────
//  Terminal display
// ──────────────────────────────────────────────

function stabilityIcon(score: number): string {
  if (score >= 4) return kleur.green("\u2B24");
  if (score === 3) return kleur.yellow("\u2B24");
  return kleur.red("\u2B24");
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

/** One entry in the global flat list of all locators across all elements. */
interface GlobalEntry {
  el: ElementInfo;
  candidate: LocatorCandidate;
  varName: string;
}

/**
 * Print a locator table for one element.
 * Uses global numbering starting at `startIndex`.
 * Returns the number of rows printed.
 */
function printElementTable(
  label: string,
  el: ElementInfo,
  candidates: LocatorCandidate[],
  startIndex: number,
): number {
  const textHint = el.visibleText ? ` with text "${truncate(el.visibleText, 40)}"` : "";
  console.log(`  ${kleur.bold(label)}: ${kleur.bold(`<${el.tagName}>`)}${kleur.dim(textHint)}`);
  console.log();

  if (candidates.length === 0) {
    console.log(kleur.yellow("    No locator strategies found.\n"));
    return 0;
  }

  const numW = 4;
  const stratW = 18;
  const locW = 46;
  const stabW = 9;
  const totalW = numW + stratW + locW + stabW;
  const line = "\u2500".repeat(totalW);

  console.log(`  \u250C${line}\u2510`);
  console.log(
    `  \u2502` +
    kleur.bold(" #".padEnd(numW)) +
    kleur.bold("Strategy".padEnd(stratW)) +
    kleur.bold("Locator".padEnd(locW)) +
    kleur.bold("Stability".padEnd(stabW)) +
    `\u2502`,
  );
  console.log(`  \u251C${line}\u2524`);

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const num = ` ${startIndex + i}`.padEnd(numW);
    const strat = c.strategy.padEnd(stratW);
    const loc = truncate(c.code, locW - 2).padEnd(locW);
    const icon = stabilityIcon(c.score);

    console.log(`  \u2502${num}${strat}${loc}   ${icon}   \u2502`);
  }

  console.log(`  \u2514${line}\u2518`);
  console.log();

  return candidates.length;
}

function formatCopyPaste(varName: string, code: string): string {
  return `private readonly ${varName} = this.page.${code};`;
}

function promptSelection(entries: GlobalEntry[]): Promise<number> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`  ${kleur.bold("Select locator")} [${kleur.cyan("1")}]: `, (answer) => {
      rl.close();
      const n = parseInt(answer, 10);
      if (!answer.trim()) return resolve(0);
      if (isNaN(n) || n < 1 || n > entries.length) return resolve(0);
      resolve(n - 1);
    });
  });
}

/**
 * Extract locators from a raw HTML string and display them.
 * Analyzes the root element and all meaningful child elements.
 * Interactive: lets the user pick which locator to copy.
 */
export async function extract(html: string): Promise<void> {
  const allElements = parseAllElements(html);

  if (allElements.length === 0) {
    console.log(kleur.yellow("\n  No HTML elements found.\n"));
    return;
  }

  console.log();
  console.log(kleur.bold().cyan("  \uD83D\uDD0D Analyzing element..."));
  console.log();

  // Collect all entries with global numbering
  const entries: GlobalEntry[] = [];
  const root = allElements[0];
  const rootCandidates = generateAllLocators(root);
  const rootVarName = suggestVariableName(root);

  for (const c of rootCandidates) {
    entries.push({ el: root, candidate: c, varName: rootVarName });
  }

  // Print root table
  let globalIndex = 1;
  const rootCount = printElementTable("Root", root, rootCandidates, globalIndex);
  globalIndex += rootCount;

  // Child elements
  const children = allElements.slice(1).filter(hasMeaningfulAttributes);

  if (children.length > 0) {
    console.log(kleur.dim("  ─".repeat(38)));
    console.log();
    console.log(kleur.bold(`  ${children.length} child element${children.length > 1 ? "s" : ""} found:`));
    console.log();

    for (const child of children) {
      const candidates = generateAllLocators(child);
      const varName = suggestVariableName(child);

      for (const c of candidates) {
        entries.push({ el: child, candidate: c, varName });
      }

      const count = printElementTable("Child", child, candidates, globalIndex);
      globalIndex += count;
    }
  }

  if (entries.length === 0) return;

  // Interactive selection
  const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
  let selected = 0; // default: first (best) locator

  if (isInteractive) {
    selected = await promptSelection(entries);
  }

  const entry = entries[selected];
  const line = formatCopyPaste(entry.varName, entry.candidate.code);

  console.log(`  ${kleur.bold("Copy-paste ready:")}`);
  console.log(kleur.green(`    ${line}`));
  console.log();
}

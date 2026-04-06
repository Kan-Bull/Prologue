#!/usr/bin/env node

import kleur from "kleur";
import { readClipboard } from "./utils/cli";
import { extract } from "./extractor";
import { scan } from "./scanner";
import { scaffold } from "./scaffold";

// ──────────────────────────────────────────────
//  Usage
// ──────────────────────────────────────────────

function printUsage(): void {
  console.log();
  console.log(kleur.bold().cyan("  ⚡ histrion"), kleur.dim("— Playwright testing toolkit"));
  console.log();
  console.log(kleur.bold("  Commands:\n"));
  console.log("    histrion create [name|.]       Scaffold a new Playwright project");
  console.log("    histrion scan <url>           Analyze a page and generate a Page Object");
  console.log("    histrion extract              Extract locators from clipboard (Copy Element in DevTools)");
  console.log();
  console.log(kleur.bold("  Options:\n"));
  console.log("    scan --test-id-attr <attr>   Custom test ID attribute (default: data-testid)");
  console.log("    scan --headed                Open browser visibly — log in, then press Enter to scan");
  console.log("    scan --auth <file>           Use saved auth state (e.g. auth/admin.json)");
  console.log();
  console.log(kleur.bold("  Examples:\n"));
  console.log(kleur.dim("    npx histrion create"));
  console.log(kleur.dim("    npx histrion create my-e2e-tests"));
  console.log(kleur.dim("    npx histrion create .              # scaffold in current directory"));
  console.log(kleur.dim("    npx histrion scan https://myapp.com/login"));
  console.log(kleur.dim("    npx histrion scan https://myapp.com/login --test-id-attr data-cy"));
  console.log(kleur.dim("    npx histrion scan https://myapp.com/settings --headed"));
  console.log(kleur.dim("    npx histrion scan https://myapp.com/settings --auth auth/admin.json"));
  console.log(kleur.dim("    npx histrion extract                            # reads from clipboard"));
  console.log(kleur.dim(`    npx histrion extract '<button id="login">Sign In</button>'`));
  console.log();
}

// ──────────────────────────────────────────────
//  Main
// ──────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // ── extract ──
  if (args[0] === "extract") {
    const htmlArg = args.slice(1).join(" ");

    if (htmlArg) {
      await extract(htmlArg);
      return;
    }

    if (!process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }
      const piped = Buffer.concat(chunks).toString("utf-8").trim();
      if (piped) {
        await extract(piped);
        return;
      }
    }

    const clipboard = readClipboard();
    if (clipboard && clipboard.startsWith("<")) {
      console.log(kleur.dim("  (reading from clipboard)"));
      await extract(clipboard);
      return;
    }

    console.log(kleur.red("\n  No HTML found. Either:"));
    console.log(`    1. Copy an element in Chrome DevTools, then run ${kleur.cyan("npx histrion extract")}`);
    console.log(`    2. Pass it inline: ${kleur.cyan(`npx histrion extract '<button id="ok">OK</button>'`)}`);
    console.log();
    process.exit(1);
  }

  // ── scan ──
  if (args[0] === "scan") {
    const url = args[1];
    if (!url) {
      console.log(kleur.red("\n  Usage: histrion scan <url>"));
      console.log(kleur.dim("  Example: histrion scan https://example.com/contact\n"));
      process.exit(1);
    }
    const testIdAttr = args.includes("--test-id-attr")
      ? args[args.indexOf("--test-id-attr") + 1] || "data-testid"
      : "data-testid";
    const headed = args.includes("--headed");
    const authFile = args.includes("--auth")
      ? args[args.indexOf("--auth") + 1]
      : undefined;
    await scan(url, testIdAttr, { headed, authFile });
    return;
  }

  // ── create ──
  if (args[0] === "create") {
    await scaffold(args[1]);
    return;
  }

  // ── no args or unknown ──
  if (args.length > 0) {
    console.log(kleur.red(`\n  Unknown command: ${args[0]}`));
    printUsage();
    process.exit(1);
  }
  printUsage();
}

main().catch(console.error);

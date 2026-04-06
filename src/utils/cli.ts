import { execSync } from "node:child_process";
import kleur from "kleur";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/**
 * Display a terminal spinner with a message.
 * Call `.stop(result)` to replace the spinner with a final status line.
 */
export function spinner(message: string): { stop: (result: string) => void } {
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r  ${kleur.cyan(FRAMES[i++ % FRAMES.length])} ${message}`);
  }, 80);

  return {
    stop(result: string) {
      clearInterval(id);
      process.stdout.write(`\r  ${result}\n`);
    },
  };
}

/**
 * Run a shell command synchronously with suppressed output.
 */
export function run(cmd: string, cwd: string): void {
  execSync(cmd, {
    cwd,
    stdio: "pipe",
    env: { ...process.env, FORCE_COLOR: "0" },
  });
}

/**
 * Read the system clipboard contents. Returns null if unavailable or empty.
 */
export function readClipboard(): string | null {
  const cmds: Record<string, string> = {
    darwin: "pbpaste",
    linux: "xclip -selection clipboard -o",
    win32: "powershell -command Get-Clipboard",
  };
  const cmd = cmds[process.platform];
  if (!cmd) return null;

  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

import { execFileSync } from "node:child_process";

export interface GitResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Runs `git <args>` in `root` via execFile with an argument array (no shell).
 * Never throws: a non-zero exit or a missing git binary yields `ok: false`.
 */
export function git(root: string, args: string[]): GitResult {
  try {
    const stdout = execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    return { ok: true, stdout, stderr: "" };
  } catch (e) {
    const err = e as { stdout?: unknown; stderr?: unknown; message?: unknown };
    const str = (v: unknown): string =>
      typeof v === "string" ? v : Buffer.isBuffer(v) ? v.toString("utf8") : "";
    const stderr = str(err?.stderr) || (typeof err?.message === "string" ? err.message : String(e));
    return { ok: false, stdout: str(err?.stdout), stderr };
  }
}

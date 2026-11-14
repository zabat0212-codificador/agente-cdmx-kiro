import type { StepResult, StepStatus } from "./types";

const MARKERS: Record<StepStatus, string> = {
  succeeded: "OK",
  skipped: "SKIP",
  failed: "FAIL",
};

/**
 * Formats the Bootstrap_Report: one line per result as
 * `[OK|SKIP|FAIL] <step> - <detail>` (the ` - <detail>` part is omitted when
 * there is no detail), followed by a totals line.
 */
export function formatReport(results: readonly StepResult[]): string {
  const counts: Record<StepStatus, number> = { succeeded: 0, skipped: 0, failed: 0 };
  const lines = results.map((r) => {
    counts[r.status] += 1;
    // Keep one line per result: collapse line breaks in the detail.
    const detail = r.detail?.replace(/\s*\r?\n\s*/g, " ").trim();
    const base = `[${MARKERS[r.status]}] ${r.step}`;
    return detail ? `${base} - ${detail}` : base;
  });
  lines.push(
    `Total: ${results.length} steps, ${counts.succeeded} succeeded, ${counts.skipped} skipped, ${counts.failed} failed`,
  );
  return lines.join("\n");
}

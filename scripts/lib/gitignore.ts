/**
 * Returns `existing` with each required entry appended if no line of
 * `existing` equals it (after trim). Existing content is preserved as-is and
 * in order; only missing entries are appended, each at most once.
 */
export function mergeGitignore(existing: string, required: readonly string[]): string {
  const present = new Set(existing.split(/\r?\n/).map((line) => line.trim()));
  const missing: string[] = [];
  for (const entry of required) {
    const key = entry.trim();
    if (key === "" || present.has(key)) continue;
    present.add(key);
    missing.push(key);
  }
  if (missing.length === 0) return existing;

  const separator = existing === "" || existing.endsWith("\n") ? "" : "\n";
  return existing + separator + missing.join("\n") + "\n";
}

/** True iff the folder listing has no entries other than ".gitkeep". */
export function needsGitkeep(entries: readonly string[]): boolean {
  return entries.every((entry) => entry === ".gitkeep");
}

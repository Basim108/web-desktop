/**
 * A folder name must have at least one non-whitespace character. Renaming
 * isn't part of this change's UI (see design.md non-goals), but the
 * validation is shared here so any path that saves a folder name —
 * present or future — enforces the same rule.
 */
export function isValidFolderName(name: string): boolean {
  return name.trim().length > 0;
}

import type { ProtectedRootId } from "./types";

/**
 * Chrome's protected top-level bookmark roots. These ids are stable across
 * profiles (unlike the ids of user folders/bookmarks), so the export keys its
 * top level by them and the import restores each item into the same root. The
 * roots themselves are never created or deleted — only their contents are.
 */
export const PROTECTED_ROOT_IDS: ProtectedRootId[] = ["1", "2", "3"];

/**
 * Display names for the protected roots, used to build a skipped entry's
 * absolute folder path in the import report (the export file does not store the
 * roots' own titles).
 */
export const ROOT_DISPLAY_NAMES: Record<ProtectedRootId, string> = {
  "1": "Bookmarks Bar",
  "2": "Other Bookmarks",
  "3": "Mobile Bookmarks",
};

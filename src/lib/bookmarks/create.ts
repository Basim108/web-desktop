import { isSafeNavigationUrl } from "./urlSafety";

export type BookmarkCreateError = "empty-title" | "unsafe-url";

export type BookmarkCreateResult =
  | { ok: true; node: chrome.bookmarks.BookmarkTreeNode }
  | { ok: false; error: BookmarkCreateError };

/**
 * Creates a folder via chrome.bookmarks.create — the extension's first
 * bookmark-creation path (previously it only read/edited/moved/removed
 * Chrome's existing store). The title is trimmed and an empty or
 * whitespace-only title is rejected, matching updateFolderTitle in edit.ts,
 * so an import can never produce a nameless folder. Returns the created node
 * because the caller needs its Chrome-assigned id to attach a custom icon.
 *
 * When `index` is given it is forwarded to chrome.bookmarks.create so the
 * folder lands at that position among its siblings (e.g. `0` for a first
 * child); omitting it keeps Chrome's default append-at-end behavior.
 */
export async function createFolder(
  parentId: string,
  title: string,
  index?: number,
): Promise<BookmarkCreateResult> {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "empty-title" };
  }
  const node = await chrome.bookmarks.create({
    parentId,
    title: trimmed,
    ...(index !== undefined && { index }),
  });
  return { ok: true, node };
}

/**
 * Creates a URL bookmark via chrome.bookmarks.create. Applies the same guards
 * updateBookmark enforces: the title is trimmed and rejected when empty, and
 * the url must pass the navigation safe-scheme allowlist (blocking
 * `javascript:`/`data:` etc.) before it is written into chrome.bookmarks.
 * Returns the created node so the caller can attach a custom icon by its id.
 */
export async function createBookmark(
  parentId: string,
  title: string,
  url: string,
): Promise<BookmarkCreateResult> {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "empty-title" };
  }
  if (!isSafeNavigationUrl(url)) {
    return { ok: false, error: "unsafe-url" };
  }
  const node = await chrome.bookmarks.create({ parentId, title: trimmed, url });
  return { ok: true, node };
}

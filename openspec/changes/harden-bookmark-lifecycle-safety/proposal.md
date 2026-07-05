## Why

A full-project code review (`code-reviews/0001-web-desktop.md`, findings #1, #3, #4) found that three pieces of already-shipped behavior were never captured as spec requirements: bookmark-click navigation had no URL-scheme validation, deleting a bookmark or folder left its settings/icon data orphaned forever, and folder drag-moves had no guard against cycles/protected roots or recovery from a rejected move. Claude Code fixed all three directly on `main` (commit `a6fd044`) without going through the change process, so the code and the specs are now out of sync. This change closes that gap by documenting the already-implemented behavior as spec requirements — no new implementation work.

## What Changes

- `bookmark-canvas`: the click-to-navigate requirement now validates the bookmark's URL scheme against an allowlist and blocks navigation for dangerous schemes (`javascript:`, `data:`, `chrome:`, etc.) instead of navigating unconditionally.
- `bookmark-canvas`: removing a bookmark or folder now cleans up its associated settings and grid-layout overrides (`bookmarkSettings`, `folderSettings`, `gridSettings`) instead of leaving them orphaned in storage.
- `bookmark-icons`: removing a bookmark now also deletes its custom icon blob from IndexedDB, instead of leaving it orphaned once the bookmark no longer exists.
- `folder-sidebar`: folder-to-folder drag nesting now rejects descendant-cycle drops and protected-root-folder moves before calling the bookmarks API, and reverts optimistic UI state (resyncs) if `chrome.bookmarks.move` is rejected for any other reason.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `bookmark-canvas`: "Bookmark Desktop Canvas Display" requirement gains URL-scheme validation before navigation; new requirement for settings/grid-override cleanup on bookmark/folder removal.
- `bookmark-icons`: new requirement for custom icon cleanup on bookmark removal (extends the existing user-initiated "Custom Icon Removal" requirement to also cover removal-triggered cleanup).
- `folder-sidebar`: "Folder-to-Folder Drag Nesting" requirement gains cycle/protected-root guards and resync-on-rejection behavior.

## Impact

- Code (already merged, no further implementation needed): `src/lib/bookmarks/urlSafety.ts` (new), `src/newtab/components/BookmarkIcon.tsx`, `src/lib/bookmarks/events.ts`, `src/lib/storage/folderSettings.ts`, `src/lib/bookmarks/dragResolve.ts`, `src/newtab/App.tsx`, `src/newtab/hooks/useSubfolders.ts`.
- Specs: `openspec/specs/bookmark-canvas/spec.md`, `openspec/specs/bookmark-icons/spec.md`, `openspec/specs/folder-sidebar/spec.md`.
- No API, dependency, or user-facing scope changes — this documents existing shipped behavior.
- Out of scope: findings #2, #5, #6, #7, #8, #9, #10, #11 from the same review (dev-process, infra, and code-quality items, not product capability).

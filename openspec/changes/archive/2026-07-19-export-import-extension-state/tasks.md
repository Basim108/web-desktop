# Tasks

## 1. Format version + file types
- [x] 1.1 Add `src/lib/transfer/version.ts`: `EXPORT_FORMAT_VERSION = "1.0.0"` constant, a `parseVersion(v)` that returns `{major,minor,patch}` or undefined for a non-`x.y.z` string, and a `checkImportCompatibility(fileVersion)` returning `ok` / `too-old` / `too-new` / `invalid`.
- [x] 1.2 Add `src/lib/transfer/types.ts`: `ExportFileV1`, the folder/bookmark node shapes (inline `settings`, `position`, `icon`), the `general` block, and the report-record shape.
- [x] 1.3 Unit-test version parsing/compatibility (equal major → ok; lower → too-old; higher → too-new; missing/garbage → invalid).

## 2. Data-URL <-> Blob helpers
- [x] 2.1 Reuse `src/lib/import/dataUrl.ts` `dataUrlToBlob`; add a `blobToDataUrl(blob)` encoder (FileReader/`arrayBuffer`+base64) for export.
- [x] 2.2 Unit-test round-trip (Blob → data URL → Blob preserves bytes + MIME).

## 3. Export core
- [x] 3.1 Add `src/lib/transfer/exportState.ts`: read the full tree (`getFolderTree`), walk each protected root's subtree, and for each node inline its settings, bookmark position (from the positions snapshot), and custom icon (`getIcon` → `blobToDataUrl`).
- [x] 3.2 Assemble the `general` block: general settings, sidebar width, and the two global images (canvas background + default folder icon → data URLs, or null when absent).
- [x] 3.3 Return the assembled `ExportFileV1` object stamped with `EXPORT_FORMAT_VERSION`.
- [x] 3.4 Unit-test: a seeded tree + settings + positions + icons produces the expected id-free object with icons inlined and the correct version.

## 4. Download + filename helpers
- [x] 4.1 Add `src/lib/transfer/download.ts`: `downloadJson(obj, filename)` (Blob + object URL + transient `<a download>` + revoke), `exportFileName(date)` → `YYYY-MM-DD-HH-mm-bookmark-desktop.json`, and `reportFileName(importFileName)` → `<name>-report.json`.
- [x] 4.2 Unit-test the filename formatters (timestamp padding; extension stripping for the report name).

## 5. Import lock (cross-context)
- [x] 5.1 Background (`events.ts` / `registerBookmarkListeners`): add an in-memory `transferImportLocked` flag and a `chrome.runtime.onMessage` handler (`{type:"transfer:setLock", locked}` → set flag, `sendResponse` ack); early-return from the `onCreated`/`onRemoved`/`onMoved` handlers while locked.
- [x] 5.2 Newtab (`events.ts` / `subscribeToBookmarkChanges`): route subscriber callbacks through a guard; add `suspendBookmarkSubscribers()` / `resumeBookmarkSubscribers()` that no-op callbacks while suspended.
- [x] 5.3 Add a `transferLock` helper the importer uses: `acquire()` = `await` background set-lock ack + `suspendBookmarkSubscribers()`; `release()` = idempotent/unconditional — resume local subscribers + `forceBookmarkResync()` + best-effort background clear-lock ack, safe to call even if never/partially acquired. The importer wraps acquire→body in `try` with `release()` in `finally`; the parse+version gate and backup prompt run *before* `acquire()`.
- [x] 5.4 Unit-test the lock: handlers no-op while locked and resume after unlock; the ack round-trip is awaited before delete/create; release still runs (and listeners resume) when the import body throws; a pre-flight denial never calls `acquire()` and leaves listeners untouched; a partial acquire is fully undone by `release()`.

## 6. Import core (replace strategy)
- [x] 6.1 Add `src/lib/transfer/importState.ts` entry: parse JSON (deny on parse failure), then `checkImportCompatibility` (deny with distinct too-old / too-new / invalid messages) — before any lock or deletion.
- [x] 6.2 Acquire the import lock, then delete phase: for each protected root `1`/`2`/`3`, read direct children and remove each (`removeTree` for folders, `remove` for leaves); never touch roots `0/1/2/3`.
- [x] 6.3 Recreate phase (DFS per root): `createFolder`/`createBookmark` for each node, building a node→newId map; attach inline icons via `dataUrlToBlob` → validate → `putIcon` + set-has-custom-icon (bad icon falls back, not a skip).
- [x] 6.4 Restore positions per folder (`setFolderPositions(newFolderId, map)`) after its children exist — a plain authoritative write, no competing writer under the lock; restore per-bookmark settings under new ids.
- [x] 6.5 Restore the `general` block: sidebar width, general settings, and the two global images (put when present, delete/clear when null).
- [x] 6.6 Release the lock in a `finally` after all creation + restoration completes (or on failure).
- [x] 6.7 Accumulate the skip report: empty/whitespace title or unsafe url → skip; a skipped folder takes its descendants; record `{ absoluteFolderPath, name, url, reason }` built from the DFS path.
- [x] 6.8 Return a result: `{ ok, denied? | aborted?, foldersCreated, bookmarksCreated, skipped }`.

## 7. Unit tests for import
- [x] 7.1 Denials: non-JSON, missing/garbage version, lower major, higher major each deny and change nothing (and never acquire the lock).
- [x] 7.2 Replace: pre-existing non-root bookmarks are all removed; roots survive; the file's tree is recreated under the right roots.
- [x] 7.3 State restore: positions, per-item settings, and custom icons land under the new ids; positions match the file exactly (no auto-placement interference under the lock).
- [x] 7.4 General restore: sidebar width + general settings + both global images restored; null image clears the existing one.
- [x] 7.5 Skip-and-report: blank title / unsafe url skipped and recorded with correct absolute path + reason; a failing folder carries its descendants into the count; a bad icon does not skip its item.

## 8. General Settings UI
- [x] 8.1 In `GeneralSettingsWindow.tsx` add Export and Import buttons to the actions footer, left-aligned, with Save staying right-aligned; add a hidden `<input type="file" accept=".json,application/json">` for Import. Change `.general-settings-window-actions` to `justify-content: space-between` with a left button group.
- [x] 8.2 Wire Export → `exportState` → `downloadJson`, then close the window on success. Wire Import → file read → parse/version gate → backup confirmation (Yes runs export first) → `importState` → download report when skips > 0, then close the window on success.
- [x] 8.3 On an import pre-flight denial (unparseable JSON / incompatible major / invalid version) keep the window open and show the denial message; guard against double-invocation by disabling all three footer buttons while any run is in flight.
- [x] 8.4 Style the footer buttons, confirmation, and denial messaging in `main.css` to match the settings-window look.
- [x] 8.5 Component tests: footer shows Export/Import left + Save right; Export triggers a download and closes; a chosen valid file drives the import and closes; backup confirmation gates the replace; a denied file keeps the window open with a message.

## 9. Verification
- [x] 9.1 Playwright e2e: seed a folder/bookmark with a background, Export, wipe, then Import the file and assert the tree and background are restored.
- [x] 9.2 Run typecheck, lint, unit, and e2e green.
- [x] 9.3 `openspec validate export-import-extension-state --strict` passes.

## 10. Manual-testing fixes (amendment)
- [x] 10.1 Fix 1 — roots record their title: add `title` to `ExportRoot` (`types.ts`); set it in `exportState` from the live root node; in `importState` use the file's root title for `absoluteFolderPath`, falling back to `ROOT_DISPLAY_NAMES`. Update export/import unit tests to assert the title round-trips.
- [x] 10.2 Fix 2a — collapse `importState` hooks to a single `confirmImport(): Promise<"backup" | "no-backup" | "cancel">` (cancel → aborted; backup → `performBackup` then proceed; no-backup → proceed). Update `importState` unit tests accordingly.
- [x] 10.3 Fix 2b — add a custom Yes/No/Cancel confirmation dialog to `GeneralSettingsWindow` (replacing both `window.confirm` calls), wired to resolve `confirmImport`; warns that import replaces everything. Style it to match the window.
- [x] 10.4 Fix 3a — add `.catch` to the fire-and-forget `getBookmarksInFolder`/`getSubfolders` reads in `useGridLayout.ts` and `useSubfolders.ts` so a vanished-folder read fails silently (also fixes the pre-existing native-delete crash).
- [x] 10.5 Fix 3b — reload the new-tab page on import success (after any report download) instead of just closing the window; keep denial keeping the window open with a message.
- [x] 10.6 Fix 3c (robustness) — in the recreate phase, skip a file root that has no live counterpart rather than letting `chrome.bookmarks.create` throw "Can't find bookmark for id".
- [x] 10.7 Update component + e2e tests: dialog shows Yes/No/Cancel and gates the replace; a successful import reloads the page; e2e clicks the dialog buttons instead of driving `page.on("dialog")`.
- [x] 10.8 Re-run typecheck, lint, unit, e2e green; `openspec validate export-import-extension-state --strict` passes.

## 11. Second-round manual-testing fixes (amendment 2)
- [x] 11.1 Fix 4 — size the confirmation to its own content: while `confirmOpen`, render only the confirmation inside `.general-settings-window` (skip titlebar/body/footer) so the window collapses to the confirmation's natural height; drop the full-window `inset: 0` stretch. Verify against the live window that the dead space is gone.
- [x] 11.2 Fix 6a — remove the `rootExists` pre-check guard in `importState`'s recreate loop; instead wrap each root's `createChildren` so a failure to create into the root records that root's subtree in the skip report (new reason, e.g. `root-unavailable`) rather than silently skipping or throwing.
- [x] 11.3 Fix 6b — add a `SkipReason` value for an unavailable root and a helper to record a whole file-root subtree as skipped; unit-test that a file root with no live counterpart is reported (not silently dropped) and that a present root (incl. an emptied one) still recreates its contents.
- [x] 11.4 Fix 5 — when an import succeeds with `skipped.length > 0`, show an in-window summary ("Import finished with N issue(s); see `<name>-report.json`") and reload only after the user acknowledges (OK/Reload); a clean import still reloads immediately. Download the report before showing the summary.
- [x] 11.5 Update component tests: confirmation is content-sized (no full-window stretch); a skipped-entries import shows the summary and reloads only on acknowledge; a clean import reloads immediately.
- [x] 11.6 Manual re-test done — Mobile still not restored; escalated to create-before-delete (see section 12 / Amendment 3).
- [x] 11.7 Re-run typecheck, lint, unit, e2e green; `openspec validate export-import-extension-state --strict` passes.

## 12. Create-before-delete + report windows (amendment 3)
- [x] 12.1 Fix 7 — restructure `importState`'s delete/recreate into an interleaved per-root pass: snapshot `getFolderChildren(rootId)` (if it throws → root absent: report any file content as `root-unavailable`, continue); if the file has content, `createChildren` into the root FIRST; then `removeTree`/`remove` each snapshotted old id LAST. Remove the separate `deleteAllContents` upfront phase.
- [x] 12.2 Fix 7 — on a create-into-root failure, record the file root's subtree as `root-unavailable` and skip that root's old-child deletion (don't half-empty a root we couldn't restore).
- [x] 12.3 Unit-test: a present (non-permanent-style) root keeps its content restored under create-before-delete; old children are gone and new children remain in export order; an absent root is reported `root-unavailable`; roots `1`/`2` still fully replace.
- [x] 12.4 Fix 8 — add an "Import Bookmarks" titlebar to both the confirmation and the post-import summary panels in `GeneralSettingsWindow`; summary keeps the "N item(s) could not be imported — see `<name>-report.json`" body + Reload. Style the titlebar to match the settings window.
- [x] 12.5 Update component tests: both import windows show the "Import Bookmarks" title.
- [x] 12.6 Re-run typecheck, lint, unit, e2e green; `openspec validate export-import-extension-state --strict` passes.
- [x] 12.7 Manual re-test in real Chrome: a backup containing Mobile bookmarks restores Mobile (create-before-delete); a file with a truly-absent root is reported, not crashed.

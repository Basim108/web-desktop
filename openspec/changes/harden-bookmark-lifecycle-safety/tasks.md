## 1. URL scheme validation (already implemented in commit `a6fd044`)

- [x] 1.1 Add scheme allowlist in `src/lib/bookmarks/urlSafety.ts`
- [x] 1.2 Gate `window.location.assign` in `src/newtab/components/BookmarkIcon.tsx` behind the allowlist check
- [x] 1.3 Cover allowed and blocked schemes in `src/lib/bookmarks/urlSafety.test.ts`

## 2. Removal-triggered data cleanup (already implemented in commit `a6fd044`)

- [x] 2.1 Call `removeBookmarkSettings` from the `onRemoved` handler in `src/lib/bookmarks/events.ts`
- [x] 2.2 Add `removeFolderSettings` to `src/lib/storage/folderSettings.ts` and call it on folder removal
- [x] 2.3 Call `clearGridSettingsOverride` on folder removal
- [x] 2.4 Delete the bookmark's custom icon blob from IndexedDB on removal
- [x] 2.5 Cover bookmark and folder removal cleanup in `src/lib/bookmarks/events.test.ts`

## 3. Folder drag-move safety (already implemented in commit `a6fd044`)

- [x] 3.1 Add descendant-cycle guard to `resolveCrossFolderDrop` in `src/lib/bookmarks/dragResolve.ts`
- [x] 3.2 Add protected-root-folder guard to `resolveCrossFolderDrop`
- [x] 3.3 Resync sidebar state on a rejected `chrome.bookmarks.move` in `src/newtab/App.tsx` / `src/newtab/hooks/useSubfolders.ts`
- [x] 3.4 Cover cycle, protected-root, and rejection-resync cases in `src/lib/bookmarks/dragResolve.test.ts`

## 4. Spec/documentation sync (this change)

- [x] 4.1 Write proposal.md, design.md, and delta specs for `bookmark-canvas`, `bookmark-icons`, `folder-sidebar`
- [ ] 4.2 Review the delta specs against the actual shipped behavior one more time before archiving
- [ ] 4.3 Run `openspec archive harden-bookmark-lifecycle-safety` to merge the deltas into `openspec/specs/`

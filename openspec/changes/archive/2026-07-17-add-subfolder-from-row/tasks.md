## 1. Folder creation primitive

- [x] 1.1 Extend `createFolder` in `src/lib/bookmarks/create.ts` to accept an optional `index` and forward it to `chrome.bookmarks.create({ parentId, title, index })`; keep the empty-name guard and the existing append behavior when `index` is omitted.
- [x] 1.2 Add/extend a unit test in `src/lib/bookmarks/create.test.ts` covering indexed placement (`index: 0` creates a first child) and the unchanged append-at-end path.

## 2. New-folder (draft) mode in the settings window

- [x] 2.1 Add a create/draft mode to `FolderSettingsWindow.tsx` (a `mode` flag or an absent `folder` node) that carries the parent folder id instead of an existing node.
- [x] 2.2 In draft mode, start the name empty (Save stays disabled until non-empty via the existing `nameValid` gate), title the window for a new folder, show the default-icon preview, and hide the "Remove folder" action.
- [x] 2.3 Branch the Save handler: in draft mode call `createFolder(parentId, name, 0)`, then, if an icon is staged, `putIcon(newId, file)` + `setFolderHasCustomIcon(newId, true)` using the returned id; keep the existing edit-mode path unchanged.
- [x] 2.4 Ensure close / Escape / backdrop discards the draft with no Chrome or icon-storage writes (reuse the existing staged-state discard; verify the object-URL cleanup still runs).

## 3. Add-subfolder button in the folder row

- [x] 3.1 Render an "add subfolder" button on every `FolderTreeNode` row (root and non-root), placed next to the settings gear's position on the same line.
- [x] 3.2 Apply the same hover/focus reveal as `folder-settings-toggle` (hidden at rest, revealed on row hover or button focus, keyboard-reachable, no layout shift) in the sidebar CSS.
- [x] 3.3 Wire the button to open the settings window in draft mode for a subfolder of that row's folder, coordinated through the lifted single-window state in `Sidebar.tsx` so opening a draft closes any open edit/draft window.
- [x] 3.4 On successful save, expand the parent row so the new first-child subfolder is visible, then close the window.
- [x] 3.5 Add a tooltip "Create Folder" to add folder button and "Folder Settings" to geer button.

## 4. Tests

- [x] 4.1 Unit-test `FolderTreeNode.test.tsx`: button present on root and non-root rows, hidden at rest / revealed on hover+focus without layout shift, and click opens a draft window.
- [x] 4.2 Unit-test `FolderSettingsWindow.test.tsx`: draft mode hides Remove, blocks save on empty name, creates a first-child folder on save, applies a staged icon by the new id, and writes nothing on close/Escape/backdrop.
- [x] 4.3 Add e2e coverage: add-subfolder → name → Save creates a first-child folder visible in the sidebar and other open tabs; add-subfolder → close without saving creates nothing.

## 5. Verification

- [x] 5.1 Run typecheck, lint, unit, and e2e; confirm all green.
- [x] 5.2 Validate the change with `openspec validate add-subfolder-from-row --strict` and fix any reported issues.

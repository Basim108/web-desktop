## 1. Remove native list markers and default list box model

- [x] 1.1 In `src/newtab/main.css`, add a rule targeting `.folder-tree` and `.folder-children` with `list-style: none; margin: 0; padding: 0;`.

## 2. Single-line folder row layout

- [x] 2.1 Add `display: flex; align-items: center;` to `.folder-row`.
- [x] 2.2 Add `flex: 1; min-width: 0;` to `.folder-select` so it fills remaining row space without pushing the settings-toggle off-row, and so `.folder-label`'s existing `text-overflow: ellipsis` has a constrained width to truncate against.
- [x] 2.3 Add fixed, matching width/height to `.folder-expand-toggle` and `.folder-expand-spacer` so rows with and without children align identically; strip default browser button chrome (border/background/padding) from `.folder-expand-toggle`.
- [x] 2.4 (Discovered during verification) Add `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;` to `.folder-label` — design.md's rationale for 2.2 incorrectly assumed this already existed (copying `.bookmark-icon-label`'s pattern); without it, longer folder names wrap onto a second line, inflating that row's height and breaking single-line/row-height-consistency.

## 3. Verification

- [x] 3.1 Run the test suite to confirm no existing tests assert on the old (unstyled) layout.
- [x] 3.2 Manually load the new-tab page with a folder tree containing at least one nested subfolder and confirm: no bullet marker appears anywhere in the tree, every row's expand-toggle/icon+name/settings-button render on one line, rows with and without children align their icon+name to the same x-position, and per-depth indentation still increases correctly for nested subfolders.

## 1. Strip default button chrome

- [x] 1.1 In `src/newtab/main.css`, add `background: none; border: none; padding: 0; font: inherit; color: inherit;` to `.folder-select` (keeping its existing `display: flex; align-items: center; flex: 1; min-width: 0; gap: 3px; cursor: pointer;`).
- [x] 1.2 Add the same chrome-stripping rule (`background: none; border: none; padding: 0; font: inherit; color: inherit; cursor: pointer;`) to `.folder-settings-toggle`, which currently has no CSS at all.

## 2. Move the highlight to row scope

- [x] 2.1 In `src/newtab/main.css`, replace the `.folder-select:hover, .folder-select--over { background: ...; border-radius: 4px; }` rule with `.folder-row:hover, .folder-row--over, .folder-row--active { background: ...; border-radius: 4px; }`, reusing the same background color value. Leave `.folder-select--dragging` untouched.
- [x] 2.2 In `src/newtab/components/FolderTreeNode.tsx`, move the `isOver`-driven class from `.folder-select`'s `className` to `.folder-row`'s `className` (alongside the existing `isActive`-driven `folder-row--active` class), so `.folder-row`'s className becomes `folder-row${isActive ? " folder-row--active" : ""}${isOver ? " folder-row--over" : ""}`. Remove the now-unused `folder-select--over` from `.folder-select`'s className, keeping `folder-select--dragging` there unchanged.

## 3. Consistent row height

- [x] 3.1 In `src/newtab/main.css`, add `min-height: 24px;` to `.folder-row`, and `min-height: 32px;` to `.folder-row` inside the existing `@media (min-width: 1024px)` block that already sizes `.folder-select .custom-icon` to 32px, so every row is at least as tall as an icon would make it, at both tiers.

## 4. Edge spacing

- [x] 4.1 In `src/newtab/main.css`, add `padding: 3px 3px 3px 0;` to `.folder-row` (top/right/bottom 3px, left 0 — left indentation stays governed by the existing inline `paddingLeft`).

## 5. Verification

- [x] 5.1 Run the test suite and confirm nothing regresses.
- [x] 5.2 Manually load the new-tab page and confirm: folder rows are transparent at rest with no separate button-shaped boxes around the icon+name or the gear button, hovering any part of a row (including the gear button and expand-toggle) highlights the whole row, the currently-active folder shows a persistent highlight, and dragging a bookmark or folder over another folder row highlights that full row.
- [x] 5.3 Manually confirm folder rows all render at the same height regardless of each folder's icon/label display setting, at both the below-1024px and at/above-1024px viewport tiers.
- [x] 5.4 Manually confirm approximately 3px of visible spacing separates the settings button from the sidebar's right border, and approximately 3px separates stacked rows vertically, without affecting the existing per-depth left indentation.

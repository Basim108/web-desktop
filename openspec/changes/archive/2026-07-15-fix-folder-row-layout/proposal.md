## Why

The sidebar's folder tree renders visibly broken today: each row shows a bullet-point dot before the expand triangle (the native `<ul>`/`<li>` list marker was never suppressed), and the expand-toggle, icon+name, and settings button render on three separate lines instead of one row (`.folder-row` has no `display` rule, so its `.folder-select` child's own `display: flex` blockifies into a full-width box that breaks the row). Both are unstyled-default-HTML artifacts, not intentional design.

## What Changes

- `.folder-tree` (`Sidebar.tsx`) and `.folder-children` (`FolderTreeNode.tsx`) — both native `<ul>` elements — get `list-style: none; margin: 0; padding: 0;` in `main.css`, removing the bullet marker and the browser's default list indent/margin (existing per-depth indentation is already handled explicitly via `.folder-row`'s inline `paddingLeft: depth * 16`, so the native `<ul>` padding was redundant/compounding, not load-bearing).
- `.folder-row` gets `display: flex; align-items: center;` so its three children (expand-toggle/spacer, `.folder-select`, settings-toggle) lay out as flex items in a single row instead of `.folder-select`'s own `display: flex` blockifying into a full-width box that breaks the row.
- `.folder-select` gets `flex: 1; min-width: 0;` so it takes the remaining row space (rather than growing to consume the whole row) and so `.folder-label`'s existing `text-overflow: ellipsis` has an actual constrained width to truncate against.
- `.folder-expand-toggle` and `.folder-expand-spacer` (currently entirely unstyled — no CSS rule exists for either) get a consistent fixed width/height so rows with children and rows without align identically, and the toggle button loses its default browser button chrome (border/background/padding).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `folder-sidebar`: a new requirement is added covering the folder row's overall single-line layout (expand-toggle, icon+label, settings button together) and the absence of any native list marker — distinct from the existing "Folder Row Icon and Label Alignment" requirement, which only covers the icon+label pairing inside `.folder-select`.

## Impact

- `src/newtab/main.css` — new/updated rules for `.folder-tree`, `.folder-children`, `.folder-row`, `.folder-select`, `.folder-expand-toggle`, `.folder-expand-spacer`. No component/markup changes required — this is CSS-only.
- No change to `FolderTreeNode.tsx`, `Sidebar.tsx`, drag/drop behavior, or any other sidebar functionality.

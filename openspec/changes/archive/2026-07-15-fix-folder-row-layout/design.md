## Context

`Sidebar.tsx` renders `<ul className="folder-tree">`, and each `FolderTreeNode` renders `<li><div className="folder-row">...</div>{expanded && <ul className="folder-children">...}</li>`, recursively nesting a `<ul>` per depth level for expanded subfolders. Neither `.folder-tree` nor `.folder-children` has any CSS rule in `main.css` today, so both inherit the browser's default `<ul>` stylesheet: `list-style-type: disc` (the bullet dot) and `padding-inline-start: 40px` (a fairly large default indent) plus default `margin`.

Separately, `.folder-row` (the flex-row candidate holding the expand-toggle, `.folder-select`, and settings-toggle) has no `display` rule — it's a plain block `<div>`. Its child `.folder-select` independently sets `display: flex`, which blockifies that button into a full-width block box (block-level boxes always start a new line and stretch to their container's width), breaking the row across three lines instead of laying its siblings out beside it.

`.folder-expand-toggle` and `.folder-expand-spacer` also have no CSS at all, so the toggle renders with default browser button chrome and the spacer has no defined width — rows with children and without won't align consistently even once the flex fix lands.

## Goals / Non-Goals

**Goals:**
- Remove the native list bullet marker from both `.folder-tree` and `.folder-children`.
- Make each folder row's expand-toggle, icon+label, and settings button render on a single line.
- Keep existing per-depth indentation (`.folder-row`'s inline `paddingLeft: depth * 16`) as the sole source of indent, removing the browser's default `<ul>` padding that was compounding on top of it at every nesting level.
- CSS-only change — no markup or behavior changes.

**Non-Goals:**
- Not changing the existing "Folder Row Icon and Label Alignment" requirement (icon+label pairing inside `.folder-select`) — that requirement and its CSS (`gap: 3px`, `align-items: center`) already work correctly and are unaffected.
- Not changing drag-and-drop, hover affordance, or settings-popup behavior.
- Not changing the 16px-per-depth indentation amount itself.

## Decisions

**1. `list-style: none; margin: 0; padding: 0;` on both `.folder-tree` and `.folder-children`, not just `list-style: none`.** Alternative considered: only suppress the bullet (`list-style: none`) and leave the browser's default `padding-inline-start: 40px` in place, since it doesn't visually break anything by itself. Rejected — that default padding compounds at every nesting level (each nested `<ul>` adds another 40px on top of the previous level's), stacking on top of `.folder-row`'s own explicit `depth * 16` indent; a deeply nested folder tree would indent far more aggressively than the depth-based value alone implies. Zeroing the native `<ul>` box model makes `.folder-row`'s inline padding the single, predictable source of indentation.

**2. `.folder-row` becomes the flex container; `.folder-select` becomes a flex item within it via `flex: 1; min-width: 0`.** Alternative considered: change `.folder-select` from `display: flex` to `display: inline-flex` instead of touching `.folder-row` at all — an inline-flex box doesn't blockify, so it would sit inline next to its siblings without a `.folder-row` layout change. Rejected — even as `inline-flex`, `.folder-select` and its siblings would only be as tall as their content and wouldn't reliably vertically-center against each other without also coordinating `vertical-align` across three independently-styled elements (button default chrome differs from span default), which is fragile. Making `.folder-row` the single flex container with `align-items: center` centers all three children consistently in one place, and is the same pattern already used successfully for `.folder-select`'s own internal icon+label layout and for `.bookmark-icon`'s column layout elsewhere in this file.

Correction discovered during verification: this decision's original rationale assumed `.folder-label` already had `text-overflow: ellipsis` (by analogy with `.bookmark-icon-label`). It did not — `.folder-label` had no overflow handling at all, so `min-width: 0` alone let long names wrap onto a second line instead of truncating, inflating that row's height. Fixed by adding the same `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;` `.bookmark-icon-label` already uses.

**3. Fixed width/height on `.folder-expand-toggle`/`.folder-expand-spacer`, chrome stripped from the toggle button.** Needed so a row with children (real toggle button) and a row without (spacer) occupy identical horizontal space — otherwise every row's icon/label would start at a different x-offset depending on whether that particular folder happens to have subfolders.

## Risks / Trade-offs

- **[Risk] Zeroing `<ul>` margin/padding could theoretically affect other list styling if `.folder-tree`/`.folder-children` selectors are reused elsewhere.** → **Mitigation**: grepped — these two class names are only used in `Sidebar.tsx` and `FolderTreeNode.tsx`, nowhere else.
- **[Risk] Making `.folder-select` `flex: 1` changes its sizing behavior** (previously an unconstrained flex item, now explicitly filling remaining row space). → **Mitigation**: this is the intended fix — without it, the settings-toggle button has no guaranteed space and could be squeezed off-row by a long folder name; `min-width: 0` is required alongside `flex: 1` for the existing `text-overflow: ellipsis` on `.folder-label` to actually engage (flex items default to `min-width: auto`, which lets content overflow rather than truncate).

## Open Questions

None — root causes were confirmed directly in the code (no CSS rules exist for `.folder-tree`, `.folder-children`, `.folder-expand-toggle`, `.folder-expand-spacer`, and `.folder-row` has no `display` rule), and the fix approach was reasoned through during exploration.

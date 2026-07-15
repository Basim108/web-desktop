## Why

Each folder row currently renders with two separate visible background boxes instead of one: `.folder-select` (wrapping the icon and name together) and `.folder-settings-toggle` (the gear button) are both native `<button>` elements that were never stripped of the browser's default button chrome (background/border/padding), so they show as two distinct boxes rather than one seamless row. The existing hover highlight is also scoped only to `.folder-select`, so hovering the gear button does nothing — even though the "Folder Row Hover Affordance" spec requirement already says the whole row should highlight. Separately, there's currently no visual indication at all of which folder is the active/selected one in the sidebar. Finally, `.folder-row` has no height rule of its own, so it sizes to whatever content happens to be tallest — rows displaying a custom icon (24px/32px tall image) end up taller than rows showing only a name (just text line-height), giving the tree an uneven, jagged row height depending on each folder's display setting.

## What Changes

- `.folder-select` and `.folder-settings-toggle` get their default `<button>` chrome stripped (`background: none; border: none; padding: 0; font: inherit; color: inherit;`), matching the treatment `.folder-expand-toggle` already received in the prior row-layout fix.
- The hover/drag-over background highlight moves from `.folder-select:hover, .folder-select--over` to `.folder-row:hover, .folder-row--over` — covering the entire row (expand-toggle, icon+name, settings button together), not just the icon+name sub-area.
- A new `.folder-row--active` state is added to the same highlight rule, so the currently-selected folder shows a persistent version of the same background — visually "hover, but fixed" for whichever folder is active. (The `folder-row--active` class already exists in `FolderTreeNode.tsx`'s JSX from the `isActive` check; it currently has no corresponding CSS.)
- The `isOver` boolean (drag-over-this-folder state) moves from driving a class on the `folder-select` button to driving a class on the `folder-row` div, so its visual also targets the full row. The actual drop hit-area (`useDroppable`'s ref, still on `folder-select`) is unchanged — only where the resulting highlight paints, not what counts as "dropping onto this folder."
- `.folder-select--dragging` (the semi-transparent "this folder is being picked up" effect while dragging it as a source) is left exactly as-is — a different concern from the background/highlight consolidation.
- `.folder-row` gets a `min-height` matching the folder icon's own size at each viewport tier (24px below 1024px, 32px at 1024px and above — the same breakpoint `.folder-select .custom-icon` already uses), so every row is the same height regardless of whether that particular folder currently displays an icon.
- `.folder-row` gets `3px` of padding on its top, bottom, and right edges (left stays governed by the existing per-depth inline indent). Today `.folder-row` and its ancestors (`.sidebar-scroll-area`, `.folder-tree`/`.folder-children`) have zero padding anywhere, so the settings-toggle button sits flush against the sidebar's right border, and stacked rows touch each other directly with no vertical breathing room.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `folder-sidebar`: "Folder Row Hover Affordance" requirement is updated to explicitly describe the highlight covering the full row (not just the icon+name sub-area) and to add the active-folder's persistent highlight as a new scenario.

## Impact

- `src/newtab/main.css` — `.folder-select`, `.folder-settings-toggle`, `.folder-row` (and its hover/over/active states) all get updated rules; the old `.folder-select:hover`/`.folder-select--over` rule is removed.
- `src/newtab/components/FolderTreeNode.tsx` — the `isOver`-driven className moves from the `folder-select` button's `className` to the `folder-row` div's `className` (alongside the existing `isActive`-driven class). No change to `useDraggable`/`useDroppable` refs or hit-target behavior.
- No test (unit or e2e) references the specific state-modifier classes being moved (`.folder-select--over`) — only the stable `.folder-row` container class is used in e2e locators — so this is a low-risk restructuring confirmed safe by search beforehand.

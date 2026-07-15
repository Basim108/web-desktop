## Context

Each `FolderTreeNode` renders a `.folder-row` div containing three `<button>`-family children: `.folder-expand-toggle` (or a non-interactive `.folder-expand-spacer`), `.folder-select` (wrapping the folder icon and name), and `.folder-settings-toggle` (the gear button). `.folder-expand-toggle` had its default browser button chrome stripped in the prior row-layout fix (`background: none; border: none; padding: 0;`), but `.folder-select` and `.folder-settings-toggle` never got the same treatment, so both still render with the browser's default button background/border/padding — appearing as two separate boxes within the row instead of one seamless one.

The hover highlight is currently defined as `.folder-select:hover, .folder-select--over { background: ...; border-radius: 4px; }` — scoped to the icon+name button only. The existing "Folder Row Hover Affordance" spec requirement already describes highlighting "a folder's sidebar row" (not just its icon+name sub-area), so the current implementation doesn't fully match its own spec's wording.

`isActive` (whether this folder is the one currently shown on the canvas) already drives a `folder-row--active` class in the JSX, but no CSS rule targets that class today — there is no visual indication of the active folder anywhere in the sidebar.

`.folder-row` also has no height rule at all — it's sized purely by flexbox content-fitting (`display: flex; align-items: center;`, no `min-height`). A row whose folder currently displays a custom icon contains a 24px (or 32px at ≥1024px viewport, per `.folder-select .custom-icon`'s existing breakpoint) image, while a label-only row contains just a text span at line-height. Since flexbox sizes the container to its tallest child, icon rows and label-only rows end up different heights, and rows visibly jump in height as the "Folder Sidebar Display Setting" popup is used to toggle a folder between icon/label-only/both.

`.folder-row` also has zero padding, and neither does anything above it in the DOM chain (`.sidebar-scroll-area`, `.folder-tree`/`.folder-children`). The only padding present anywhere is the inline `paddingLeft: depth * 16` each row sets for its own indentation. With no padding on any other edge, the settings-toggle button sits flush against `.sidebar`'s `border-right`, and stacked rows have no vertical gap between them.

## Goals / Non-Goals

**Goals:**
- One consistent, transparent-at-rest background for the whole folder row, highlighted (same color) on hover, on drag-over, and persistently for the active/selected folder.
- Strip default `<button>` chrome from `.folder-select` and `.folder-settings-toggle` so they no longer render as their own separate boxes.
- Every folder row is the same height, whether or not that folder currently displays an icon — sized as if every row showed an icon.
- Every row has 3px of breathing room on top, bottom, and right, so the settings button doesn't visually touch the sidebar's border and adjacent rows don't touch each other.

**Non-Goals:**
- Not changing the drag-over drop hit-area/target — it stays bound to `.folder-select` exactly as today; only the highlight's visual scope widens to the row.
- Not changing `.folder-select--dragging`'s opacity/cursor treatment (the "being picked up" effect on the drag source) — a different concern from background/highlight.
- Not changing folder icon sizing, label truncation, or any other aspect touched by the prior row-layout fix.
- Not changing the icon size breakpoint itself (24px/32px at 1024px) — the row height simply tracks whatever that breakpoint already resolves to, rather than introducing an independent height value.
- Not changing left-edge padding/indentation — that stays exactly the existing per-depth inline `paddingLeft`.

## Decisions

**1. Hover, drag-over, and active all share one CSS rule.** Since the user confirmed drag-over should stay visually identical to hover, and active should be "the same hover style, but fixed," all three states collapse into a single selector group (`.folder-row:hover, .folder-row--over, .folder-row--active`) rather than three separate declarations that could drift apart. This mirrors the same "avoid duplicated tiers that can silently diverge" reasoning used for `resolveTier()` in the grid-sizing work.

**2. `isOver`'s class moves to `.folder-row`; the droppable ref does not.** Alternative considered: also move `useDroppable`'s ref from `.folder-select` to `.folder-row`, so the actual drop-acceptance hit-area matches the highlighted area exactly. Rejected for this change — widening the hit-area is a behavior change beyond what was asked (visual consolidation only), and the existing hit-area (icon+name sub-area) has worked correctly in production; conflating a hit-area change with a pure CSS consolidation risks introducing an unrelated regression. Flagged as a possible future refinement, not part of this change.

**3. `.folder-select--dragging` stays put, unrenamed.** It's applied to and styles the drag *source* row while it's being lifted (`opacity: 0.5`), which is orthogonal to the rest/hover/active background story. Moving it to `.folder-row` for naming consistency was considered and rejected as unnecessary churn — it already works correctly and isn't part of what's being consolidated.

**4. `.folder-row` gets `min-height` (not a fixed `height`), mirroring `.folder-select .custom-icon`'s exact breakpoint.** `min-height: 24px`, with `min-height: 32px` inside the same `@media (min-width: 1024px)` block already used for the icon size, guarantees every row is at least as tall as an icon-bearing row would be, while still allowing a future taller row (e.g. unusually large font) to grow rather than clip. Alternative considered: a single fixed value independent of viewport (e.g. always 32px). Rejected — that would either waste vertical space at the 24px tier (rows taller than their own icon) or need a magic number disconnected from the actual icon size; tracking the same breakpoint the icon already uses keeps the two facts (icon size, row height) tied to one source of truth instead of two numbers that could drift apart independently.

**5. Padding goes on `.folder-row` (top/right/bottom only), not on its children or ancestors.** Alternative considered: pad `.sidebar-scroll-area` or `.folder-tree` instead, which would also inset every row uniformly. Rejected — padding the scroll container would also inset the hover/active background highlight added earlier in this change (since that background is painted by `.folder-row` itself), leaving a visible gap between the highlight and the sidebar's edges that wasn't asked for; padding `.folder-row` directly keeps the highlight flush with the row's own box while still pushing the row's *content* (specifically the settings button) away from the border. Left padding is explicitly left at the CSS level's default (0) since the inline `paddingLeft` (a longhand, so it wins over the shorthand's left component regardless of value) already owns per-depth indentation — writing the shorthand as `padding: 3px 3px 3px 0` documents that explicitly rather than leaving it implicit.

## Risks / Trade-offs

- **[Risk] Hovering the already-active folder shows no visible change** (since hover and active render identically). → **Mitigation**: this is the explicitly requested behavior ("same hover style fixed to a selected folder"), not an oversight.
- **[Risk] Minor existing inconsistency remains**: the visual highlight will cover the full row on drag-over, but the actual droppable hit-area is still only the icon+name sub-area — dropping precisely on the gear icon or expand-triangle won't register as "over" this folder. → **Mitigation**: this exact narrowness already exists today (unchanged by this fix); explicitly out of scope per Decision 2, not a regression introduced here.

## Open Questions

None — both open questions from exploration (drag-over vs. hover distinctness, whether to add active-folder styling now) were resolved directly by the user.

## Context

The canvas grid (`src/lib/grid/sizing.ts`, `src/newtab/hooks/useGridLayout.ts`) currently supports two modes — `auto` and `fixed` — resolved per-folder through an ancestor-chain inheritance system (`src/lib/storage/gridSettings.ts`). In practice, no component ever writes a `GridSettings` override or exposes mode/size controls in the UI; every folder silently uses `GLOBAL_DEFAULT_GRID_SETTINGS` (`mode: "auto"`, `minIconSize: 48`, `maxIconSize: 96`). Auto mode computes capacity as `floor(availableSpace / minIconSize)`, then stretches icon size to fill each cell up to `maxIconSize` — this produces small icons on wide screens once enough columns fit, which is the reported problem.

Separately, the sidebar folder tree has no hover feedback and no cursor semantics beyond the default arrow, even though folder rows are both clickable (select folder) and draggable (reparent via `useDraggable`). Bookmarks have a resting `cursor: grab` (signaling draggability) but no hover highlight beyond the drag-target `--over` state that only appears mid-drag.

## Goals / Non-Goals

**Goals:**
- Replace configurable grid sizing with a deterministic, unconfigurable 3-tier step function based on the canvas's own measured available space.
- Make grid capacity a direct function of that tier size — no independent stretch-to-fill step.
- Delete the now-dead configuration/inheritance subsystem entirely (schema, storage, resolver, cleanup hook, fixed-mode math).
- Add hover highlighting + cursor semantics to occupied grid cells and folder rows, resolving the click-vs-drag cursor ambiguity consistently for both.

**Non-Goals:**
- Not changing bookmark label placement (already under-icon).
- Not changing pagination, backfill/reflow, compaction, or position-persistence behavior — these operate on "capacity changed" as an input, independent of how capacity was computed.
- Not adding any new user-facing configuration surface (no settings UI is being added for grid sizing — the opposite).
- Not measuring full browser `window.innerWidth`; sizing stays keyed to the canvas's own container box, consistent with what `useGridLayout` already measures via `containerRef`/`useElementSize`.

## Decisions

**1. Discrete step function, not a continuous ramp.** Icon size is looked up by tier, not interpolated: 48px below 1660px, 63px from 1660px to below 2100px, 100px at 2100px and up. Alternative considered: a continuous linear ramp between breakpoints (smoother resize feel). Rejected because every existing viewport-tiered feature in this codebase (sidebar max-width tiers, folder icon preview tiers, sidebar row icon tiers) is a discrete step function — a ramp would be a new, inconsistent pattern, and the user explicitly confirmed they want the simpler step behavior.

**2. Tier measured against the canvas's own available width, not `window.innerWidth`.** Alternative considered: measuring the full browser viewport (matching the sidebar-width-tier precedent, which does use window/`.app` width). Rejected in favor of reusing the canvas's existing `containerRef` measurement, because the canvas's available space already differs from the full window by the sidebar's width (which is itself user-resizable between 40–1024px), and the grid's own capacity math has always been driven by its own container size, not the window. This keeps the sizing model self-contained to the one component that already measures itself.

**3. Capacity via direct floor division, no stretch step.** `cols = floor(availableWidth / tierIconSize)`, `rows = floor(availableHeight / tierIconSize)`. Alternative considered: keep a stretch-to-fill pass (like today's auto mode) so cells always fill the container edge-to-edge. Rejected — that stretch is exactly what caused today's "sawtooth" sizing complaint; leftover slack space (unused, left/top-aligned, matching the existing `justify-content`/`align-content: start`) is an accepted trade-off for predictable icon sizes.

**4. Delete the entire `GridSettings`/mode/inheritance subsystem rather than defaulting it off.** Alternative considered: keep the schema and resolver in place but hardcode a single default, in case a future settings UI wants it back. Rejected — the subsystem has zero current UI surface, so keeping it is pure dead weight; if per-folder grid configuration is wanted later, it can be redesigned against the new fixed-tier model rather than carrying forward the old auto/fixed dichotomy.

**5. Cursor semantics: `pointer` at rest, `grabbing` only while actively dragging — for both bookmarks and folders.** Both bookmark icons and folder rows are simultaneously clickable (primary action: navigate / select) and draggable (secondary action: reposition / reparent). A static `grab` cursor at rest signals "draggable" but obscures "clickable," and the two affordances can't both be the resting cursor. Resolution: `pointer` communicates the primary click action at rest; the existing `.bookmark-icon--dragging { cursor: grabbing }` (and the new equivalent `.folder-select--dragging { cursor: grabbing }`) communicates the drag state once a drag actually starts. This is a deliberate, confirmed trade-off — the resting cursor no longer hints "draggable" up front, but drag remains fully discoverable once initiated (same interaction cost as before, since the icon still requires the same click-and-hold gesture to drag).

**6. Hover highlight covers the entire cell/row box, not just visible content, and only when occupied.** For grid cells, the highlight is the full `.grid-cell` square — including any slack space around a smaller icon+label — reusing the existing `--over` visual treatment as the hover-triggered style. Empty cells get no highlight and no cursor change, since they have no click handler; only an active drag (existing `--over` drop-target behavior) gives them any visual state. Folder rows mirror this on `.folder-select`.

## Risks / Trade-offs

- **[Risk] Losing the "grab" affordance at rest** means first-time users may not realize bookmarks/folders are draggable until they try clicking-and-holding. → **Mitigation**: none added beyond the existing drag behavior itself (accepted trade-off per Decision 5); this can be revisited later (e.g. a subtler drag-handle affordance) without touching this change's scope.
- **[Risk] Unused leftover space** at the right/bottom edge of the canvas when available space doesn't divide evenly by the tier size. → **Mitigation**: accepted, matches existing `justify-content`/`align-content: start` behavior; no auto-centering or stretch is introduced.
- **[Risk] Deleting `GridSettings` is a breaking storage-schema change** — any previously stored `gridSettings`/`globalGridSettings` values in `chrome.storage.local` become orphaned keys. → **Mitigation**: since no UI ever wrote non-default overrides, real-world stored data is expected to be empty or absent; no migration/cleanup step is planned beyond simply no longer reading those keys.

## Open Questions

None outstanding — all sizing, measurement-basis, and cursor/hover scope questions were resolved during exploration (see proposal.md's Impact section for the resulting concrete breakpoints and behaviors).

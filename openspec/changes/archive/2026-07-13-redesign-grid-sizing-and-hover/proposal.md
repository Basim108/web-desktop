## Why

The canvas grid currently derives icon size by stretching to fill available space up to a configurable max, producing tiny icons on wide screens (the "stretch-to-fill" formula favors adding columns over growing icons once a size threshold is hit) even though no UI has ever exposed the fixed/auto mode or size settings that drive it. The grid needs a simpler, deterministic sizing model tied directly to viewport width, plus hover affordances so bookmarks and folders clearly communicate what's clickable/draggable under the cursor.

## What Changes

- **BREAKING**: Remove the entire grid configuration system — `GridSettings`, `GridMode` ("auto"/"fixed"), per-folder/global override storage, and the ancestor-chain inheritance resolver. This has no UI surface today; deleting it removes dead configuration weight, not a feature.
- Replace auto-mode's stretch-to-fill icon sizing with a fixed 3-tier step function keyed to the canvas's own available width: 48px below 1660px, 63px from 1660px up to (not including) 2100px, 100px at 2100px and wider.
- Grid capacity (columns/rows) becomes a direct `floor(availableSpace / tierIconSize)` on the canvas's measured width/height — the same tier value drives both dimensions (square cells), with no independent stretch step. Leftover space that doesn't divide evenly stays unused (already left/top-aligned).
- Remove fixed-mode sizing math (`computeFixedIconSize`, `FixedSizingResult`), the `needsScroll` concept, and the `.canvas-grid--scrollable` CSS class — there's no longer a squeeze-to-minimum path that needs a scroll fallback.
- Add full-cell hover highlighting for occupied grid cells (the entire cell square, including any unused space around the icon/label), with `pointer` cursor at rest; dragging still shows `grabbing` (existing behavior, unchanged). Empty cells get no hover treatment.
- Add matching hover highlighting for sidebar folder rows, with `pointer` cursor at rest and `grabbing` while a folder is actively being dragged (new — currently unset).
- Add flex alignment to the folder sidebar row so icon and name sit on one line, vertically centered, with a small (~3px) gap.
- No change to bookmark label placement — it's already rendered under the icon; the cramped look was a symptom of the old stretch-to-fill sizing, not the label layout.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `bookmark-canvas`: Removes the "Auto Grid Sizing", "Fixed Grid Sizing", and "Grid Settings Inheritance" requirements; adds a "Responsive Grid Sizing" requirement describing the fixed 3-tier step function and direct floor-division capacity formula. Adds a "Cell Hover Affordance" requirement for occupied-cell hover highlighting and cursor behavior. Modifies "Canvas Data Cleanup on Removal" to drop the now-nonexistent grid-settings-override cleanup on folder removal. Pagination, backfill/reflow, compaction, and position-persistence requirements are unaffected — they react to capacity changes regardless of how capacity is computed.
- `folder-sidebar`: Adds requirements for folder row icon/name alignment (single line, vertically centered, ~3px gap) and folder row hover affordance (highlight, pointer cursor at rest, grabbing cursor while dragging).

## Impact

- `src/lib/storage/schema.ts`: remove `GridSettings`, `GridMode`, `GLOBAL_DEFAULT_GRID_SETTINGS`, the `gridSettings`/`globalGridSettings` fields and their `STORAGE_KEYS` entries.
- `src/lib/storage/gridSettings.ts`: delete entirely.
- `src/lib/bookmarks/events.ts`: remove the `clearGridSettingsOverride` cleanup call.
- `src/lib/grid/sizing.ts`: remove `computeAutoCapacity`, `computeAutoIconSize`, `computeFixedIconSize`, `FixedSizingResult`; add a new tier-lookup function and floor-division capacity helper.
- `src/newtab/hooks/useGridLayout.ts`: collapse `computeCapacityAndIconSize`'s auto/fixed branching into the single tiered formula; remove `needsScroll` and `FALLBACK_FIXED_CAPACITY`.
- `src/newtab/components/GridCell.tsx`, `src/newtab/components/BookmarkIcon.tsx`: hover/cursor CSS hookup (structure likely unchanged, class names may gain a hover-eligible marker).
- `src/newtab/components/FolderTreeNode.tsx`: no structural change expected; CSS-driven alignment and hover.
- `src/newtab/main.css`: new hover rules for `.grid-cell`/`.bookmark-icon`, `.folder-select`; new flex/gap rules for `.folder-select`; remove `.canvas-grid--scrollable`.
- `openspec/specs/bookmark-canvas/spec.md`, `openspec/specs/folder-sidebar/spec.md`: requirement changes as described above.

## 1. Remove grid configuration system

- [x] 1.1 Delete `src/lib/storage/gridSettings.ts` and its test `src/lib/storage/gridSettings.test.ts`.
- [x] 1.2 In `src/lib/storage/schema.ts`, remove `GridSettings`, `GridMode`, `GLOBAL_DEFAULT_GRID_SETTINGS`, the `gridSettings`/`globalGridSettings` fields from `StorageSchema`, and the `GRID_SETTINGS`/`GLOBAL_GRID_SETTINGS` entries from `STORAGE_KEYS`.
- [x] 1.3 In `src/lib/bookmarks/events.ts`, remove the `clearGridSettingsOverride` import and its call in the folder-removal cleanup path; update `src/lib/bookmarks/events.test.ts` accordingly.
- [x] 1.4 In `src/lib/grid/sizing.ts`, remove `computeAutoCapacity`, `computeAutoIconSize`, `computeFixedIconSize`, and the `FixedSizingResult` type.

## 2. Implement responsive tiered sizing

- [x] 2.1 In `src/lib/grid/sizing.ts`, add a tier lookup function (e.g. `resolveTierIconSize(width: number): number`) returning 48 below 1660, 63 from 1660 up to (not including) 2100, and 100 at 2100 and above.
- [x] 2.2 Add a capacity function deriving `{ cols, rows }` via `Math.floor(availableWidth / tierIconSize)` / `Math.floor(availableHeight / tierIconSize)`, each floored to a minimum of 1.
- [x] 2.3 Update `src/lib/grid/sizing.test.ts` to cover: each of the 3 tiers (including exact boundary values 1660 and 2100), capacity flooring, and the minimum-1 floor when available space is smaller than the tier size.
- [x] 2.4 In `src/newtab/hooks/useGridLayout.ts`, replace `computeCapacityAndIconSize`'s auto/fixed branching with a single call into the new tier + capacity functions; remove `needsScroll`, `FALLBACK_FIXED_CAPACITY`, and the `settings`-driven mode check. Remove the now-unused `resolveGridSettings` call and any `GridSettings`-typed state, since sizing no longer depends on stored settings at all.
- [x] 2.5 In `src/newtab/components/Canvas.tsx`, remove the `needsScroll` prop usage and the `canvas-grid--scrollable` class application.
- [x] 2.6 In `src/newtab/main.css`, remove the `.canvas-grid--scrollable` rule.
- [x] 2.7 Update `src/newtab/components/Canvas.test.tsx` (and any `useGridLayout` tests) to drop assertions tied to fixed/auto mode or `needsScroll`, and add coverage for tier-driven capacity at a couple of representative container sizes.

## 3. Cell and folder row hover affordances

- [x] 3.1 In `src/newtab/main.css`, add a `.grid-cell:hover` (or equivalent, scoped to occupied cells) rule reusing the existing `.grid-cell--over` highlight visual (background, border-radius).
- [x] 3.2 Change `.bookmark-icon`'s resting `cursor` from `grab` to `pointer`; confirm `.bookmark-icon--dragging`'s `cursor: grabbing` is unchanged.
- [x] 3.3 Ensure the hover highlight only applies when a cell is occupied — either by scoping the CSS selector to a cell containing a bookmark (e.g. a class/data-attribute already distinguishing occupied cells) or, if none exists today, adding one in `src/newtab/components/GridCell.tsx`/`Canvas.tsx` without changing the cell's drag-and-drop behavior.
- [x] 3.4 In `src/newtab/main.css`, add a `.folder-select:hover` rule reusing the existing `.folder-select--over` highlight visual.
- [x] 3.5 Add `cursor: pointer` to `.folder-select` at rest, and `cursor: grabbing` to `.folder-select--dragging` (new — currently unset).
- [x] 3.6 Update `src/newtab/components/FolderTreeNode.test.tsx` / `Canvas.test.tsx` if they assert on cursor or class names affected above. (Neither file asserted on cursor/dragging classes — full suite still passes unchanged.)

## 4. Folder row icon/label alignment

- [x] 4.1 In `src/newtab/main.css`, add layout rules to `.folder-select` for icon-and-label mode: single line, `align-items: center`, ~3px gap between icon and name (row direction, distinct from `.bookmark-icon`'s column layout).
- [x] 4.2 Verify `FolderTreeNode.tsx` markup order (icon then label span) needs no change — confirm visually after the CSS update.

## 5. Spec sync and verification

- [x] 5.1 Run the full unit test suite and fix any remaining references to removed grid-settings APIs. (164/164 pass; also `tsc --noEmit` and `eslint .` clean.)
- [x] 5.2 Manually verify in the running extension: icon size at each of the 3 tiers (resize window/container across 1660px and 2100px), hover highlight + cursor on occupied vs. empty cells, hover highlight + cursor on folder rows including during an active folder drag, and folder row icon/label alignment. (Verified end-to-end via a real Chromium + loaded extension through Playwright: tiers measured 48/63/100px with exact boundary confirmed at canvas width 1659→48 vs 1661→63; occupied-cell hover shows background highlight + pointer, empty cell stays inert; folder row hover shows highlight + pointer; actual drag shows `grabbing`; folder row confirmed `flex-direction: row` + centered + 3px gap vs bookmark's `column`.)
- [x] 5.3 Run `openspec validate --change redesign-grid-sizing-and-hover --strict` (or equivalent) and fix any reported issues before archiving.

## 1. Storage for persisted width

- [x] 1.1 Add a small read/write helper for the sidebar width in `chrome.storage.local` (new module or addition alongside `src/lib/storage/folderSettings.ts`), with a default of 240px and a clamp to the 40px minimum on read.

## 2. Resize hook

- [x] 2.1 Create `useSidebarResize` (or equivalent) hook: holds current width state, reads persisted width on mount, exposes `width`, `isDragging`, and a `startDrag` pointer-down handler.
- [x] 2.2 Implement drag tracking: on `pointerdown` on the handle, capture the pointer and record start X/width; on `window` `pointermove`, compute new width clamped to `Math.max(40, ...)`; on `window` `pointerup`/`pointercancel`, end the drag and persist the final width to storage.
- [x] 2.3 Ensure all `window` listeners are removed in a single cleanup path (including `useEffect` cleanup) so a drag can never get "stuck."

## 3. Sidebar UI changes

- [x] 3.1 Add a resize handle element to `Sidebar.tsx` positioned on the right border, with a padded hit-area (~6-8px) and a visually thin (1px) border centered inside it.
- [x] 3.2 Apply the dynamic width to the sidebar via inline `style={{ width }}`, wired to the `useSidebarResize` hook's `width` value.
- [x] 3.3 Wire the handle's `onPointerDown` to the hook's `startDrag`.

## 4. Styling

- [x] 4.1 In `main.css`, replace the fixed `.sidebar { width: 240px }` rule with `min-width: 40px` (keep `flex-shrink: 0`), leaving the numeric width to be supplied inline by the component.
- [x] 4.2 Add `scrollbar-width: none;` and `.sidebar::-webkit-scrollbar { display: none; }` to hide native scrollbars on the sidebar, while keeping `overflow-y: auto` (and `overflow-x: auto` if horizontal overflow is possible at narrow widths) so wheel/keyboard scrolling still works.
- [x] 4.3 Add a `col-resize` cursor style to the new resize handle element, applied on hover and for the duration of an active drag.
- [x] 4.4 Verify no changes were made to `.canvas`, `.canvas-grid`, or `.canvas-grid--scrollable` rules.

## 5. Verification

- [x] 5.1 Manually test: hover shows `col-resize` cursor on the border; dragging left/right resizes the sidebar; dragging past the minimum stops at 40px. (Automated via `e2e/sidebar-resize.spec.ts`, run against the real built extension in Chromium; caught and fixed a real clipping bug where the handle was cut off by the sidebar's own `overflow`.)
- [x] 5.2 Manually test: sidebar scrollbars are not visible with a tall folder tree, but wheel scrolling still works. (Automated via `e2e/sidebar-resize.spec.ts`.)
- [x] 5.3 Manually test: resize the sidebar, reload the new-tab page, and confirm the width persisted. (Automated via `e2e/sidebar-resize.spec.ts`.)
- [x] 5.4 Confirm canvas scrolling/pagination behavior (edge drag pagination, grid scroll) is unchanged. (Verified: existing `e2e/edge-pagination.spec.ts` and full e2e suite pass unmodified.)
- [x] 5.5 Run existing test suite and add/update tests for the new hook and any storage helper.

## 6. Viewport-tiered maximum width (amendment)

- [x] 6.1 Add `getMaxWidthForViewport(viewportWidth: number): number` (e.g. in `useSidebarResize.ts` or a small colocated module): returns 212 below 1024px, 512 from 1024px up to (not including) 1920px, 1024 at 1920px and above.
- [x] 6.2 Wire viewport-width measurement into `useSidebarResize` by reusing the existing `useElementSize` hook on the `.app` container (not a new `window.resize` listener), and recompute the active tier's max whenever it changes. (Measured in `App.tsx` via `useElementSize` on `.app`, passed down to `Sidebar`/`useSidebarResize` as a `viewportWidth` prop.)
- [x] 6.3 Update the `pointermove` clamp to `Math.min(tierMax, Math.max(40, ...))` so dragging past the current tier's cap stops there.
- [x] 6.4 Add a live re-clamp effect: when the tier's max changes (viewport resized) and the current *effective* width exceeds the new max, recompute the effective width — without writing to storage — so the sidebar visually shrinks immediately. (Implemented as a derived value — `width = Math.min(maxWidth, Math.max(MIN, preferredWidth))` computed fresh every render — rather than a separate effect, since it needs no effect to stay in sync; re-renders on viewport change recompute it automatically.)
- [x] 6.5 Ensure growing the window back into a tier whose max is >= the stored preferred width restores that preferred width (effective width is always derived from `Math.min(tierMax, Math.max(40, storedWidth))`, never a value that was permanently overwritten by a prior re-clamp).
- [x] 6.6 In `sidebarSettings.ts`, add a defensive outer ceiling clamp (1024px, the largest tier's cap) to `setSidebarWidth`, alongside the existing 40px floor clamp. (Applied to `getSidebarWidth` too, for symmetry with the existing floor clamp.)
- [x] 6.7 Update `e2e/sidebar-resize.spec.ts` (or add a new spec) to cover: dragging stops at the active tier's cap; resizing the browser viewport narrower live-shrinks an over-cap sidebar; resizing back out restores the preferred width.
- [x] 6.8 Update/add unit tests for `getMaxWidthForViewport` and the hook's tier-aware clamping and re-clamp behavior.
- [x] 6.9 Run the full unit + e2e suite and confirm no regressions, in particular that canvas scroll/pagination behavior remains unaffected. (168 unit tests + 18 e2e tests pass, including `edge-pagination.spec.ts` unmodified.)

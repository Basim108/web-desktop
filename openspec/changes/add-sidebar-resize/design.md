## Context

The sidebar (`src/newtab/components/Sidebar.tsx`) currently has a fixed width set purely in CSS (`.sidebar { width: 240px }` in `src/newtab/main.css`), inside a `display: flex` `.app` container alongside `Canvas.tsx`. There is no existing resizable-panel pattern in the codebase to reuse — drag logic elsewhere (`@dnd-kit/core` in `Canvas.tsx`/`BookmarkIcon.tsx`) is item drag-and-drop, not panel resizing, and is not a good fit for a simple edge-drag interaction.

**Amendment**: the original design shipped with no maximum width (see the now-superseded Non-Goal below). This was amended to add a viewport-tiered maximum before archiving — see Decisions 6–7.

## Goals / Non-Goals

**Goals:**
- Let the user drag the sidebar's right border to resize it, with a 40px minimum width.
- Enforce a maximum width that scales with viewport size: 212px below 1024px viewport width, 512px from 1024px up to (but not including) 1920px, 1024px at 1920px and above. Re-clamp live if a window resize drops the sidebar into a smaller tier than its current width allows.
- Show a `col-resize` cursor on hover over the draggable border, independent of whether a drag is in progress.
- Hide native scrollbars on the sidebar (both axes) while keeping it scrollable by other means (wheel, trackpad, keyboard).
- Persist the chosen width across reloads, as the user's preferred width — independent of whatever tier cap happens to be active at read time.

**Non-Goals:**
- ~~No maximum width constraint~~ — superseded; see Decisions 6–7.
- No changes to `Canvas.tsx`, `useGridLayout.ts`, `useEdgePagination.ts`, or `.canvas`/`.canvas-grid` CSS — canvas scroll behavior is handled in a separate future feature.
- No multi-panel/splitter framework — this is a single fixed-edge resize, not a generic resizable-panels library.
- No touch/pointer-type-specific gestures beyond standard Pointer Events (mouse-first; touch works via Pointer Events but isn't specially optimized).
- No hysteresis at tier boundaries — crossing 1024px or 1920px in either direction switches tier deterministically and immediately; there's no dead zone to prevent rapid tier-flipping right at a boundary during a slow window drag.

## Decisions

**1. Plain Pointer Events + local component state, no new dependency.**
A resize handle is a thin `<div>` absolutely positioned on the sidebar's right edge. `onPointerDown` starts a drag: capture the pointer (`setPointerCapture`), record the start X and start width, and listen for `pointermove`/`pointerup` on `window` (not just the handle) so the drag tracks correctly even if the cursor moves faster than layout or leaves the handle's bounds. This avoids pulling in a resizable-panel library for a single-axis, single-handle interaction.
*Alternative considered*: `@dnd-kit/core` (already a dependency). Rejected — it's built around draggable/droppable item semantics (used for bookmark icons), not continuous edge-drag resizing; using it here would be a poor semantic fit and pull in unnecessary sensor/collision machinery.

**2. Width state lives in the `Sidebar` component (or a small `useSidebarResize` hook), applied via inline `style={{ width }}`, not a CSS custom property.**
This matches the existing pattern in `Canvas.tsx` (which already uses inline `style` for computed grid sizing) and keeps `main.css` free of dynamic values. The static rules (`min-width: 40px`, `flex-shrink: 0`, scrollbar hiding, `border-right`) stay in CSS; only the numeric width itself is dynamic.
*Alternative considered*: CSS variable (`--sidebar-width`) set via `style` on a wrapper and read in CSS. Rejected as unnecessary indirection for a single element with a single dynamic property.

**3. Persistence via `chrome.storage.local`, debounced on drag, written once on pointer-up.**
Read the stored width on mount (falling back to the current 240px default if absent or below the 40px minimum). Do not write on every `pointermove` (avoids storage write spam during a drag); write the final value once on `pointerup`. This mirrors how other per-profile UI state is already persisted in this codebase (see `folderSettings.ts`).
*Alternative considered*: `localStorage`. Rejected for consistency — all other durable UI/bookmark state already goes through `chrome.storage.local`, and it's the mechanism that supports the existing cross-tab sync patterns in this codebase.

**4. Scrollbar hiding is CSS-only, scoped strictly to `.sidebar`.**
`scrollbar-width: none` (Firefox) plus `.sidebar::-webkit-scrollbar { display: none }` (Chromium/WebKit) on the existing `.sidebar` rule. `overflow-y: auto` (or `overflow: auto` if horizontal overflow can occur with narrow widths) is kept so the folder tree remains scrollable by wheel/keyboard — only the visible scrollbar track/thumb disappears. This class is entirely separate from `.canvas`/`.canvas-grid`, so there's no risk of the change bleeding into canvas scroll behavior.

**5. Minimum width enforced at the drag-handler level, not just CSS `min-width`.**
Clamp the computed width to `Math.max(40, ...)` inside the `pointermove` handler itself, in addition to keeping a CSS `min-width: 40px` as a defensive backstop. This keeps the drag feel correct right at the boundary (the handle doesn't visually detach from the cursor) rather than relying on CSS alone to stop the box from shrinking further. The maximum (Decision 6) is clamped the same way, in the same handler: `Math.min(tierMax, Math.max(40, ...))`.

**6. Viewport-tiered maximum, measured via the existing `useElementSize`/`ResizeObserver` pattern rather than a `window.resize` listener.**
A pure function `getMaxWidthForViewport(viewportWidth: number): number` maps viewport width to the active tier's cap (212 / 512 / 1024, breakpoints at 1024px and 1920px). The viewport width itself is measured by observing the `.app` container's width — reusing the `useElementSize` hook already in the codebase — instead of introducing a new `window.resize` listener and its own mock/cleanup story. `.app` spans the full window width as an ordinary block-level flex container, so its measured width is equivalent to the viewport width for this purpose. This keeps viewport-tracking consistent with the one pattern the codebase already uses for size-driven layout (`useGridLayout` does the same for the canvas), and it's directly testable with the existing `resizeObserverMock` test utility instead of needing a new window-resize mock.
*Alternative considered*: `window.matchMedia` against the two breakpoints. Rejected — functionally equivalent, but adds a second sizing mechanism alongside the ResizeObserver one already used for the canvas, for no real benefit here.

**7. The persisted width is the user's preference; the *effective/rendered* width is a derived, unpersisted clamp of that preference against the current tier's max.**
`setSidebarWidth` still only runs on drag release (Decision 3) — a live viewport-driven re-clamp never writes to storage. The rendered width is always `Math.min(tierMax, Math.max(40, storedOrDraggedWidth))`, recomputed whenever the tier changes (window resized) or the user drags. Concretely: if the user sets the sidebar to 900px on an ultra-large screen (1024px cap) and later opens the same profile on a laptop (212px cap), the sidebar renders at 212px, but the stored preference stays 900px — reopening on a large-enough screen restores 900px rather than leaving it stuck at 212px. As a defensive backstop (mirroring the 40px floor already enforced in `setSidebarWidth`), the setter also clamps to the largest possible tier cap (1024px) as an outer ceiling, so storage can never hold a runaway value from a future bug.
*Alternative considered*: clamping (and overwriting) the stored value itself on every tier change. Rejected — it would permanently discard the user's original preference the first time their window happened to be narrow, which is the "shrink and forget" behavior the min-width risk below already calls out as undesirable in spirit.

## Risks / Trade-offs

- [Drag handle hit-area is thin (a few px), hard to grab precisely] → Give the handle a small invisible padded hit-area (e.g. 6-8px wide) with the 1px visual border centered inside it, same technique commonly used for splitters.
- [Losing pointer capture / drag "sticking" if pointerup fires outside the window] → Listen on `window` for `pointerup`/`pointercancel` and always clean up listeners in a single teardown path (including in a `useEffect` cleanup) so a stray release never leaves the drag "stuck."
- [Hidden scrollbars reduce scroll-affordance discoverability] → Acceptable per explicit product requirement; wheel/trackpad/keyboard scrolling still works, only the visual track is hidden.
- [A window resize could rapidly cross a tier boundary back and forth (e.g. during an interactive OS-level window-drag-to-resize), causing the sidebar to visibly snap between caps] → Accepted; no debounce/hysteresis is added (see Non-Goals). If this proves visually noisy in practice, a small debounce on the viewport-size effect (not the drag handler) would be the fix.
- [Effective width and stored width can now diverge (Decision 7), adding a bit of conceptual overhead vs. a single source of truth] → Accepted as the better UX trade-off; the divergence is intentional and only ever narrows the *displayed* value, never the remembered preference.

## Open Questions

- Should the persisted sidebar width be scoped per-window/profile or global to the extension? (Assumed: same storage scope as existing `folderSettings.ts`, i.e. shared across the profile.) Confirm during implementation if this differs from expectations.

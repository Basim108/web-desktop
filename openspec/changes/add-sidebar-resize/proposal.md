## Why

The sidebar has a fixed 240px width with no way for users to make it wider (to read long folder names) or narrower (to reclaim canvas space). It also shows native scrollbars, which look inconsistent with the rest of the desktop-style UI.

## What Changes

- Add a draggable resize handle on the sidebar's right border. Dragging it left/right changes the sidebar's width.
- Enforce a minimum sidebar width of 40px.
- Enforce a maximum sidebar width that scales with the browser window's viewport width: 212px on small/medium screens (< 1024px), 512px on large screens (1024–1920px), 1024px on ultra-large screens (≥ 1920px). If the window is resized into a smaller tier while the sidebar is wider than that tier's cap, the sidebar re-clamps live; growing the window back out restores the user's preferred width up to the new tier's cap.
- Change the cursor to a horizontal-resize icon (`col-resize`) when hovering the sidebar's right border, even before a drag starts.
- Hide the sidebar's native horizontal and vertical scrollbars (the folder tree remains scrollable via wheel/trackpad/keyboard, just without visible scrollbar tracks).
- Sidebar width persists across sessions (stored alongside existing per-profile UI state) so a resize sticks after reload.
- **Explicitly out of scope**: the canvas's own scroll configuration (`.canvas`, `.canvas-grid`, `useGridLayout`, `useEdgePagination`) is untouched by this change and will be addressed in a separate future feature.

## Capabilities

### New Capabilities
(none — this extends the existing sidebar capability)

### Modified Capabilities
- `folder-sidebar`: adds a requirement that the sidebar is user-resizable via a drag handle on its right border, with a 40px minimum width, a viewport-tiered maximum width (212px / 512px / 1024px), resize-cursor affordance on hover, hidden native scrollbars, and persisted width across sessions.

## Impact

- `src/newtab/components/Sidebar.tsx`: add a resize handle element and drag-state wiring (pointer down/move/up).
- `src/newtab/main.css`: replace fixed `.sidebar { width: 240px }` with a width driven by state/CSS variable, add `min-width: 40px`, hide scrollbars (`scrollbar-width: none` / `::-webkit-scrollbar { display: none }`) on `.sidebar`, add `col-resize` cursor styling for the new handle.
- New hook (e.g. `useSidebarResize` or similar) to encapsulate drag-to-resize logic, viewport-tiered max-width clamping, and width persistence.
- Viewport-tier detection reuses the existing `useElementSize` (ResizeObserver) pattern, measuring the `.app` container's width rather than adding a new `window.resize` listener.
- Storage: a new small persisted value for sidebar width (e.g. in `chrome.storage.local` alongside other UI/folder settings), read on mount and written on resize (debounced). The stored value represents the user's preferred width and is only written on an explicit drag, not on a viewport-driven re-clamp.
- No changes to `Canvas.tsx`, `useGridLayout.ts`, `useEdgePagination.ts`, or any `.canvas`/`.canvas-grid` CSS rules.

## Context

`FolderTreeNode` currently renders its settings block (display-mode radios + `IconUploadControls`) as a plain `<div>` that appears in normal document flow immediately after the folder row, whenever `settingsOpen` is true. Because the tree is recursive (`FolderTreeNode` renders `FolderTreeNode` for each child), any state used to coordinate "only one popup open" has to either be prop-drilled the same way `activeFolderId`/`onSelectFolder` already are, or introduced as a new context. The sidebar has no existing popup/overlay pattern and no positioning library (`@dnd-kit` is the only UI-adjacent dependency, used for drag-and-drop, not layout).

## Goals / Non-Goals

**Goals:**
- Replace the inline settings block with a floating popup anchored to the gear button, without reflowing sibling/child rows.
- Close on outside click or Escape; only one popup open at a time across the whole tree.
- Add a responsive icon preview (32/48/64px by viewport width) inside the popup.

**Non-Goals:**
- No new positioning/popover dependency (e.g. floating-ui, Radix Popover) — the popup only ever anchors to a fixed corner of its own row, so CSS absolute positioning is sufficient.
- No change to how icons are uploaded, stored, or fetched (`uploadIcon`/`removeIcon`/`getIcon` are untouched).
- No focus-trap/roving-tabindex work beyond Escape-to-close; this is a lightweight utility popup, not a modal dialog.

## Decisions

**Single-open-at-a-time state lives in `Sidebar`, threaded down like `activeFolderId`.**
`Sidebar` already owns `activeFolderId` and passes it plus a setter callback through every recursive `FolderTreeNode` level. Adding `openSettingsFolderId` + `onToggleSettings(folderId)` follows the same established prop-drilling pattern instead of introducing a new React Context solely for this. Alternative considered: a context provider scoped to the folder tree — rejected as unnecessary machinery for two extra props at a depth the tree already threads other state through.

**Popup positioning: `position: absolute` inside a `position: relative` row wrapper.**
The gear button's containing `.folder-row` becomes the anchor (`position: relative`); the popup is `position: absolute` positioned below/aligned to it via CSS, with a high enough `z-index` to sit above subsequent sibling rows. Alternative considered: `position: fixed` with JS-computed coordinates (needed for floating-ui-style collision detection) — rejected as overkill since the sidebar is a narrow, vertically-scrolling column where the popup only ever needs to open downward/leftward within the sidebar's own stacking context.

**Outside-click and Escape handled with a `useEffect` in `FolderTreeNode`, scoped to when that node's popup is open.**
When `openSettingsFolderId === folder.id`, attach a `document` `pointerdown` listener (ignoring clicks inside the popup/toggle button via a ref) and a `keydown` listener for `Escape`, both calling the close callback; detach on cleanup. This mirrors the existing effect-cleanup pattern already used for `onStorageKeysChanged` in `useFolderSettings`.

**Icon preview reuses `CustomIconImage`, sized via a wrapping CSS class, not a new fetch path.**
A new small component wraps `CustomIconImage` in a `folder-settings-icon-preview` container; sizing (32/48/64px) is pure CSS via `min-width`/`min-height` media queries on viewport width, keyed at the same 1024px/1600px breakpoints already established for sidebar-width tiering. Only rendered when `settings.hasCustomIcon` is true (mirrors the existing "Remove icon" conditional), since there's nothing to preview otherwise.

## Risks / Trade-offs

- [Popup could visually overflow the sidebar's right edge on a very narrow sidebar (40px minimum width)] → Popup width is independent of the sidebar's own width (it's an overlay, not constrained to the row's width), and `overflow: visible` on the scroll area's stacking is not required since the popup is positioned relative to the row, not clipped by `sidebar-scroll-area`'s scroll bounds in practice for the depths this tree reaches. If clipping is observed during implementation, fall back to rendering the popup at the `Sidebar` level via a portal-free `position: fixed` with coordinates read from the anchor's `getBoundingClientRect()`.
- [Lifting `openSettingsFolderId` to `Sidebar` touches every recursion level's props] → Small, mechanical change consistent with existing `activeFolderId` threading; low risk of regression since the same pattern is already proven in this file.

## Open Questions

- None outstanding; if sidebar-edge clipping turns out to be a real problem during implementation, the `fixed`-position fallback described above resolves it without further design discussion needed.

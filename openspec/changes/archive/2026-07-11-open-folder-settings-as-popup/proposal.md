## Why

Folder display settings (name/icon layout, custom icon upload) currently render as an unstyled block that expands inline beneath the folder row in the sidebar tree. This pushes every sibling and descendant row downward, shifts the whole tree's layout while editing, and reads as unfinished UI. Presenting it as a popup anchored to the gear button keeps the tree layout stable and gives the settings their own visually contained surface.

## What Changes

- Convert the folder settings panel (display-mode radio group + icon upload controls) in `FolderTreeNode` from an inline expanding block to a floating popup anchored to the folder's gear (⚙) button.
- The popup overlays the sidebar content instead of reflowing sibling/child rows.
- Clicking outside the popup, or pressing Escape, closes it (replacing the current toggle-only interaction).
- Only one folder's settings popup is open at a time (opening another folder's popup, or navigating, closes the previous one).
- Add contained styling for the popup (background, border, shadow, spacing) since the current inline block has none.
- Add an icon preview to the settings popup that renders the folder's uploaded custom icon (when one exists) at a size driven by viewport width: 32px below 1024px, 48px from 1024px up to 1600px, and 64px for above 1600px.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `folder-sidebar`: the folder display-settings UI changes from an inline expanding panel to a floating popup anchored to the gear button, with outside-click/Escape dismissal and single-open-at-a-time behavior.

## Impact

- Affected code: `src/newtab/components/FolderTreeNode.tsx` (settings panel rendering/positioning, open/close state), `src/newtab/main.css` (new popup and responsive preview styles). Reuses the existing `CustomIconImage` component for the preview rather than adding a new icon-fetch path.
- No changes to storage schema, `useFolderSettings` hook, or the `chrome.bookmarks` integration — this is presentation-layer only.
- No new dependencies required (no floating-ui/popover library currently in the project); positioning can be done with a relatively-positioned anchor and absolutely-positioned popup; responsive sizing via CSS media queries on viewport width.

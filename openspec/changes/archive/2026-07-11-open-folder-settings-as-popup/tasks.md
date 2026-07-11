## 1. Lift shared open-popup state

- [x] 1.1 Add `openSettingsFolderId: string | undefined` state and a setter to `Sidebar`, threaded through `FolderTreeNode` props alongside `activeFolderId`/`onSelectFolder` (including the recursive child render)
- [x] 1.2 Replace `FolderTreeNode`'s local `settingsOpen` state with a derived `isSettingsOpen = openSettingsFolderId === folder.id`, and have the gear button toggle via the lifted setter (open this folder's id, or clear it if already open)

## 2. Convert the inline panel to an anchored popup

- [x] 2.1 Give `.folder-row` `position: relative` and the settings panel `position: absolute` anchoring in `main.css`, with a `z-index` that sits above subsequent sibling rows
- [x] 2.2 Rename/restyle `folder-settings-panel` (or add a new class) to look like a contained popup: background, border, border-radius, box-shadow, padding, consistent with the extension's existing surface styling
- [x] 2.3 Verify opening a popup does not shift the vertical position of sibling or descendant folder rows

## 3. Outside-click and Escape dismissal

- [x] 3.1 Add a ref on the popup container in `FolderTreeNode`
- [x] 3.2 Add a `useEffect` (active only while `isSettingsOpen`) that attaches a `document` `pointerdown` listener closing the popup when the click target is outside the popup ref and outside the toggle button, and a `keydown` listener closing it on `Escape`
- [x] 3.3 Clean up both listeners when the popup closes or the component unmounts

## 4. Icon preview component

- [x] 4.1 Create a small component (e.g. `FolderIconPreview`) that renders `CustomIconImage` wrapped in a `folder-settings-icon-preview` container, only when `settings.hasCustomIcon` is true
- [x] 4.2 Render it inside the settings popup, above or alongside `IconUploadControls`
- [x] 4.3 Add CSS for `.folder-settings-icon-preview img` (or the wrapper) sizing 32px by default, 48px at `min-width: 1024px`, 64px at `min-width: 1600px`

## 5. Verification

- [x] 5.1 Manually verify: opening one folder's popup while another is open closes the first
- [x] 5.2 Manually verify: click-outside and Escape both close the popup
- [x] 5.3 Manually verify icon preview sizing at <1024px, 1024–1599px, and ≥1600px viewport widths
- [x] 5.4 Run existing tests touching `FolderTreeNode` (`FolderTreeNode.test.tsx`) and update/add coverage for the new popup and preview behavior
- [x] 5.5 Run lint/typecheck/build

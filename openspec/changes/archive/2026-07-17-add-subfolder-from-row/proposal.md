## Why

There is currently no way to create a bookmark folder from inside the extension —
the sidebar only lets you rename, re-icon, remove, or reorganize folders that
Chrome already has. Users who want to build out their folder structure must leave
the new-tab page for Chrome's native bookmark manager. Adding folders should be a
first-class sidebar action, and it should reuse the folder-settings flow the user
already knows so a new folder can be named and given an icon before it exists.

## What Changes

- Add an "add subfolder" button to **every** folder row in the sidebar, including
  root folders (Bookmarks Bar, Other Bookmarks, Mobile Bookmarks), placed next to
  the settings gear's position and revealed on hover/focus with the same
  affordance the gear uses. Root rows gain this button even though they have no
  settings gear.
- Clicking the button opens the Folder Settings window in a **new-folder (draft)
  mode**: the user types a name and optionally stages a custom icon, exactly as
  when editing an existing folder, but the window is titled for a new folder and
  shows no "Remove folder" action.
- Nothing is written to `chrome.bookmarks` until the user saves. On **Save**, the
  subfolder is created as the **first child (index 0)** of the row's folder via
  the existing `createFolder`, then the staged custom icon (if any) is applied to
  the new folder's Chrome-assigned id.
- On **close / Escape / backdrop**, the draft is discarded and no folder is
  created — "closing without saving removes the new folder" is achieved by never
  creating one in the first place.
- After a successful save, the parent folder auto-expands so the newly created
  subfolder is visible in the tree.

## Capabilities

### New Capabilities
<!-- None — this extends existing sidebar behavior rather than introducing a new capability. -->

### Modified Capabilities
- `folder-sidebar`: Adds a new requirement for the per-row "add subfolder" action
  and its draft/new-folder mode of the Folder Settings window. Amends the existing
  "Root Folders Are Non-Editable Drop Targets" requirement so that a root row,
  while still having no settings gear, does render the add-subfolder button.
  Amends the hover/focus reveal behavior so the add-subfolder button follows the
  same reveal rule as the settings gear.

## Impact

- **UI components**: `FolderTreeNode.tsx` (render the new button on every row,
  wire hover/focus reveal, hold the "adding a subfolder here" state);
  `FolderSettingsWindow.tsx` (a new-folder/draft mode — no backing Chrome node, no
  Remove action, create-on-save then apply icon).
- **Bookmark lib**: `lib/bookmarks/create.ts` — allow `createFolder` to place the
  new folder at a specific index (first child) rather than appended last.
- **Styling**: sidebar row CSS for the new button's placement and hover/focus
  reveal, mirroring `folder-settings-toggle`.
- **Behavior**: uses `chrome.bookmarks.create` (already a permitted, in-use API);
  the existing cross-tab structure-sync surfaces the new folder in other open
  tabs automatically. No new permissions.
- **Tests**: `FolderTreeNode.test.tsx`, `FolderSettingsWindow.test.tsx`, and a
  create.ts unit test for indexed placement; e2e coverage for the
  create-on-save / discard-on-close flow.

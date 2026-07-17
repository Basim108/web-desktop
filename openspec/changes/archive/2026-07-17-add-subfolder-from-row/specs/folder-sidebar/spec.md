## ADDED Requirements

### Requirement: Create Subfolder From a Folder Row

The system SHALL render an "add subfolder" button on every folder row in the
sidebar — root folders (Bookmarks Bar, Other Bookmarks, Mobile Bookmarks) and
non-root folders alike — positioned adjacent to where the folder's settings
(gear) toggle sits, on the same horizontal line as the row's other controls. The
add-subfolder button SHALL be visually hidden at rest and revealed only while the
mouse hovers the folder row or the button itself receives keyboard focus,
matching the settings toggle's reveal affordance; it SHALL remain present in the
DOM and reachable by keyboard at all times, and revealing or hiding it SHALL NOT
shift the row's expand-toggle, icon, name, or settings toggle. On root rows the
button is the only per-row control shown on hover, since root rows still render no
settings gear.

Activating the button SHALL open the Folder Settings window in a **new-folder
(draft) mode** targeting a new subfolder of that row's folder. Draft mode SHALL
present the same name field and custom-icon staging (upload/remove, with a preview
that shows the staged image or the default folder icon) as editing an existing
folder, SHALL be titled to indicate a new folder is being created, and SHALL NOT
present the "Remove folder" action. Draft mode SHALL obey the same single-window
rule as folder settings: opening a draft SHALL close any other folder settings or
draft window that is open, and only one SHALL be open at a time.

Nothing SHALL be written to `chrome.bookmarks` or to icon/settings storage while
the draft is open. Only when the user saves SHALL the system create the subfolder
as the **first child (index 0)** of the row's folder via the bookmarks API, then
apply the staged custom icon (if any) to the newly created folder's
Chrome-assigned id and mark it as having a custom icon. A draft SHALL follow the
same empty-name rule as folder settings: the name SHALL NOT be empty or
whitespace-only, and saving SHALL be prevented until a non-empty name is entered.
After a successful save the system SHALL expand the parent row so the new
subfolder is visible, and SHALL close the window. If the user closes the window,
presses Escape, or clicks the backdrop before saving, the draft SHALL be discarded
and no folder, icon, or setting SHALL have been created.

#### Scenario: Every folder row shows an add-subfolder button

- **WHEN** any folder row renders, whether it is a root folder or a non-root folder
- **THEN** the row provides an "add subfolder" button positioned next to the settings gear's location on the same horizontal line

#### Scenario: Add-subfolder button hidden at rest, revealed on hover

- **WHEN** a folder row is neither hovered nor keyboard-focused
- **THEN** its add-subfolder button is not visually shown, and hovering any part of the row reveals it without shifting the row's expand-toggle, icon, name, or settings toggle

#### Scenario: Add-subfolder button revealed on keyboard focus

- **WHEN** the add-subfolder button receives keyboard focus while its row is not hovered
- **THEN** the button becomes visible so a keyboard user can see and activate it

#### Scenario: Root rows show the add-subfolder button but still no gear

- **WHEN** a root folder row is hovered or focused
- **THEN** it reveals the add-subfolder button and still shows no settings (gear) toggle

#### Scenario: Clicking opens a new-folder draft window

- **WHEN** the user activates a folder row's add-subfolder button
- **THEN** the Folder Settings window opens in new-folder draft mode for a subfolder of that folder, showing the name field and icon staging, titled for a new folder, and offering no "Remove folder" action

#### Scenario: Opening a draft closes any other open settings window

- **WHEN** a folder settings or draft window is already open and the user activates another row's add-subfolder button
- **THEN** the previously open window closes and only the new draft window is open

#### Scenario: Nothing is created while the draft is open

- **WHEN** the user opens a draft, optionally types a name and stages an icon, then closes the window, presses Escape, or clicks the backdrop before saving
- **THEN** no subfolder is created in Chrome and no icon or folder setting is written

#### Scenario: Save creates the subfolder as the first child

- **WHEN** the user enters a non-empty name in the draft and saves
- **THEN** a new folder with that name is created as the first child (index 0) of the row's folder via the bookmarks API

#### Scenario: Staged icon is applied to the created folder

- **WHEN** the user stages a valid custom icon in the draft and saves
- **THEN** the staged image is stored as the newly created folder's custom icon and the folder is marked as having a custom icon

#### Scenario: Saving expands the parent to reveal the new subfolder

- **WHEN** a draft is saved and the new subfolder is created
- **THEN** the parent folder's row expands so the new subfolder is visible in the tree, and the window closes

#### Scenario: Empty name blocks saving a draft

- **WHEN** the draft's name is empty or contains only whitespace
- **THEN** saving is prevented and no folder is created until a non-empty name is entered

## MODIFIED Requirements

### Requirement: Root Folders Are Non-Editable Drop Targets
The system SHALL treat root folders (Chrome's protected top-level folders rendered at the top level of the sidebar tree — Bookmarks Bar, Other Bookmarks, Mobile Bookmarks) as non-editable: the system SHALL NOT render a settings (gear) toggle button on a root folder's row, and there SHALL be no way to open a settings window, rename, upload/remove an image for, or remove a root folder from the sidebar. Root folders SHALL, however, render the add-subfolder button so a new subfolder can be created inside them. Root folders SHALL remain valid drop targets, accepting a bookmark or a non-root folder dragged onto them, moved via the `chrome.bookmarks` API.

#### Scenario: Root folder row has no settings button
- **WHEN** a root folder's sidebar row renders
- **THEN** it does not display a settings (gear) toggle button, and its settings window cannot be opened

#### Scenario: Root folder row can add a subfolder
- **WHEN** a root folder's sidebar row is hovered or focused
- **THEN** it reveals the add-subfolder button, and activating it opens a new-folder draft targeting a subfolder of that root folder

#### Scenario: A bookmark can be dropped into a root folder
- **WHEN** the user drags a bookmark from the canvas and drops it onto a root folder row
- **THEN** the bookmark is moved into that root folder via the bookmarks API

#### Scenario: A non-root folder can be dropped into a root folder
- **WHEN** the user drags a non-root folder row and drops it onto a root folder row
- **THEN** the dragged folder becomes a child of that root folder via the bookmarks API

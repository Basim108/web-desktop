# folder-sidebar Specification

## Purpose
TBD - created by archiving change bookmark-desktop-new-tab. Update Purpose after archive.
## Requirements
### Requirement: Folder Tree Sidebar
The system SHALL display the Chrome bookmark folder tree in a sidebar, in Chrome's native folder order, and SHALL NOT render folders as icons on the canvas.

#### Scenario: Sidebar reflects Chrome's native folder order
- **WHEN** the sidebar renders a folder's subfolders
- **THEN** they appear in the same order Chrome's native bookmark manager displays them

#### Scenario: Folders never appear on the canvas
- **WHEN** any folder is selected or viewed
- **THEN** no folder is ever rendered as an icon on the canvas; only bookmarks (leaf items) appear there

### Requirement: Folder Selection Filtering
The system SHALL set the canvas's active folder to whichever folder the user selects in the sidebar.

#### Scenario: Selecting a folder in the sidebar updates the canvas
- **WHEN** the user selects a folder in the sidebar
- **THEN** the canvas becomes filtered to that folder's direct bookmark children

### Requirement: Folder Sidebar Display Setting
The system SHALL allow each folder to independently configure its sidebar row display as icon-only, label-only, or both icon and label, rename the folder, upload or remove a custom folder image, and remove the folder, with no inheritance from other folders, presented in a centered modal window matching the Edit Bookmark window's style (titlebar with title and close control, opaque body, and a footer) rather than as a popup anchored to the folder's settings toggle button. The modal window SHALL be opened from the folder's settings (gear) toggle button, whose glyph SHALL render at a 16px font size, and SHALL float over the center of the viewport without shifting sibling or descendant folder rows. The icon display options SHALL be unavailable until the folder has a custom uploaded image, evaluated against the window's staged (not-yet-saved) image state. Folder names SHALL NOT be empty or consist only of whitespace. All edits (name, display mode, custom image) SHALL be staged in the window and applied together only when the user saves; closing the window, pressing the Escape key, or clicking the backdrop SHALL discard any unsaved edits. Only one folder's settings window SHALL be open at a time. When the window has a staged custom image (either the folder's existing image or a newly uploaded one), it SHALL display a fixed-size preview of that image matching the Edit Bookmark window's preview sizing; when no image is staged it SHALL display no image preview. Removing the folder SHALL delete the folder and its entire subtree. When a folder's sidebar row displays its custom icon (icon-only or icon+label mode), the row's icon SHALL be sized according to the browser window's viewport width — 24px below 1024px and 32px at 1024px and above — independent of and unaffected by the settings window's fixed preview sizing.

#### Scenario: Settings open as a centered modal window, not an anchored popup
- **WHEN** the user clicks a folder's settings (gear) toggle button
- **THEN** a centered modal window styled like the Edit Bookmark window opens, and sibling and descendant folder rows do not shift position

#### Scenario: Gear toggle button renders at 16px
- **WHEN** a folder row's settings (gear) toggle button renders
- **THEN** its glyph is displayed at a 16px font size

#### Scenario: Icon display unavailable without a staged custom image
- **WHEN** the folder settings window has no staged custom image
- **THEN** the icon-only and icon+label display options are disabled

#### Scenario: Icon display available with a staged custom image
- **WHEN** the folder settings window has a staged custom image (existing or newly uploaded)
- **THEN** the user can select icon-only, label-only, or icon+label display

#### Scenario: Empty or whitespace-only folder name rejected
- **WHEN** the user attempts to save a folder name that is empty or contains only whitespace
- **THEN** the system rejects the change and does not save

#### Scenario: Edits are staged and applied only on save
- **WHEN** the user changes the name, display mode, or custom image in the window and clicks Save
- **THEN** all changed values are applied together, and not before Save is clicked

#### Scenario: Closing the window discards unsaved edits
- **WHEN** the folder settings window has unsaved edits and the user closes it, presses Escape, or clicks the backdrop
- **THEN** the window closes and none of the staged edits are applied

#### Scenario: Staging an image removal falls back to label-only on save
- **WHEN** an icon-requiring display mode is selected and the user stages removal of the folder's custom image, then saves
- **THEN** the folder's display mode is saved as label-only without error

#### Scenario: Renaming the folder updates its title
- **WHEN** the user edits the name to a non-empty value and saves
- **THEN** the folder's title is updated via the bookmarks API

#### Scenario: Removing the folder deletes it and its subtree
- **WHEN** the user confirms removal of the folder in the window
- **THEN** the folder and all of its nested bookmarks and subfolders are deleted, and their stored positions, settings, and custom-icon data are discarded

#### Scenario: Only one folder settings window is open at a time
- **WHEN** a folder's settings window is open and the user opens a different folder's settings
- **THEN** the first window closes and the newly selected folder's window opens

#### Scenario: Image preview appears only when an image is staged
- **WHEN** the folder settings window is open
- **THEN** it displays a fixed-size preview of the staged custom image when one is staged, and no image preview when none is staged

#### Scenario: Sidebar row icon sized 24px on small screens
- **WHEN** a folder's sidebar row displays its custom icon and the browser window's viewport width is below 1024px
- **THEN** the row's icon renders at 24px

#### Scenario: Sidebar row icon sized 32px at and above the breakpoint
- **WHEN** a folder's sidebar row displays its custom icon and the browser window's viewport width is at least 1024px
- **THEN** the row's icon renders at 32px

#### Scenario: Sidebar row icon size is independent of the settings window preview
- **WHEN** a folder's sidebar row displays its custom icon
- **THEN** the row's icon renders at its viewport-tiered size (24px or 32px), not the fixed 64px used by the settings window's preview

### Requirement: Folder Label Font Size Follows Grid Tier
The system SHALL render folder row names at a font-size that matches the canvas grid's current tier — 0.75rem when the grid is at its 80px tier, 0.85rem at its 106px tier, and 1rem at its 166px tier — independent of the sidebar's own separate width-tiering system.

#### Scenario: Folder label matches the grid's smallest tier
- **WHEN** the canvas grid is at its 80px tier
- **THEN** folder row names render at 0.75rem

#### Scenario: Folder label matches the grid's middle tier
- **WHEN** the canvas grid is at its 106px tier
- **THEN** folder row names render at 0.85rem

#### Scenario: Folder label matches the grid's largest tier
- **WHEN** the canvas grid is at its 166px tier
- **THEN** folder row names render at 1rem

#### Scenario: Folder label size is unaffected by sidebar width
- **WHEN** the user resizes the sidebar without changing the canvas grid's tier
- **THEN** folder row label font-size does not change

### Requirement: Folder Row Icon and Label Alignment
When a folder's sidebar row displays both its icon and name, the system SHALL lay them out on a single line, with the name following the icon, vertically centered relative to each other, separated by approximately 3px of spacing.

#### Scenario: Icon and name sit on one line
- **WHEN** a folder's sidebar row is set to display both icon and name
- **THEN** the icon and name render side by side on a single line, not stacked

#### Scenario: Icon and name are vertically centered
- **WHEN** a folder's sidebar row displays both icon and name
- **THEN** the icon and name are vertically centered relative to each other within the row

#### Scenario: Small gap between icon and name
- **WHEN** a folder's sidebar row displays both icon and name
- **THEN** approximately 3px of spacing separates the icon from the name

### Requirement: Folder Row Single-Line Layout Without List Markers
The system SHALL render each folder row's expand-toggle, icon+name area, and settings button on a single horizontal line, vertically centered relative to each other, and SHALL NOT display any native list bullet marker before a row.

#### Scenario: Expand-toggle, icon+name, and settings button share one line
- **WHEN** a folder row renders, whether or not the folder has children
- **THEN** the expand-toggle (or its spacer), the icon+name area, and the settings button all appear on the same horizontal line

#### Scenario: Row elements are vertically centered
- **WHEN** a folder row renders
- **THEN** the expand-toggle, icon+name area, and settings button are vertically centered relative to each other within the row

#### Scenario: No bullet marker before a row
- **WHEN** the folder tree or any expanded subfolder list renders
- **THEN** no list bullet or other native list marker appears before any row

#### Scenario: Rows with and without children align identically
- **WHEN** comparing a folder row that has subfolders (showing an expand-toggle) to one that does not (showing a spacer)
- **THEN** the icon+name area starts at the same horizontal position in both rows

### Requirement: Folder Row Hover Affordance
The system SHALL render each folder row with a single transparent-at-rest background covering its entire row — expand-toggle, icon, name, and settings button together — SHALL highlight that full row (same background) on mouse hover and while a drag is over it, SHALL show a pointer cursor while hovering it at rest, and SHALL show a grabbing cursor while the folder row is being actively dragged. The system SHALL also apply that same highlight persistently to whichever folder is currently active/selected, independent of hover or drag state.

#### Scenario: Hovering a folder row highlights the entire row
- **WHEN** the mouse moves over any part of a folder's sidebar row, including its expand-toggle or settings button
- **THEN** the entire row is highlighted so the user can see which folder is under the cursor

#### Scenario: Pointer cursor while hovering a folder row
- **WHEN** the mouse is over a folder's sidebar row and no drag is in progress
- **THEN** the cursor is a pointer

#### Scenario: Grabbing cursor while a folder is being dragged
- **WHEN** the user is actively dragging a folder row
- **THEN** the cursor is a grabbing cursor rather than a pointer

#### Scenario: Dragging another item over a folder row highlights it the same as hover
- **WHEN** a bookmark or folder is being dragged over a folder row as a potential drop target
- **THEN** that row shows the same highlight as mouse hover

#### Scenario: The active folder shows a persistent highlight
- **WHEN** a folder is the currently active/selected folder shown on the canvas
- **THEN** that folder's row shows the same highlight as hover, persistently, regardless of mouse position

#### Scenario: Rows are transparent at rest
- **WHEN** a folder row is neither hovered, drag-targeted, nor the active folder
- **THEN** its background is transparent

### Requirement: Folder Row Consistent Height
The system SHALL render every folder row at the same height regardless of whether that folder's display setting currently shows an icon, sized as tall as a row displaying an icon would be at the current viewport width.

#### Scenario: Label-only row matches an icon row's height
- **WHEN** one folder row displays icon and name and a sibling row displays name only
- **THEN** both rows render at the same height

#### Scenario: Row height tracks the icon size breakpoint
- **WHEN** the browser window's viewport width crosses the 1024px breakpoint
- **THEN** every folder row's height changes to match the icon size at the new tier, whether or not that row currently displays an icon

### Requirement: Folder Row Edge Spacing
The system SHALL render each folder row with approximately 3px of spacing on its top, bottom, and right edges, so its settings button does not touch the sidebar's border and adjacent rows do not touch each other. Left-edge spacing SHALL continue to be governed solely by the row's existing per-depth indentation.

#### Scenario: Settings button does not touch the sidebar border
- **WHEN** a folder row renders
- **THEN** its settings button is visually separated from the sidebar's right border by approximately 3px

#### Scenario: Adjacent rows do not touch
- **WHEN** two folder rows are stacked directly above one another
- **THEN** approximately 3px of vertical spacing separates them

### Requirement: Folder-to-Folder Drag Nesting
The system SHALL allow dragging one folder onto another within the sidebar to reparent it via the `chrome.bookmarks` API, and SHALL leave the stored canvas positions of the moved folder's own bookmarks and nested folders unchanged. The system SHALL reject the drop without calling the API if it would create a cycle (dropping a folder onto itself or one of its own descendants) or would move a protected root folder (e.g. Bookmarks Bar, Other Bookmarks). If the API move is attempted and rejected for any other reason, the system SHALL resync the sidebar to match the actual bookmark tree instead of leaving the optimistic UI state stale.

#### Scenario: Dragging a folder onto another reparents it
- **WHEN** the user drags a folder row and drops it onto another folder row in the sidebar
- **THEN** the dragged folder becomes a child of the target folder via the bookmarks API

#### Scenario: Nested contents keep their stored positions
- **WHEN** a folder containing bookmarks and subfolders is moved to a new parent
- **THEN** the stored canvas positions of its bookmarks and subfolders remain unchanged

#### Scenario: Dropping a folder onto its own descendant is rejected
- **WHEN** the user drags a folder row and drops it onto one of that folder's own descendant folders
- **THEN** the drop is rejected without calling the bookmarks API and the folder remains in its original position

#### Scenario: Dragging a protected root folder is rejected
- **WHEN** the user attempts to drag a protected root folder (e.g. Bookmarks Bar or Other Bookmarks)
- **THEN** the drop is rejected without calling the bookmarks API

#### Scenario: A rejected move resyncs the sidebar
- **WHEN** a folder move is attempted and `chrome.bookmarks.move` rejects it
- **THEN** the sidebar resyncs to reflect the actual current bookmark tree instead of retaining the optimistic drag result

### Requirement: Bookmark-to-Folder Drag Move
The system SHALL allow dragging a bookmark icon from the canvas and dropping it onto a folder entry in the sidebar to move that bookmark into the target folder via the `chrome.bookmarks` API.

#### Scenario: Dragging a bookmark onto a sidebar folder moves it
- **WHEN** the user drags a bookmark icon from the canvas and drops it onto a folder entry in the sidebar
- **THEN** the bookmark is moved into that folder via the bookmarks API and no longer appears in its previous folder's canvas

### Requirement: Live Cross-Tab Structure Sync
The system SHALL propagate bookmark/folder structure changes live to all currently open new-tab pages within the same browser profile, regardless of whether the change originated in the extension or in Chrome's native bookmark manager.

#### Scenario: Structure change in one tab reflects in another
- **WHEN** a bookmark or folder is created, moved, or removed in one open new-tab page or in Chrome's native bookmark manager
- **THEN** all other currently open new-tab pages update to reflect the change without requiring a manual reload

### Requirement: Sidebar Resizing
The system SHALL allow the user to resize the sidebar by dragging a handle on the sidebar's right border, enforcing a minimum sidebar width of 40px and a maximum sidebar width that scales with the browser window's viewport width — 212px below a 1024px viewport width, 512px from 1024px up to (but not including) 1920px, and 1024px at 1920px and above — and SHALL persist the user's chosen width as their preference across sessions, independent of whichever tier cap is active when it's read. The system SHALL NOT modify the canvas's scrolling configuration as part of this requirement.

#### Scenario: Dragging the right border resizes the sidebar
- **WHEN** the user presses down on the sidebar's right border and drags it to the right or to the left
- **THEN** the sidebar's width increases or decreases to follow the cursor

#### Scenario: Sidebar cannot shrink below the minimum width
- **WHEN** the user drags the sidebar's right border further left than the point where the sidebar would be narrower than 40px
- **THEN** the sidebar's width stops at 40px and does not shrink further

#### Scenario: Sidebar cannot grow beyond the current tier's maximum width
- **WHEN** the user drags the sidebar's right border further right than the maximum width allowed for the current viewport tier
- **THEN** the sidebar's width stops at that tier's maximum and does not grow further

#### Scenario: Resizing on a small or medium screen caps at 212px
- **WHEN** the browser window's viewport width is below 1024px and the user drags the sidebar wider than 212px
- **THEN** the sidebar's width stops at 212px

#### Scenario: Resizing on a large screen caps at 512px
- **WHEN** the browser window's viewport width is at least 1024px and below 1920px and the user drags the sidebar wider than 512px
- **THEN** the sidebar's width stops at 512px

#### Scenario: Resizing on an ultra-large screen caps at 1024px
- **WHEN** the browser window's viewport width is at least 1920px and the user drags the sidebar wider than 1024px
- **THEN** the sidebar's width stops at 1024px

#### Scenario: Shrinking the window re-clamps a wider sidebar live
- **WHEN** the sidebar's current width exceeds the maximum for its viewport tier because the browser window was resized narrower
- **THEN** the sidebar's width immediately shrinks to that tier's maximum, without requiring the user to drag the handle

#### Scenario: Growing the window back out restores the user's preferred width
- **WHEN** the browser window is resized wider after a live re-clamp shrank the sidebar, into a tier whose maximum is at least the user's last explicitly chosen width
- **THEN** the sidebar's width grows back to that previously chosen width rather than remaining at the smaller tier's maximum

#### Scenario: Cursor changes on hover over the resize border
- **WHEN** the user hovers the pointer over the sidebar's right border, whether or not a drag is in progress
- **THEN** the cursor icon changes to a horizontal resize indicator

#### Scenario: Resized width persists across sessions
- **WHEN** the user resizes the sidebar and then reloads or reopens the new-tab page
- **THEN** the sidebar renders at the previously chosen width instead of the default width, clamped to the current viewport tier's maximum if needed

### Requirement: Sidebar Hides Native Scroll Controls
The system SHALL hide the sidebar's native horizontal and vertical scrollbar controls while keeping the sidebar's content scrollable by other input methods (e.g. wheel, trackpad, keyboard).

#### Scenario: No visible scrollbar on a tall folder tree
- **WHEN** the sidebar's folder tree content is taller than the sidebar's visible area
- **THEN** no native vertical scrollbar track or thumb is rendered, but the content can still be scrolled with the wheel or trackpad

#### Scenario: No visible scrollbar on a narrow sidebar
- **WHEN** the sidebar is resized narrow enough that its content would overflow horizontally
- **THEN** no native horizontal scrollbar track or thumb is rendered


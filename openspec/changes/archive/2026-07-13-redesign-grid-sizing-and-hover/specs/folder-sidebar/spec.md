## ADDED Requirements

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

### Requirement: Folder Row Hover Affordance
The system SHALL highlight a folder's sidebar row on mouse hover and SHALL show a pointer cursor while hovering it at rest, and SHALL show a grabbing cursor while the folder row is being actively dragged.

#### Scenario: Hovering a folder row highlights it
- **WHEN** the mouse moves over a folder's sidebar row
- **THEN** that row is highlighted so the user can see which folder is under the cursor

#### Scenario: Pointer cursor while hovering a folder row
- **WHEN** the mouse is over a folder's sidebar row and no drag is in progress
- **THEN** the cursor is a pointer

#### Scenario: Grabbing cursor while a folder is being dragged
- **WHEN** the user is actively dragging a folder row
- **THEN** the cursor is a grabbing cursor rather than a pointer

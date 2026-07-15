## MODIFIED Requirements

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

## ADDED Requirements

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

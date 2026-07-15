## ADDED Requirements

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

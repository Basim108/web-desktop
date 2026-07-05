## MODIFIED Requirements

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

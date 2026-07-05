## MODIFIED Requirements

### Requirement: Bookmark Desktop Canvas Display
The system SHALL display, on the new-tab page canvas, only the direct bookmark children of the currently selected folder, rendered as icons, and SHALL navigate the current tab to a bookmark's URL when its icon is clicked, provided the URL's scheme is on an explicit safe allowlist (e.g. `http:`, `https:`, `file:`). The system SHALL NOT navigate when the bookmark's URL scheme is not on that allowlist.

#### Scenario: Selecting a folder shows only its direct bookmarks
- **WHEN** a folder is selected
- **THEN** the canvas displays icons for that folder's direct bookmark children only, excluding subfolders and nested folders' bookmarks

#### Scenario: Clicking a bookmark navigates
- **WHEN** the user clicks a bookmark icon whose URL scheme is on the safe allowlist
- **THEN** the current tab navigates to that bookmark's URL

#### Scenario: Clicking a bookmark with a dangerous URL scheme does not navigate
- **WHEN** the user clicks a bookmark icon whose URL scheme is not on the safe allowlist (e.g. `javascript:`, `data:`, `chrome:`)
- **THEN** the current tab does not navigate

## ADDED Requirements

### Requirement: Canvas Data Cleanup on Removal
The system SHALL remove a bookmark's or folder's stored settings and grid-layout overrides when it is removed via `chrome.bookmarks`, so that no orphaned per-item canvas data persists after removal.

#### Scenario: Removing a bookmark cleans up its settings
- **WHEN** a bookmark is removed via `chrome.bookmarks`
- **THEN** its stored bookmark settings (e.g. label-display override) are deleted

#### Scenario: Removing a folder cleans up its settings and grid overrides
- **WHEN** a folder is removed via `chrome.bookmarks`
- **THEN** its stored folder settings and grid-settings override are deleted

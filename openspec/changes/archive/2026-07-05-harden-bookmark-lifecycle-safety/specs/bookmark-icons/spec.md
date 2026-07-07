## ADDED Requirements

### Requirement: Custom Icon Cleanup on Removal
The system SHALL delete a bookmark's or folder's custom icon image from storage when that bookmark or folder is removed via `chrome.bookmarks`, so that no orphaned icon data persists after removal.

#### Scenario: Removing a bookmark deletes its custom icon
- **WHEN** a bookmark with a custom uploaded icon is removed via `chrome.bookmarks`
- **THEN** its custom icon image is deleted from storage

#### Scenario: Removing a folder deletes its custom icon
- **WHEN** a folder with a custom uploaded icon is removed via `chrome.bookmarks`
- **THEN** its custom icon image is deleted from storage

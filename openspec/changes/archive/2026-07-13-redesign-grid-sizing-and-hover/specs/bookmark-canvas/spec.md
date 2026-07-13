## REMOVED Requirements

### Requirement: Auto Grid Sizing
**Reason**: Replaced by a fixed, unconfigurable 3-tier step function (see "Responsive Grid Sizing" below). Stretch-to-fill icon sizing produced small icons on wide screens once enough columns fit, which this change eliminates in favor of deterministic sizing tied directly to available width.
**Migration**: No user-facing migration needed — no UI ever exposed grid mode/size configuration. Any code reading `minIconSize`/`maxIconSize` from stored `GridSettings` should be removed; icon size is now computed directly from available width via the new tiered lookup.

In auto mode, the system SHALL derive grid cell size from a formula based on available viewport size and a configurable maximum icon size: icons scale continuously with window resize while below that maximum; once at maximum size, further widening SHALL add columns and further heightening SHALL add rows.

#### Scenario: Icon scales below maximum size
- **WHEN** the window is resized and icons are below the configured maximum size
- **THEN** icon size scales continuously to fit the new viewport, without changing column/row count

#### Scenario: Window widens beyond maximum icon size
- **WHEN** the window widens while icons are already at maximum size
- **THEN** the grid adds columns instead of growing icon size further

#### Scenario: Window heightens beyond maximum icon size
- **WHEN** the window heightens while icons are already at maximum size
- **THEN** the grid adds rows instead of growing icon size further

### Requirement: Fixed Grid Sizing
**Reason**: The fixed/auto mode distinction is removed entirely along with all grid configurability — there is no longer a "fixed rows x cols" mode. See "Responsive Grid Sizing" below for the single sizing model that replaces both modes.
**Migration**: No user-facing migration needed — no UI ever exposed fixed-mode configuration (`fixedCols`/`fixedRows`/`minIconSize`). Code paths reading these fields should be removed.

In fixed mode, the system SHALL use a user-configured rows × cols count that does not change with window size; only icon size SHALL scale with the viewport, down to a configured minimum size, below which the canvas SHALL become scrollable instead of shrinking icons further.

#### Scenario: Fixed grid ignores window size for cell count
- **WHEN** a folder uses fixed grid mode and the window is resized
- **THEN** the number of rows and columns does not change; only icon size scales

#### Scenario: Icon reaches minimum size in fixed mode
- **WHEN** the window shrinks enough that fixed-mode icons would go below their configured minimum size
- **THEN** icon size stops shrinking and the canvas becomes scrollable

### Requirement: Grid Settings Inheritance
**Reason**: There are no longer any grid settings to inherit — sizing is a fixed, global formula with no per-folder or global override storage.
**Migration**: No user-facing migration needed — no UI ever wrote per-folder or global overrides. `src/lib/storage/gridSettings.ts` and the `gridSettings`/`globalGridSettings` storage keys are removed entirely.

The system SHALL resolve a folder's grid settings (mode, max/min icon size, fixed rows × cols) by checking the folder's own override first, then its nearest ancestor folder's override, then a global default.

#### Scenario: Folder inherits ancestor's setting
- **WHEN** a folder has no grid-settings override and its parent folder has one
- **THEN** the folder uses its parent's grid settings

#### Scenario: Folder overrides inherited setting
- **WHEN** a folder has its own grid-settings override
- **THEN** that override is used regardless of ancestor or global settings

## MODIFIED Requirements

### Requirement: Canvas Data Cleanup on Removal
The system SHALL remove a bookmark's or folder's stored settings when it is removed via `chrome.bookmarks`, so that no orphaned per-item canvas data persists after removal.

#### Scenario: Removing a bookmark cleans up its settings
- **WHEN** a bookmark is removed via `chrome.bookmarks`
- **THEN** its stored bookmark settings (e.g. label-display override) are deleted

#### Scenario: Removing a folder cleans up its settings
- **WHEN** a folder is removed via `chrome.bookmarks`
- **THEN** its stored folder settings are deleted

## ADDED Requirements

### Requirement: Responsive Grid Sizing
The system SHALL size grid cells (and thereby bookmark icons) using a fixed, unconfigurable 3-tier step function of the canvas's own available width, and SHALL derive grid capacity (columns and rows) by dividing available width and height by the resulting tier size and rounding down, with no further stretching of icon size to fill leftover space.

#### Scenario: Smallest tier below 1660px
- **WHEN** the canvas's available width is below 1660px
- **THEN** grid cells and bookmark icons render at 48px

#### Scenario: Middle tier from 1660px up to 2100px
- **WHEN** the canvas's available width is at least 1660px and below 2100px
- **THEN** grid cells and bookmark icons render at 63px

#### Scenario: Largest tier at 2100px and wider
- **WHEN** the canvas's available width is at least 2100px
- **THEN** grid cells and bookmark icons render at 100px

#### Scenario: Capacity derived by floor division
- **WHEN** the grid's current tier icon size and the canvas's available width and height are known
- **THEN** the number of columns is the available width divided by the tier icon size rounded down, and the number of rows is the available height divided by the tier icon size rounded down

#### Scenario: Leftover space is not used to stretch icons
- **WHEN** the available width or height does not divide evenly by the tier icon size
- **THEN** the remaining space is left unused rather than growing icon size beyond the tier value

### Requirement: Cell Hover Affordance
The system SHALL highlight a grid cell's entire area, including any space not occupied by its icon or label, when the mouse hovers over a cell that contains a bookmark, and SHALL show a pointer cursor while hovering such a cell at rest. The system SHALL NOT apply any hover highlight or cursor change to a grid cell that contains no bookmark.

#### Scenario: Hovering an occupied cell highlights the whole cell
- **WHEN** the mouse moves over a grid cell that contains a bookmark
- **THEN** the entire cell area is highlighted, including any space around the icon and label not filled by their own content

#### Scenario: Pointer cursor while hovering an occupied cell
- **WHEN** the mouse is over a grid cell that contains a bookmark and no drag is in progress
- **THEN** the cursor is a pointer

#### Scenario: Grabbing cursor while a bookmark is being dragged
- **WHEN** the user is actively dragging a bookmark icon
- **THEN** the cursor is a grabbing cursor rather than a pointer

#### Scenario: Empty cells show no hover feedback
- **WHEN** the mouse moves over a grid cell that contains no bookmark and no drag is in progress
- **THEN** the cell is not highlighted and the cursor remains the default arrow

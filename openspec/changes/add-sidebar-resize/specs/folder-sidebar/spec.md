## ADDED Requirements

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

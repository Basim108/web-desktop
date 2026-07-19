## ADDED Requirements

### Requirement: Export and Import Controls in the General Settings Window
The General Settings window SHALL provide an Export control and an Import control
in its actions footer, left-aligned, with the existing Save control remaining
right-aligned in the same footer. The Export control SHALL export the entire
extension state to a downloaded JSON file. The Import control SHALL open the
operating system's file picker restricted to JSON files so the user can choose a
previously exported file from their local machine; the chosen file SHALL be read
locally and SHALL NOT be transmitted off-device. Export and Import SHALL act
immediately when activated, independently of the Save control (which continues to
apply only the window's staged Background edits).

#### Scenario: Export and Import controls are present in the footer
- **WHEN** the General Settings window is open
- **THEN** its footer shows an Export control and an Import control left-aligned, and the Save control right-aligned

#### Scenario: Export and Import act independently of Save
- **WHEN** the user activates Export or Import
- **THEN** the action runs immediately without requiring the Save control, and Save still applies only the staged Background edits

#### Scenario: Export downloads the state file
- **WHEN** the user activates the Export control
- **THEN** the entire extension state is downloaded as a JSON file named `YYYY-MM-DD-HH-mm-bookmark-desktop.json`

#### Scenario: Import opens a local JSON file picker
- **WHEN** the user activates the Import control
- **THEN** the operating system's file picker opens for choosing a JSON file from the local machine

### Requirement: Custom Backup Confirmation Before Import
When the user chooses a compatible file to import, the system SHALL present a
custom in-app confirmation (not the browser's native OK/Cancel dialog) that warns
the import will replace all current bookmarks and settings and asks whether to
back up first, with three clearly labeled choices: **Yes** (back up the current
state, then import), **No** (import without a backup), and **Cancel** (abort,
changing nothing). The replace SHALL proceed only on Yes or No; Cancel SHALL
leave the extension state unchanged. The confirmation SHALL be presented as a
focused dialog titled "Import Bookmarks", sized to its own content, not stretched
to the dimensions of the settings panel behind it.

#### Scenario: Confirmation uses labeled Yes / No / Cancel choices
- **WHEN** the user chooses a compatible file to import
- **THEN** a custom confirmation appears warning that the import replaces everything, with Yes, No, and Cancel choices

#### Scenario: Confirmation is sized to its content
- **WHEN** the confirmation is shown
- **THEN** it is sized to its own message and buttons rather than stretched to fill the settings panel, with no large empty area

#### Scenario: Import windows are titled "Import Bookmarks"
- **WHEN** the confirmation or the post-import summary is shown
- **THEN** it displays the title "Import Bookmarks"

#### Scenario: Yes backs up then imports
- **WHEN** the user answers Yes to the confirmation
- **THEN** the current state is exported first and then the import proceeds

#### Scenario: No imports without a backup
- **WHEN** the user answers No to the confirmation
- **THEN** the import proceeds and no backup is produced

#### Scenario: Cancel aborts the import
- **WHEN** the user answers Cancel to the confirmation
- **THEN** nothing is deleted or created and the extension state is unchanged

### Requirement: Export and Import Finish on Success
A successful Export SHALL close the General Settings window when it finishes,
behaving like the Save control. A successful Import with no skipped entries SHALL
reload the new-tab page so the fully replaced tree and restored settings render
cleanly with a valid selection (which also dismisses the window). A successful
Import that skipped one or more entries SHALL instead show a summary titled
"Import Bookmarks" telling the user the import completed with issues, how many
entries were skipped, and to consult the downloaded report file by name; the page
SHALL reload only after the user acknowledges the summary (so the message is not
erased by an immediate reload). An Import that is denied before doing any destructive work — because the
chosen file is not parseable JSON or its major version is incompatible — SHALL
keep the window open and show the denial message, so the user learns why nothing
changed.

#### Scenario: Successful export closes the window
- **WHEN** an export finishes downloading the state file
- **THEN** the General Settings window closes

#### Scenario: A clean import reloads the page
- **WHEN** an import completes its replace-and-restore with no skipped entries
- **THEN** the new-tab page reloads, rendering the restored tree and settings

#### Scenario: An import with skipped entries reports before reloading
- **WHEN** an import completes but skipped one or more entries
- **THEN** the user is shown a summary stating the import finished with issues, how many entries were skipped, and to see the downloaded report file, and the page reloads only after the user acknowledges

#### Scenario: A denied import keeps the window open with a message
- **WHEN** an import is denied because the file is not parseable JSON or its major version is incompatible
- **THEN** the window stays open and shows the denial message, and nothing is changed

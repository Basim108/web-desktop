## Why

Every piece of desktop customization this extension adds on top of Chrome's
bookmarks — grid positions, per-bookmark label settings, per-folder and
per-bookmark custom icons, the canvas background, the default folder icon, the
sidebar width — lives only in this profile's `chrome.storage.local` and
IndexedDB. Chrome syncs the bookmark *structure*, but none of this side-car
state. A reinstall, a new machine, or a corrupted profile loses all of it, with
no way to snapshot or move it. This change adds a one-file **export** of the
entire extension state (bookmarks included) and a **replace-strategy import**
that restores it, so a user can back up, restore, or migrate their whole desktop.

## What Changes

- Add **Export** and **Import** buttons to the General Settings ("Settings")
  window (`GeneralSettingsWindow`).
- **Export** serializes the entire extension state to one JSON file and
  downloads it locally (Blob + anchor; no `chrome.downloads` permission). The
  file is named `YYYY-MM-DD-HH-mm-bookmark-desktop.json`. It contains:
  1. The full bookmark tree under each protected root (Bookmarks Bar, Other
     Bookmarks, Mobile) — every folder and bookmark, with titles and URLs.
  2. General settings: the `generalSettings` object (canvas background presence
     + fit), the sidebar width, and the two global reserved-key images (canvas
     background, default folder icon) inlined as base64 data URLs.
  3. Per-folder settings and per-folder custom icons (inlined base64).
  4. Per-bookmark settings and grid positions and per-bookmark custom icons
     (inlined base64).
- The export is **self-contained and free of Chrome bookmark ids**: each item's
  state is embedded *inline in its tree node*, keyed by structural position, not
  by id. This is required because import recreates every bookmark and Chrome
  assigns brand-new ids — an id-keyed export could never be restored.
- The file carries a **format `version`** in `x.y.z` form (starting `1.0.0`),
  stamped from a single source-of-truth constant. `x` bumps only on a breaking
  format change, `y` on new features, `z` on bug fixes.
- **Import** opens the OS file picker (`<input type="file"
  accept=".json,application/json">`), reads the file locally, and:
  1. **Validates only that the file is parseable JSON** (no JSON-Schema
     validation) and carries a `version`. If it is not valid JSON, or its major
     version differs from the importer's, the import is denied and the user is
     notified (a lower major is a format the current importer no longer reads; a
     higher major is a newer format this build predates).
  2. **Prompts the user to back up current bookmarks first.** On "Yes", the
     current state is exported (the same Export path) before anything is
     deleted.
  3. **Replaces, does not merge.** All non-root folders and bookmarks (every
     child of the protected roots `1`/`2`/`3`) are deleted; the protected roots
     `0`/`1`/`2`/`3` are never touched. The tree from the JSON is then recreated
     under the same roots via `chrome.bookmarks.create`, and each new node's
     positions, settings, and custom icon are restored under its newly assigned
     id.
  4. **Restores general settings** — sidebar width, general-settings object, and
     the two global reserved-key images.
- **Skip & report** on bad entries: an entry whose title is empty or whose URL
  fails the safe-scheme allowlist (`isSafeNavigationUrl`) is skipped and counted
  (a skipped folder takes its descendants with it), rather than aborting the
  restore. When any entry is skipped, a report file
  `<import-file-name-without-extension>-report.json` is downloaded, listing each
  skipped entry as `{ absoluteFolderPath, name, url, reason }`.
- **Import lock:** the entire delete-and-recreate span runs under a lock that
  suspends the extension's bookmark-sync listeners — the background
  auto-placement/cleanup handlers and the new-tab UI's live-refetch subscribers —
  so import events don't fight the restore. The lock is enabled before the delete
  phase and disabled only after all creation finishes; one UI resync fires on
  release. This makes the importer the sole writer of restored positions/state.
- **BREAKING (data): Import is destructive.** It deletes the profile's existing
  bookmarks before recreating from the file. This is intentional (replace
  strategy) and is why the pre-import backup prompt exists.
- Accepted rough edge (v1): no import batching and no de-duplication.

## Capabilities

### New Capabilities
- `state-transfer`: exporting the entire extension state (bookmark tree +
  positions + per-item settings + per-item and global custom icons + general
  settings) to a single versioned, id-free JSON file, and importing such a file
  with a replace strategy — JSON-only validation, major-version gating,
  pre-import backup prompt, delete-and-recreate of all non-root bookmarks,
  id-remapped restoration of state, and a skip-and-report file for entries that
  fail creation guards.

### Modified Capabilities
- `general-settings`: the General Settings window's actions footer gains
  left-aligned **Export** and **Import** buttons (Save stays right-aligned);
  they act immediately and close the window on success (a pre-flight import
  denial keeps it open with a message), plus the import's backup-first
  confirmation flow.

## Impact

- Affected code:
  - `src/newtab/components/GeneralSettingsWindow.tsx` — add left-aligned
    Export/Import buttons to the actions footer (hidden JSON file input for
    Import), close-on-success, the backup-first confirmation, and denial/result
    messaging.
  - `src/lib/transfer/version.ts` (new) — the single source-of-truth
    `EXPORT_FORMAT_VERSION` constant and major-version comparison helper.
  - `src/lib/transfer/exportState.ts` (new) — read the whole bookmark tree +
    all storage keys + all IndexedDB icons and assemble the id-free JSON,
    inlining icons as base64 data URLs.
  - `src/lib/transfer/importState.ts` (new) — parse + version-gate, acquire the
    import lock, delete all non-root children, recreate the tree, remap ids,
    restore positions/settings/icons and general settings, release the lock,
    accumulate the skip report.
  - `src/lib/bookmarks/events.ts` — add the import-lock flag + `chrome.runtime`
    message handler on the background listeners, and suspend/resume + guarded
    dispatch for the new-tab refetch subscribers.
  - `src/lib/transfer/types.ts` (new) — the export file's TypeScript shape
    (`ExportFileV1`, node shapes, general block).
  - `src/lib/transfer/download.ts` (new, or a small helper) — Blob + anchor
    download for the export file and the report file, plus the filename
    formatters.
  - `src/lib/import/dataUrl.ts` — reuse `dataUrlToBlob`; add a Blob→data-URL
    encoder for export (or a sibling helper).
  - Reuses existing modules unchanged: `bookmarks/create.ts`
    (`createFolder`/`createBookmark`), `bookmarks/read.ts` (`getFolderTree`),
    `bookmarks/urlSafety.ts`, `storage/iconDb.ts`, `storage/positions.ts`,
    `storage/bookmarkSettings.ts`, `storage/folderSettings.ts`,
    `storage/generalSettings.ts`, `storage/canvasBackground.ts`,
    `storage/defaultFolderIcon.ts`, `storage/local.ts` (sidebar width).
  - `src/newtab/main.css` — footer layout change (`space-between` with a
    left button group), Export/Import button styles, confirmation, and
    result/error messaging, matching the settings-window look.
- No new storage keys and no schema migration — restored icons live in the
  existing IndexedDB store keyed by the new nodes' ids.
- No new dependencies and no new manifest permissions — `chrome.bookmarks`
  (held) covers create/read/remove; files are read/written locally via the File
  and Blob APIs.
- Interaction with the background listener: during import the sync listeners are
  held inert by the import lock (cross-context: a `chrome.runtime` message gates
  the background handlers, a local suspend gates the new-tab subscribers), so
  neither `onRemoved` cleanup nor `onCreated` auto-placement acts on import
  events; the importer writes all restored positions/state itself (design.md).

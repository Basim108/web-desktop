## Context

The sidebar renders the Chrome folder tree (`FolderTreeNode.tsx`) and lets users
edit a folder through a centered, portaled `FolderSettingsWindow` opened from a
per-row settings gear. That window already implements the pattern this change
needs: it **stages** name and custom-icon edits in local state and applies them
atomically only on Save; closing, Escape, or the backdrop discards the staged
state. Folder creation already exists as a library primitive —
`createFolder(parentId, title)` in `lib/bookmarks/create.ts` — but is currently
only invoked by the uTab importer; there is no UI path to create a folder.

Cross-tab structure sync (`lib/bookmarks/events.ts`) already propagates
`chrome.bookmarks` creations to every open new-tab page, so a folder created here
appears everywhere without extra wiring. Custom icons live in IndexedDB keyed by
the folder's Chrome id (`putIcon`) plus a `hasCustomIcon` flag
(`setFolderHasCustomIcon`) — both require a real, Chrome-assigned id.

## Goals / Non-Goals

**Goals:**
- Let a user create a subfolder from any folder row, including root folders.
- Reuse the existing staged-edit settings window so the new folder can be named
  and icon'd before it exists.
- Guarantee nothing lands in `chrome.bookmarks`/icon storage unless the user
  saves — discard on close with nothing to clean up.
- Place the new folder as the first child of the target folder.

**Non-Goals:**
- Creating bookmarks (URLs) from the sidebar — folders only.
- Choosing the insertion index in the UI — first child is fixed.
- Selecting/navigating to the new folder on the canvas after creation (folders
  are sidebar-only; we only expand to reveal it).
- Any change to how existing folders are edited or removed.

## Decisions

### Draft mode: nothing in Chrome until Save (not optimistic-create-then-delete)
The window opens against a **draft** with no backing Chrome node. On Save we call
`createFolder(parentId, name, 0)`, then, if an icon was staged, `putIcon(newId,
file)` + `setFolderHasCustomIcon(newId, true)` using the id Chrome returns.

- *Why over optimistic create:* the requirement is "created only on Save." An
  optimistic approach (create a real "New Folder" immediately, delete it on
  cancel) would flash a placeholder folder into every open tab via cross-tab
  sync, leave an orphan if the tab closes/crashes before cancel, and force a
  placeholder name past `createFolder`'s empty-name guard. The draft approach has
  none of these failure modes and "discard" is free — there is simply nothing to
  undo.
- *Why it fits:* the settings window already stages name and icon and only writes
  on Save; draft mode is the same flow minus a starting node and minus the
  persisted-icon-load path.

### Reuse `FolderSettingsWindow` with a "new folder" mode, rather than a new component
Add a mode flag so one window body serves both edit and create. In create mode
there is no `folder` node, so: the title reads for a new folder, the name starts
empty (Save disabled until non-empty — the existing `nameValid` gate already does
this), the icon preview shows the default folder icon, and the **Remove folder**
action is hidden (nothing to remove). Save branches: create-then-apply-icon
instead of update-title + apply-icon-by-existing-id.

- *Alternative considered:* a separate `NewFolderWindow` component. Rejected —
  it would duplicate icon staging, object-URL lifecycle, validation, preview, and
  window chrome. The two flows differ only at the Save boundary and in showing
  Remove.

### `createFolder` gains an optional index for first-child placement
Extend the signature to `createFolder(parentId, title, index?)`, passing `index`
straight into `chrome.bookmarks.create({ parentId, title, index })`. Called with
`0` here; existing callers (uTab import) omit it and keep append-at-end behavior.

- *Why:* "first child" is `index: 0`. This is the minimal, backward-compatible
  extension of the existing primitive.

### Add-subfolder button lives in `FolderTreeNode`, reveal mirrors the gear
Render the button on every row (root and non-root), reusing the same
hover/focus-reveal CSS approach as `folder-settings-toggle` so it does not shift
layout and stays keyboard-reachable. The row already owns hover state and the
single-window `onOpenSettings` lifting in `Sidebar.tsx`; "which folder is opening
a draft" is tracked alongside the existing `openSettingsFolderId` so the
single-window rule and the draft mode are coordinated in one place.

- *Root rows:* they render no gear but do render this button; the button's action
  (create a child) does not edit the root itself, so it is consistent with roots
  being non-editable.

### Auto-expand the parent on successful save
After create, set the parent row's `expanded` to true so the new first child is
visible. Expansion state is local to `FolderTreeNode`; the save callback flips it.

## Risks / Trade-offs

- **Coupling create-mode into `FolderSettingsWindow`** → keep the branch surface
  small: a single `mode`/absent-`folder` distinction gating title text, the
  Remove button, the initial name, and the Save handler. Cover both branches in
  `FolderSettingsWindow.test.tsx`.
- **Single-window state now spans edit and draft** → model draft opening through
  the same lifted state that enforces one-window-at-a-time, so opening a draft
  closes any open edit window (and vice versa), matching the existing rule.
- **Reveal-on-hover for two buttons on one row** → both use the same visibility
  mechanism and occupy reserved space, so revealing them never reflows the row
  (already required for the gear; extended to the add button).
- **Icon on a not-yet-existing folder** → icon bytes are held in memory (staged
  upload + object-URL preview) until Save; only after `createFolder` returns a
  real id do we `putIcon`/`setFolderHasCustomIcon`, so there is never an
  icon keyed to a nonexistent folder.

## Open Questions

- None blocking. (Whether to also focus/select the new folder after creation is
  intentionally out of scope; we only expand to reveal it.)

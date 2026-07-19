## Context

The extension's customization state is a side-car layer glued to Chrome's
bookmark store entirely through Chrome bookmark ids:

- `chrome.storage.local`: `positions` (folderId → bmId → cell),
  `bookmarkSettings` (bmId → …), `folderSettings` (folderId → …),
  `sidebarWidth`, `generalSettings`.
- IndexedDB store `icons`: per-item icons keyed by bmId/folderId, plus two
  global reserved keys `__canvas_background__` and `__default_folder_icon__`.
- Structure itself (folders, titles, urls) lives in `chrome.bookmarks`.

Chrome bookmark ids are assigned locally and are not stable across
profiles/machines. The import uses a **replace** strategy that deletes and
recreates every bookmark, so every id changes. The whole design follows from
that one fact.

## Goals / Non-Goals

Goals:
- One JSON file captures the entire extension state and restores it faithfully
  on the same or a different profile.
- Restoration is id-independent: it survives Chrome reassigning every id.
- Destructive steps are gated behind a backup prompt.
- A hand-edited or partially invalid file degrades gracefully (skip + report),
  never a silent partial success.

Non-Goals:
- Merge/reconcile with existing bookmarks (explicitly replace-only for v1).
- De-duplication or diffing.
- JSON-Schema validation (parse-as-JSON + version gate only, per decision).
- Batching the `onCreated` event storm (accepted as rough for v1).

## Decision 1 — Id-free, self-contained file format

State is embedded **inline in each tree node**, never keyed by Chrome id. Import
rebuilds the tree, receives new ids from Chrome, and writes state under those
new ids. Shape (v1):

```jsonc
{
  "version": "1.0.0",
  "roots": {
    "1": { "children": [ <node>, … ] },   // Bookmarks Bar
    "2": { "children": [ … ] },            // Other Bookmarks
    "3": { "children": [ … ] }             // Mobile
  },
  "general": {
    "sidebarWidth": 280,
    "generalSettings": { "background": { "kind": "upload", "fit": "cover" } },
    "canvasBackgroundIcon": "data:image/png;base64,…" | null,
    "defaultFolderIcon":    "data:image/png;base64,…" | null
  }
}

// node (folder):
{ "type": "folder", "title": "Work",
  "settings": { "hasCustomIcon": true },
  "icon": "data:image/…" | null,
  "children": [ <node>, … ] }

// node (bookmark):
{ "type": "bookmark", "title": "Docs", "url": "https://…",
  "position": { "page": 0, "row": 1, "col": 2 } | null,
  "settings": { "labelDisplay": "under-icon", "hasCustomIcon": false },
  "icon": "data:image/…" | null }
```

Notes:
- `roots` is keyed by the well-known protected-root ids `1`/`2`/`3`. These ids
  *are* stable across Chrome profiles (unlike the ids of user folders/bookmarks),
  so keying the top level by them is safe and lets import restore each item into
  the same root it came from. A root absent in the file is left untouched-then-
  emptied like the others (still cleared by the replace step; just gets no new
  children).
- `hasCustomIcon` in `settings` is redundant with `icon` presence but is kept so
  the restored `chrome.storage.local` metadata mirror matches exactly what the
  running app expects (it uses the mirror to avoid async IndexedDB reads).
- Icons are inlined as base64 data URLs (same representation uTab import already
  consumes via `dataUrlToBlob`). This is what makes the file self-contained; it
  also makes the file large for icon-heavy setups — accepted for v1.

## Decision 2 — Version semantics and the compatibility gate

A single constant `EXPORT_FORMAT_VERSION` (in `src/lib/transfer/version.ts`) is
the source of truth. Export stamps it into `version`. Semver-style meaning:

- `x` (major): breaking format change. The importer of major `x` cannot process
  a file of a different major.
- `y` (minor): additive feature. Same-major files remain importable.
- `z` (patch): bug fix. No compatibility effect.

Import gate (on the parsed `version`):

| File major vs. importer major | Action |
|---|---|
| equal    | proceed (any `y`/`z` accepted) |
| file **lower**  | deny — "This backup uses an older format this version can no longer import." |
| file **higher** | deny — "This backup was made by a newer version; please update the extension." |

Rationale: the user specified denying a *previous* major; the symmetric higher-
major case is denied too because a build predating a breaking format cannot
safely interpret it. Both are surfaced as clear, distinct messages. A missing or
non-`x.y.z` `version` is treated as invalid (deny). **Confirmed by the user:
higher-major denial is preferred over a best-effort import.**

> STANDING RULE (applies to all future proposals, not just this one): any
> proposal that would **raise the major** of `EXPORT_FORMAT_VERSION` — i.e.
> introduce a breaking change to the export/import file format — MUST call that
> out explicitly to the user during the proposal phase. A major-version change
> is never allowed to pass unnoticed. Minor (`y`) and patch (`z`) bumps do not
> require this callout. This is recorded in memory as durable feedback so it
> carries across sessions.

## Decision 3 — Import order and the import lock

The importer runs in the newtab page context; the sync listeners run in the
**background service worker**. During a replace-import the extension's normal
"keep side-car state in sync with live bookmark events" behavior is exactly
*wrong*: it would auto-place bookmarks we are about to position ourselves, and
garbage-collect state we are about to overwrite. So the whole delete+recreate
span runs under an **import lock** that suspends those listeners. Decision made
by the user: lock is enabled before the delete phase and disabled only after all
creation finishes.

### What the lock suppresses

`events.ts` registers two independent groups of listeners:
- **Background position/cleanup sync** (`registerBookmarkListeners`, in the
  service worker): `onCreated` → `placeNewBookmark` (auto-place at next free
  cell), `onRemoved` → `cleanUpRemovedSubtree` (GC positions/settings/icons),
  `onMoved` → replace. All three MUST be inert while the lock is held.
- **Newtab UI refetch subscribers** (`subscribeToBookmarkChanges`, in the newtab
  bundle): the canvas/sidebar hooks refetch on every event. Under the lock these
  are suppressed to avoid a refetch storm; one `forceBookmarkResync()` fires on
  unlock so the UI catches up in a single pass.

### Why cross-context signaling is required

The importer (newtab) cannot flip a variable inside the service worker's module.
Two coordination points:

1. **Background listeners** — gated by an in-memory `transferImportLocked`
   boolean in the SW, toggled via a `chrome.runtime` message the importer sends
   and **awaits the ack of** before doing anything destructive. Awaiting the ack
   is what makes it race-free: once the ack returns, the SW has processed the
   set-lock message, so every bookmark event the importer subsequently triggers
   (all `remove`/`create` calls are issued *after* the ack) is delivered to
   handlers that already see the flag as `true`. No storage-propagation race.
2. **Newtab subscribers** — same process as the importer, so a module-level
   `suspendBookmarkSubscribers()` / `resumeBookmarkSubscribers()` in `events.ts`
   suffices; `subscribeToBookmarkChanges` is refactored to route callbacks
   through a guard that no-ops while suspended.

### Ordered steps

1. **Parse + version gate.** Any failure → abort, nothing locked or deleted.
2. **Backup prompt.** "Back up current bookmarks first?" On Yes, run the full
   export path and download it before continuing. On No, continue. (Cancel
   aborts — still nothing locked.)
3. **Acquire lock.** `await` the background set-lock message ack, then
   `suspendBookmarkSubscribers()` locally.
4. **Delete phase.** For each protected root `1`/`2`/`3`, read its direct
   children and `chrome.bookmarks.removeTree` each child (folders) /
   `chrome.bookmarks.remove` each leaf. Roots `0/1/2/3` themselves are never
   removed (matches `PROTECTED_ROOT_FOLDER_IDS`). `onRemoved` cleanup is inert
   (lock held), which is fine — we are wiping and rewriting all side-car state.
5. **Recreate phase (DFS per root).** Walk each root's `children` depth-first.
   For every folder call `createFolder(parentId, title)`, for every bookmark
   `createBookmark(parentId, title, url)` — reusing the existing guarded
   wrappers. Build an in-memory map from the file node to its new Chrome id.
   Attach each node's inline icon via `putIcon(newId, blob)` and set the
   `hasCustomIcon` mirror. Skipped entries (Decision 4) are recorded, not
   created. `onCreated` auto-placement is inert, so the importer is the *only*
   writer of positions.
6. **Restore positions.** Per folder, once its direct bookmark children exist,
   write the complete positions map in one `setFolderPositions(newFolderId, map)`
   keyed by the children's new ids. With the lock held there is no competing
   writer — this is a plain authoritative write, not a race.
7. **Restore per-bookmark settings** (`bookmarkSettings` under new ids) and the
   **general block** (`sidebarWidth`, `generalSettings`, the two global icons —
   put when present, clear when the file has `null`).
8. **Release lock.** All creation and side-car writes are complete and awaited.
   `resumeBookmarkSubscribers()` + one `forceBookmarkResync()` locally, then
   `await` the background clear-lock message. Releasing the background last (and
   only after positions are written) means any *trailing* `onCreated` still queued
   in the SW observes the lock as held and stays inert; nothing it could do would
   relocate an already-positioned bookmark.
9. **Skip report.** If any entry was skipped, download the report file.

### Lock-lifetime invariant

**After `importState` returns by any path, the sync listeners are back to normal.**
Three paths, three reasons it holds:
- **Pre-flight denial** (step 1 fails: unparseable JSON / incompatible major) or
  **backup-prompt cancel** (step 2): these occur *before* step 3, so the lock is
  never acquired and there is nothing to release — the listeners never stopped
  working. No unlock call is needed or made.
- **Mid-import throw** (any failure in steps 4–7 after the lock is held): steps
  3–8 are wrapped so release runs in a `finally`.
- **Success**: step 8 releases explicitly.

To make this robust against a *partial* acquire (e.g. the background ack
succeeds but the local suspend throws, or vice versa), `release()` is
**idempotent and unconditional** — it clears the background flag (best-effort
message) *and* resumes the local subscribers regardless of what `acquire()`
managed to do. So no interleaving of a failed acquire can strand either half of
the lock. Concretely: `acquire()` is called inside the `try`, and the `finally`
always calls `release()`; releasing something that was never locked is a no-op.

### Residual risk

- **Service-worker eviction mid-import.** MV3 can kill an idle SW; the in-memory
  lock would reset to `false`. In practice the continuous bookmark-event + message
  traffic keeps the SW alive across an import. Hardening options if it proves
  flaky: mirror the lock into `chrome.storage.session` and rehydrate on SW
  startup, and/or make `placeNewBookmark` skip a bookmark that already has a
  stored position (defensive idempotence). Both deferred; noted as follow-ups.
- The lock is strictly bracketed (acquired step 3, released step 8) and released
  in a `finally` so a mid-import error cannot leave listeners permanently
  suspended.

## Decision 4 — Skip-and-report

An entry is skipped when its creation guard fails: empty/whitespace title, or a
url rejected by `isSafeNavigationUrl` (bookmarks only). Consistent with the uTab
importer: a folder that fails to create takes its whole subtree into the skip
count (its descendants have nowhere to land). A bad/oversized inline icon is
*not* a skip — the item is created and simply falls back to favicon/default,
matching `attachPreviewIcon`'s existing swallow behavior.

Report file: downloaded only when `skipped >= 1`, named
`<import-file-name-without-extension>-report.json`. Each record:

```jsonc
{ "absoluteFolderPath": "Bookmarks Bar/Work/Sub",
  "name": "Docs", "url": "https://…" | null,
  "reason": "empty-title" | "unsafe-url" | "parent-skipped" }
```

`absoluteFolderPath` is assembled during the DFS walk from the root's display
name down through ancestor titles, so it is meaningful even though ids changed.

## Decision 5 — Download and file-read mechanics (no new permissions)

- **Write** (export + report): build a `Blob([json], {type:"application/json"})`,
  `URL.createObjectURL`, click a transient `<a download=filename>`, revoke the
  URL. No `chrome.downloads` permission → least privilege preserved.
- **Read** (import): `<input type="file" accept=".json,application/json">`,
  `file.text()`, `JSON.parse`. Purely local; nothing leaves the device, matching
  the security posture in `project.md`.
- Export filename: `YYYY-MM-DD-HH-mm-bookmark-desktop.json` from local time.

### Window placement and close behavior

Export and Import live in the General Settings window's **actions footer**, not a
body section. The footer changes from `justify-content: flex-end` (Save only) to
`space-between`: an Export + Import button group on the **left**, the existing
Save button on the **right**. They do not participate in the staged-then-Save
model — each acts immediately on click.

Close behavior (they "behave like Save", which dismisses the window after
applying):
- **Export**: on successful download, close the window.
- **Import**: on successful replace-and-restore, **reload the new-tab page** (see
  Amendment Fix 3) — this renders the restored tree cleanly and dismisses the
  window. Skips still count as success — the `-report.json` download is triggered
  before the reload.
- **Import pre-flight denial** (unparseable JSON or incompatible major version):
  do **not** close. These fail before the backup prompt and before any deletion,
  so the window stays open and shows the denial message — otherwise the user
  would see the window vanish with nothing changed and no explanation.
- A double-invocation guard disables all three footer buttons while any of them
  is mid-run.

## Risks / Trade-offs

- **Destructive import.** Mitigated by the mandatory backup prompt and clear
  messaging; still irreversible if the user declines the backup. Acceptable and
  intended (replace strategy).
- **Event storm.** One `onRemoved` per deleted item + one `onCreated` per created
  item; no batching. Under the import lock the *handlers* are inert, so the storm
  is cheap (early-return), but the raw event dispatch still happens. Fine at
  typical library sizes; large libraries will be slow. Accepted for v1.
- **Large files.** Base64 icons inflate the JSON. Acceptable; a future `y` bump
  could add external-icon packaging.
- **Lock leak / SW eviction.** See Decision 3 — lock released in a `finally`;
  SW-eviction hardening deferred.

## Migration

No storage schema change. The *file* format is versioned independently
(`EXPORT_FORMAT_VERSION`); future format changes bump it and the import gate
enforces compatibility. Existing profiles need no migration to adopt the feature.

## Open Questions

- Higher-major denial: **resolved — confirmed by the user** (deny, not
  best-effort).
- Should the report also be offered when `skipped === 0` (empty report) for
  audit symmetry? Current plan: no file when nothing was skipped.
- Should `sidebarWidth`/general settings restore even when the bookmark restore
  finds zero roots in the file (i.e. a settings-only file)? Current plan: yes,
  they are independent blocks.

## Amendment — manual-testing fixes (still v1, format `1.0.0`)

Three defects found in manual testing, all fixed within this change. Since
`1.0.0` has not shipped anywhere (change still in-flight), the format additions
below refine `1.0.0` in place rather than bumping the version.

### Fix 1 — roots record their title

`ExportRoot` gains a `title` field, populated on export from the live root node
(`chrome.bookmarks.getTree`). Import uses it (falling back to the
`ROOT_DISPLAY_NAMES` constant when absent, e.g. an older file) when building a
skipped entry's `absoluteFolderPath`. Motivation: the report path was previously
built from hardcoded constants that don't even match Chrome's actual titles
(`"Bookmarks Bar"` vs Chrome's `"Bookmarks bar"`), and the raw JSON gave no
human-readable indication of which root a subtree belonged to. Additive field →
no compatibility break.

### Fix 2 — custom Yes / No / Cancel backup confirmation

`window.confirm` cannot relabel its OK/Cancel buttons, and "Cancel" on the backup
question misleadingly reads as "abort the import" when it actually just skips the
backup. Replace the two `window.confirm` calls with one **custom in-app dialog**
(rendered within the settings window) offering **Yes** (back up, then import),
**No** (import without backup), **Cancel** (abort). This folds the replace
warning and the backup question into a single, clearly-labeled prompt.

Consequence for `importState`: the two boolean hooks (`confirmProceed`,
`confirmBackup`) collapse into one `confirmImport(): Promise<"backup" |
"no-backup" | "cancel">`. `"cancel"` → aborted (unchanged behavior);
`"backup"` → run `performBackup` then proceed; `"no-backup"` → proceed. The UI
implements `confirmImport` by showing the custom dialog and resolving on the
button click. e2e switches from `page.on("dialog")` to clicking the dialog's
buttons.

### Fix 3 — no stale-id crash after the replace, and a clean restored view

Root cause: the new-tab UI holds `selectedFolderId` in React state, and the
replace deletes that folder. The canvas (`useGridLayout`) and sidebar
(`useSubfolders`) both do fire-and-forget reads — `void
getBookmarksInFolder(id).then(...)` / `void getSubfolders(id).then(...)` with **no
`.catch`** — so a read of the now-deleted id rejects with "Can't find bookmark
for id" as an *uncaught* promise rejection. This is actually a **pre-existing
latent bug**: deleting the currently-viewed folder from Chrome's native manager
triggers it today, independent of import.

Critical subtlety: `releaseTransferLock()` calls `forceBookmarkResync()` *inside*
`importState`'s `finally`, i.e. **before** `importState` returns to the UI. So the
stale read fires during release — "reload after import" alone cannot prevent it.

Two-part fix:
1. **Harden the reads**: add `.catch` to the fire-and-forget
   `getBookmarksInFolder`/`getSubfolders` calls in `useGridLayout` and
   `useSubfolders` so a vanished-folder read fails silently instead of throwing.
   This also fixes the latent native-delete crash.
2. **Reload the new-tab page on import success** (instead of just closing the
   window) so the fully replaced tree and restored settings render with a valid
   selection — otherwise the user is stranded on a deleted folder showing an
   empty canvas. The report download (when there are skips) is triggered *before*
   the reload.

### Related robustness (noted, low priority)

The recreate phase creates under root ids present in the file without first
checking the root exists live. A cross-machine import where the file has a Mobile
root (`3`) but the target profile lacks it would throw an unguarded "Can't find
bookmark for id" from `chrome.bookmarks.create`. Not the defect reported (that was
the uncaught-rejection above), but worth a guard: skip a file root that has no
live counterpart. Folded into the fix tasks.

## Amendment 2 — second round of manual-testing fixes (still v1, format `1.0.0`)

Three more defects from manual testing. One (Fix 6) is a regression from
Amendment Fix 3c's `rootExists` guard.

### Fix 4 — confirmation dialog is oddly sized

The custom backup confirmation is a full-window overlay
(`.general-settings-confirm { position: absolute; inset: 0 }`), so it stretches
to the height of the Background settings UI hidden behind it and renders with a
large empty area below the buttons. Fix: size the confirmation to its own
content — while it is open, render only the confirmation inside the window
(skipping the titlebar/body/footer) so the flex-column window collapses to the
confirmation's natural height at its normal width. (Exact rendering to be tuned
against the live window.)

### Fix 5 — skipped entries are saved to the report but never surfaced

On a partial success the UI downloads `<name>-report.json` and immediately
reloads, so the user is never told anything was skipped. Fix: when
`skipped.length > 0`, show an in-window summary — "Import finished with N
issue(s); see `<name>-report.json`" — and reload **only after the user
acknowledges** (an explicit OK/Reload), since the reload would otherwise erase
the message. A clean import (zero skips) still reloads immediately. Decided:
in-app message + explicit reload, not a native `alert`.

### Fix 6 — Mobile bookmarks deleted but not recreated (regression from Fix 3c)

`rootExists(rootId)` (added in Amendment Fix 3c) pre-checks each protected root
before recreating into it and silently `continue`s when the root is absent. But
the delete phase empties the Mobile root first, and Chrome drops/hides the
now-empty Mobile node — so `rootExists("3")` reads false and the file's Mobile
subtree is silently skipped. The guard cannot tell "target never had Mobile"
from "we just emptied Mobile ourselves," and drops data in the latter.

Fix (decided: try-create + skip-and-report): remove the `rootExists` pre-check;
attempt to create the root's contents, and wrap each root's `createChildren` so
that if creation into the root genuinely fails, its subtree is recorded in the
skip report (Fix 5 then surfaces it) rather than silently dropped or crashing the
import. When Chrome keeps the empty root alive (the common case), Mobile restores
normally; when it truly can't, the user is told via the report.

> If manual testing shows Mobile still isn't restored (Chrome having dropped the
> emptied `"3"` so create-into-`"3"` also fails), escalate to the **stronger
> variant**: create each root's new children *before* deleting its old ones, so
> the root never goes empty and is never dropped. Larger restructure of the
> delete/recreate flow; deferred unless needed.

## Amendment 3 — create-before-delete to keep non-permanent roots alive (still v1, format `1.0.0`)

Manual re-test confirmed the escalation flagged in Amendment 2 Fix 6 is needed:
the Mobile root (`"3"`) is **non-permanent** — Chrome only keeps it while it has
content. The delete-first order empties `"3"`, Chrome drops the node, and the
recreate can no longer create into it, so Mobile is reported `root-unavailable`
instead of restored.

### Fix 7 — restore into roots without ever emptying them

Replace the two-phase "delete all contents, then recreate all" flow with an
interleaved **per-root create-before-delete** pass:

```
for each protected root (1, 2, 3):
  snapshot = getFolderChildren(rootId)        // ids present before import
    └─ if this throws, the root doesn't exist in this profile:
         • if the file has content for it → record its subtree as root-unavailable
         • continue (nothing to delete, nothing we can create into)
  if the file has content for this root:
    createChildren(fileRoot.children, rootId, …)   // adds new children FIRST
       └─ on failure → record the subtree as root-unavailable, skip the delete
  removeTree/remove each id in `snapshot`      // delete the OLD children LAST
```

Because the new children are created before the old ones are removed, a root
being restored into never goes empty, so Chrome never drops it and Mobile
restores normally. Bookmarks Bar / Other Bookmarks are unaffected (they never had
the drop problem); this just makes all three uniform.

Notes / edges:
- **Ordering within a root:** `chrome.bookmarks.create` appends, so during the
  window the order is `[old…, new…]`; after the old snapshot is deleted, only the
  new children remain, in export order. Correct.
- **Positions:** `setFolderPositions(rootId, newMap)` replaces the whole map for a
  root, so the old direct-children positions are overwritten by the restored
  ones; orphaned position/settings/icon records for deleted old ids are harmless
  (same as before — cleanup stays locked out during import).
- **File has no content for a root but the profile did:** we still delete that
  root's old children (replace strategy), so an emptied Mobile is dropped by
  Chrome — correct, the file said "no Mobile."
- **Genuinely absent root** (`getFolderChildren` throws): reported
  `root-unavailable` (directive 2), never a crash.

### Fix 8 — title the import windows "Import Bookmarks"

Both the Yes/No/Cancel confirmation and the post-import summary render as the sole
window content and currently have no visible title. Give both a titlebar reading
**"Import Bookmarks"**; the summary's body keeps the "N item(s) could not be
imported — see `<name>-report.json`" message and the Reload button.

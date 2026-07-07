## Context

Three fixes from `code-reviews/0001-web-desktop.md` (findings #1, #3, #4) were implemented directly on `main` in commit `a6fd044`, ahead of any spec change. This design record captures the technical decisions already made in that commit, and explains how the resulting behavior maps onto the three existing capability specs (`bookmark-canvas`, `bookmark-icons`, `folder-sidebar`) rather than a new one.

## Goals / Non-Goals

**Goals:**
- Document the shipped behavior for URL-scheme validation, removal-triggered data cleanup, and folder-drag safety guards as spec requirements.
- Decide which existing capability each new/changed requirement belongs to.

**Non-Goals:**
- No new implementation. The code is already merged and tested (`src/lib/bookmarks/urlSafety.test.ts`, `events.test.ts`, `dragResolve.test.ts`).
- No change to the other 5 findings from the same review (#2, #5, #6, #7, #8 process/infra/dev-tooling) or the 2 code-quality-only findings (#9, #10 covered separately by #11 forwardPorts) — none of those are product-capability behavior.

## Decisions

**URL-scheme validation lives in `bookmark-canvas`, not a new capability.**
The existing "Bookmark Desktop Canvas Display" requirement already owns the click-to-navigate behavior; scheme validation is a precondition on that same action, not a separate concern. `urlSafety.ts` implements an allowlist (`http:`, `https:`, `file:`, and a few other benign schemes) rather than a denylist of dangerous schemes, so an unanticipated dangerous scheme fails closed instead of failing open.

**Removal-triggered cleanup is split across two capabilities by data ownership.**
`bookmarkSettings`/`folderSettings`/`gridSettings` are canvas-layout state, so their cleanup is a `bookmark-canvas` requirement. The custom icon blob — which either a bookmark or a folder can have, keyed generically by item id (`iconDb.ts`, uploaded via the same `IconUploadControls` for both `BookmarkIcon` and `FolderTreeNode`) — is owned by the icon feature (`bookmark-icons` already has a user-initiated "Custom Icon Removal" requirement), so removal-triggered icon cleanup for both node types is a new requirement in that same capability rather than duplicated in `bookmark-canvas`. This mirrors how the code itself is split: `events.ts`'s `cleanUpRemovedSubtree` calls into both `storage/` (settings) and `iconDb.ts` (icon blob, for either node type) rather than one owning both.

**Drag-move safety is an amendment to the existing `folder-sidebar` requirement, not a new one.**
Cycle/protected-root guards and resync-on-rejection are failure-path behavior of the same "Folder-to-Folder Drag Nesting" requirement, not a distinct feature — the requirement's core promise ("dragging reparents via the bookmarks API") is unchanged; what's added is what happens when that promise can't be kept. `resolveCrossFolderDrop` computes the guard synchronously before any API call (pure ancestor-chain walk), so invalid drops never reach `chrome.bookmarks.move` at all. Resync-on-rejection reuses the existing `subscribeToBookmarkChanges` structure-sync path rather than introducing a second reconciliation mechanism.

## Risks / Trade-offs

- **[Risk]** The scheme allowlist could be too strict and block a legitimate future scheme → **Mitigation**: allowlist is a small, explicit list reviewed in `urlSafety.ts`; extending it is a one-line change if a real need arises.
- **[Risk]** Retroactively writing specs for merged code risks the spec silently drifting to match whatever the code happens to do, rather than what it should do → **Mitigation**: each spec delta below was checked against the code review's own verification notes (`code-reviews/0001-web-desktop.md` ReTAS section) before being written, not just read off the diff.
- **[Trade-off]** Splitting cleanup between `bookmark-canvas` and `bookmark-icons` means the full "what happens on delete" picture is spread across two spec files → accepted, since it matches the existing ownership split between layout state and icon storage.

## Migration Plan

None — code is already deployed. This change only updates documentation-of-record (specs) and closes the change in the archive.

## Open Questions

None outstanding; scope was confirmed with the user to cover exactly findings #1, #3, #4.

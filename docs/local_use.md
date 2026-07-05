# Trying Bookmark Desktop locally

This guide walks through building the extension from source and loading it
into Chrome as an unpacked extension, without publishing anything to the
Chrome Web Store.

## Prerequisites

- Node.js (LTS) and npm
- A Chromium-based browser (Chrome, Edge, Brave, etc.)
- Your existing bookmarks — the extension reads/writes them via the
  `chrome.bookmarks` API, so nothing needs to be imported or seeded

If you're using the provided devcontainer (`.devcontainer/`), Node and all
dev tooling are already installed; skip straight to
[Install dependencies](#1-install-dependencies).

## 1. Install dependencies

```bash
npm install
```

## 2. Choose dev mode or build mode

### Option A — dev mode (auto-rebuild on save)

```bash
npm run dev
```

This starts Vite on `http://localhost:5173` and writes a live-reloading
build to `dist/`. Keep this running while you work; it's the fastest way
to see code changes reflected in the loaded extension.

### Option B — one-off production build

```bash
npm run build
```

This writes an optimized build to `dist/` once, with no watcher running.

Either option produces the same `dist/` folder shape — an unpacked Chrome
extension — so the loading steps below are identical.

## 3. Load the unpacked extension into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this repo's `dist/` folder
5. Open a new tab — it should now show the Bookmark Desktop grid instead of
   Chrome's default new-tab page

## 4. Try it out

- Click a bookmark icon to navigate to its URL
- Drag icons around the grid to reposition them (position is remembered
  per folder, across tab reloads and browser restarts)
- Use the sidebar to switch folders; only that folder's direct bookmarks
  appear on the canvas — subfolders are sidebar-only
- Resize the window to see icons scale, then add rows/columns once they
  hit their configured max size
- Open a second new-tab page and drag an icon in one — the other tab
  updates live

## 5. Picking up code changes

- **Dev mode (Option A)**: Vite rebuilds `dist/` automatically. Chrome
  extensions don't hot-reload themselves, though — after a change, go to
  `chrome://extensions` and click the reload icon on the extension card
  (or reload the new-tab page for UI-only changes that don't touch the
  service worker).
- **Build mode (Option B)**: re-run `npm run build`, then reload the
  extension the same way.

## 6. Removing it

`chrome://extensions` → find the extension card → **Remove**. This does
not touch your actual Chrome bookmarks; the extension only reads/writes
its own layout metadata in `chrome.storage.local` and IndexedDB, which
Chrome clears automatically when the extension is removed.

## Running the automated checks yourself

These aren't required just to try the extension, but are useful if you're
changing code:

```bash
npm run typecheck   # TypeScript, no emit
npm run lint         # ESLint (includes eslint-plugin-no-unsanitized)
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright, builds dist/ and drives real Chromium
```

See [`SECURITY.md`](../SECURITY.md) for the security-focused tooling
(`npm run security:retire`, Semgrep) and for what's involved in actually
signing/publishing a `.crx` — not needed for local use.

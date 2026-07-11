import path from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TINY_PNG_PATH = path.join(__dirname, "fixtures", "tiny.png");

async function createFolder(
  page: import("@playwright/test").Page,
  title: string,
) {
  return page.evaluate(async (title) => {
    const folder = await chrome.bookmarks.create({ parentId: "1", title });
    return folder.id;
  }, title);
}

/** New folders are created under root id "1" (Bookmarks bar), which the sidebar renders collapsed by default. */
async function expandBookmarksBar(page: import("@playwright/test").Page) {
  const bookmarksBarRow = page.locator(".folder-row", {
    has: page.getByRole("button", { name: "Bookmarks bar", exact: true }),
  });
  await bookmarksBarRow.getByRole("button", { name: "Expand folder" }).click();
}

test("opening a folder's settings popup does not reflow sibling rows", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  await createFolder(page, "Alpha");
  await createFolder(page, "Beta");
  await page.reload();
  await expandBookmarksBar(page);

  const betaRow = page.locator(".folder-row", { hasText: "Beta" });
  const before = await betaRow.boundingBox();
  if (!before) throw new Error("Could not measure Beta row");

  await page
    .locator(".folder-row", { hasText: "Alpha" })
    .getByRole("button", { name: "Folder display settings" })
    .click();
  await expect(page.getByRole("group")).toBeVisible();

  const after = await betaRow.boundingBox();
  expect(after?.y).toBeCloseTo(before.y, 0);
});

test("clicking outside the popup closes it", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  await createFolder(page, "Alpha");
  await page.reload();
  await expandBookmarksBar(page);

  await page
    .locator(".folder-row", { hasText: "Alpha" })
    .getByRole("button", { name: "Folder display settings" })
    .click();
  await expect(page.getByRole("group")).toBeVisible();

  await page.locator(".canvas").click();
  await expect(page.getByRole("group")).not.toBeVisible();
});

test("pressing Escape closes the popup", async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  await createFolder(page, "Alpha");
  await page.reload();
  await expandBookmarksBar(page);

  await page
    .locator(".folder-row", { hasText: "Alpha" })
    .getByRole("button", { name: "Folder display settings" })
    .click();
  await expect(page.getByRole("group")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("group")).not.toBeVisible();
});

test("opening another folder's popup closes the previous one", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
  await createFolder(page, "Alpha");
  await createFolder(page, "Beta");
  await page.reload();
  await expandBookmarksBar(page);

  await page
    .locator(".folder-row", { hasText: "Alpha" })
    .getByRole("button", { name: "Folder display settings" })
    .click();
  await expect(page.getByRole("group")).toHaveCount(1);

  await page
    .locator(".folder-row", { hasText: "Beta" })
    .getByRole("button", { name: "Folder display settings" })
    .click();
  await expect(page.getByRole("group")).toHaveCount(1);
});

const PREVIEW_TIERS = [
  { viewportWidth: 900, label: "small", size: 32 },
  { viewportWidth: 1280, label: "medium/large", size: 48 },
  { viewportWidth: 2000, label: "ultra-large", size: 64 },
];

for (const { viewportWidth, label, size } of PREVIEW_TIERS) {
  test(`icon preview renders at ${size}px on a ${label} screen (viewport ${viewportWidth}px)`, async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: viewportWidth, height: 800 });
    await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);
    await createFolder(page, "Alpha");
    await page.reload();
    await expandBookmarksBar(page);

    await page
      .locator(".folder-row", { hasText: "Alpha" })
      .getByRole("button", { name: "Folder display settings" })
      .click();
    await page.getByLabel("Upload icon").setInputFiles(TINY_PNG_PATH);

    const preview = page.locator(".folder-settings-icon-preview .custom-icon");
    await expect(preview).toBeVisible();
    const box = await preview.boundingBox();
    expect(box?.width).toBeCloseTo(size, 0);
    expect(box?.height).toBeCloseTo(size, 0);
  });
}

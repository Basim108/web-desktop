import { test, expect } from "./fixtures";

const NEWTAB = "src/newtab/index.html";

/** Creates a folder under a parent (default: Bookmarks bar, root id "1") and returns its id. */
async function createFolder(
  page: import("@playwright/test").Page,
  title: string,
  parentId = "1",
) {
  return page.evaluate(
    async ({ title, parentId }) => {
      const node = await chrome.bookmarks.create({ parentId, title });
      return node.id;
    },
    { title, parentId },
  );
}

/** New folders are created under root id "1" (Bookmarks bar), which the sidebar renders collapsed by default. */
async function expandBookmarksBar(page: import("@playwright/test").Page) {
  const bookmarksBarRow = page.locator(".folder-row", {
    has: page.getByRole("button", { name: "Bookmarks bar", exact: true }),
  });
  await bookmarksBarRow.getByRole("button", { name: "Expand folder" }).click();
}

test("adds a subfolder as the first child on Save and reveals it", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${NEWTAB}`);

  // A parent folder that already has two children, so we can prove the new one
  // lands at index 0 (first child).
  const parentId = await createFolder(page, "Parent");
  await createFolder(page, "Existing B", parentId);
  await createFolder(page, "Existing C", parentId);
  await page.reload();
  await expandBookmarksBar(page);

  // A second, already-open tab with Parent expanded, to prove the new folder
  // syncs live without a reload.
  const other = await context.newPage();
  await other.goto(`chrome-extension://${extensionId}/${NEWTAB}`);
  await expandBookmarksBar(other);
  const otherParentRow = other.locator(".folder-row", { hasText: "Parent" });
  await otherParentRow.getByRole("button", { name: "Expand folder" }).click();

  const parentRow = page.locator(".folder-row", { hasText: "Parent" });
  await parentRow.getByRole("button", { name: "Add subfolder" }).click();

  const dialog = page.getByRole("dialog", { name: "New Folder" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Remove folder" }),
  ).toHaveCount(0);

  await dialog.getByLabel("Name", { exact: true }).fill("New Child");
  await dialog.getByRole("button", { name: "Save" }).click();

  // Window closes and the parent auto-expands to reveal the new child.
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "New Child" })).toBeVisible();

  // It is the first child (index 0) in Chrome's own store.
  const childTitles = await page.evaluate(async (parentId) => {
    const children = await chrome.bookmarks.getChildren(parentId);
    return children.map((node) => node.title);
  }, parentId);
  expect(childTitles).toEqual(["New Child", "Existing B", "Existing C"]);

  // The other open tab, already showing Parent's children, sees the new folder
  // appear live without a reload.
  await expect(other.getByRole("button", { name: "New Child" })).toBeVisible();
});

test("closing the draft without saving creates nothing", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${NEWTAB}`);

  const parentId = await createFolder(page, "Parent");
  await page.reload();
  await expandBookmarksBar(page);

  const parentRow = page.locator(".folder-row", { hasText: "Parent" });
  await parentRow.getByRole("button", { name: "Add subfolder" }).click();

  const dialog = page.getByRole("dialog", { name: "New Folder" });
  await dialog.getByLabel("Name", { exact: true }).fill("Should Not Persist");
  await dialog.getByRole("button", { name: "Close" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText("Should Not Persist")).toHaveCount(0);

  const childCount = await page.evaluate(async (parentId) => {
    const children = await chrome.bookmarks.getChildren(parentId);
    return children.length;
  }, parentId);
  expect(childCount).toBe(0);
});

test("root folders (Bookmarks bar) can add a subfolder too", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${NEWTAB}`);

  const bookmarksBarRow = page.locator(".folder-row", {
    has: page.getByRole("button", { name: "Bookmarks bar", exact: true }),
  });
  // Root rows have no gear but do offer the add-subfolder button.
  await expect(
    bookmarksBarRow.getByRole("button", { name: "Folder settings" }),
  ).toHaveCount(0);
  await bookmarksBarRow.getByRole("button", { name: "Add subfolder" }).click();

  const dialog = page.getByRole("dialog", { name: "New Folder" });
  await dialog.getByLabel("Name", { exact: true }).fill("Top Level");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Top Level" })).toBeVisible();

  const titles = await page.evaluate(async () => {
    const children = await chrome.bookmarks.getChildren("1");
    return children.map((node) => node.title);
  });
  expect(titles[0]).toBe("Top Level");
});

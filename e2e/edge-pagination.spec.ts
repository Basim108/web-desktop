import { test, expect } from "./fixtures";

test("holding a dragged icon near the canvas edge auto-advances the page", async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/newtab/index.html`);

  // Enough bookmarks to guarantee more than one page regardless of the
  // test runner's viewport (default global settings cap icons at 96px).
  await page.evaluate(async () => {
    for (let i = 0; i < 40; i++) {
      await chrome.bookmarks.create({
        parentId: "1",
        title: `Edge Test ${i}`,
        url: `https://example.com/${i}`,
      });
    }
  });
  await page.reload();

  await expect(page.getByText("Edge Test 0")).toBeVisible();
  await expect(page.getByText(/Page 1 of \d+/)).toBeVisible();

  const canvas = page.locator(".canvas");
  const canvasBox = await canvas.boundingBox();
  const iconBox = await page.getByText("Edge Test 0").boundingBox();
  if (!canvasBox || !iconBox) throw new Error("Could not measure elements");

  // Pick up the first icon and hold it near the right edge of the canvas.
  await page.mouse.move(
    iconBox.x + iconBox.width / 2,
    iconBox.y + iconBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + canvasBox.width - 10, iconBox.y, {
    steps: 10,
  });

  await expect(page.getByText(/Page 2 of \d+/)).toBeVisible({
    timeout: 2000,
  });

  await page.mouse.up();
});

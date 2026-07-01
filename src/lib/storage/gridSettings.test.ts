import { beforeEach, describe, expect, it } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import {
  clearGridSettingsOverride,
  getGlobalGridSettings,
  resolveGridSettings,
  setGlobalGridSettings,
  setGridSettingsOverride,
} from "./gridSettings";
import { GLOBAL_DEFAULT_GRID_SETTINGS } from "./schema";
import type { GridSettings } from "./schema";

const mock = installChromeMock();

beforeEach(() => {
  mock.reset();
});

function folderNode(
  id: string,
  parentId: string,
): chrome.bookmarks.BookmarkTreeNode {
  return { id, parentId, index: 0, title: id, syncing: false };
}

const fixed6x4: GridSettings = {
  mode: "fixed",
  maxIconSize: 96,
  minIconSize: 48,
  fixedCols: 6,
  fixedRows: 4,
};

describe("resolveGridSettings", () => {
  it("falls back to the global default when nothing is overridden", async () => {
    mock.addNode(folderNode("f1", "0"));
    expect(await resolveGridSettings("f1")).toEqual(
      GLOBAL_DEFAULT_GRID_SETTINGS,
    );
  });

  it("uses the folder's own override when present", async () => {
    mock.addNode(folderNode("f1", "0"));
    await setGridSettingsOverride("f1", fixed6x4);
    expect(await resolveGridSettings("f1")).toEqual(fixed6x4);
  });

  it("inherits the nearest ancestor's override", async () => {
    mock.addNode(folderNode("work", "0"));
    mock.addNode(folderNode("tickets", "work"));
    await setGridSettingsOverride("work", fixed6x4);

    expect(await resolveGridSettings("tickets")).toEqual(fixed6x4);
  });

  it("prefers the folder's own override over an ancestor's", async () => {
    mock.addNode(folderNode("work", "0"));
    mock.addNode(folderNode("tickets", "work"));
    await setGridSettingsOverride("work", fixed6x4);
    const auto8x5: GridSettings = {
      mode: "auto",
      maxIconSize: 120,
      minIconSize: 60,
    };
    await setGridSettingsOverride("tickets", auto8x5);

    expect(await resolveGridSettings("tickets")).toEqual(auto8x5);
  });

  it("walks past a folder with no override to find a grandparent's", async () => {
    mock.addNode(folderNode("work", "0"));
    mock.addNode(folderNode("tickets", "work"));
    mock.addNode(folderNode("urgent", "tickets"));
    await setGridSettingsOverride("work", fixed6x4);

    expect(await resolveGridSettings("urgent")).toEqual(fixed6x4);
  });

  it("respects a custom global default set via setGlobalGridSettings", async () => {
    mock.addNode(folderNode("f1", "0"));
    const customGlobal: GridSettings = {
      mode: "auto",
      maxIconSize: 80,
      minIconSize: 40,
    };
    await setGlobalGridSettings(customGlobal);

    expect(await getGlobalGridSettings()).toEqual(customGlobal);
    expect(await resolveGridSettings("f1")).toEqual(customGlobal);
  });
});

describe("clearGridSettingsOverride", () => {
  it("reverts a folder to inheriting once its override is cleared", async () => {
    mock.addNode(folderNode("f1", "0"));
    await setGridSettingsOverride("f1", fixed6x4);
    await clearGridSettingsOverride("f1");

    expect(await resolveGridSettings("f1")).toEqual(
      GLOBAL_DEFAULT_GRID_SETTINGS,
    );
  });
});

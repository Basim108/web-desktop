import { beforeEach, describe, expect, it } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import {
  DEFAULT_FOLDER_SETTINGS,
  getFolderSettings,
  resolveFolderDisplay,
  setFolderHasCustomIcon,
  setFolderSidebarDisplay,
} from "./folderSettings";

const mock = installChromeMock();

beforeEach(() => {
  mock.reset();
});

describe("getFolderSettings", () => {
  it("returns the default (label-only, no icon) when nothing is stored", async () => {
    expect(await getFolderSettings("f1")).toEqual(DEFAULT_FOLDER_SETTINGS);
  });
});

describe("setFolderSidebarDisplay", () => {
  it("allows label-only regardless of custom icon state", async () => {
    await setFolderSidebarDisplay("f1", "label-only");
    expect((await getFolderSettings("f1")).sidebarDisplay).toBe("label-only");
  });

  it("rejects icon-only when the folder has no custom icon", async () => {
    await expect(setFolderSidebarDisplay("f1", "icon-only")).rejects.toThrow();
  });

  it("rejects icon-and-label when the folder has no custom icon", async () => {
    await expect(
      setFolderSidebarDisplay("f1", "icon-and-label"),
    ).rejects.toThrow();
  });

  it("allows icon-only once the folder has a custom icon", async () => {
    await setFolderHasCustomIcon("f1", true);
    await setFolderSidebarDisplay("f1", "icon-only");
    expect((await getFolderSettings("f1")).sidebarDisplay).toBe("icon-only");
  });
});

describe("setFolderHasCustomIcon", () => {
  it("forces sidebarDisplay back to label-only when the custom icon is removed", async () => {
    await setFolderHasCustomIcon("f1", true);
    await setFolderSidebarDisplay("f1", "icon-and-label");

    await setFolderHasCustomIcon("f1", false);

    const settings = await getFolderSettings("f1");
    expect(settings.hasCustomIcon).toBe(false);
    expect(settings.sidebarDisplay).toBe("label-only");
  });
});

describe("resolveFolderDisplay", () => {
  it("clamps to label-only if hasCustomIcon is false even when a stale setting requests an icon", () => {
    const resolved = resolveFolderDisplay({
      sidebarDisplay: "icon-and-label",
      hasCustomIcon: false,
    });
    expect(resolved).toBe("label-only");
  });

  it("returns the stored mode unchanged when hasCustomIcon is true", () => {
    const resolved = resolveFolderDisplay({
      sidebarDisplay: "icon-and-label",
      hasCustomIcon: true,
    });
    expect(resolved).toBe("icon-and-label");
  });
});

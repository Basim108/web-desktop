import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import {
  DEFAULT_FOLDER_SETTINGS,
  getFolderSettings,
  setFolderHasCustomIcon,
  setFolderSidebarDisplay,
} from "../../lib/storage/folderSettings";
import { getIcon, putIcon } from "../../lib/storage/iconDb";
import type { FolderSettings } from "../../lib/storage/schema";
import { FolderSettingsWindow } from "./FolderSettingsWindow";

const mock = installChromeMock();

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function stubImageBitmap() {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ width: 32, height: 32, close: () => {} })),
  );
}

function pngFile(name = "icon.png"): File {
  return new File([new Uint8Array(PNG_HEADER)], name, { type: "image/png" });
}

function folderNode(
  id: string,
  title = `Folder ${id}`,
): chrome.bookmarks.BookmarkTreeNode {
  return { id, parentId: "1", index: 0, title, syncing: false };
}

function renderWindow(options?: {
  folder?: chrome.bookmarks.BookmarkTreeNode;
  settings?: FolderSettings;
}) {
  const folder = options?.folder ?? folderNode("f1");
  const onClose = vi.fn();
  const onSaved = vi.fn();
  mock.addNode(folder);
  render(
    <FolderSettingsWindow
      folder={folder}
      settings={options?.settings ?? DEFAULT_FOLDER_SETTINGS}
      iconVersion={0}
      onSaved={onSaved}
      onClose={onClose}
    />,
  );
  return { folder, onClose, onSaved };
}

beforeEach(() => {
  mock.reset();
  vi.clearAllMocks();
});

describe("FolderSettingsWindow", () => {
  it("pre-fills the name and renders the display options", () => {
    renderWindow({ folder: folderNode("f1", "Work") });

    expect(screen.getByLabelText("Name")).toHaveValue("Work");
    expect(
      screen.getByRole("radio", { name: "Name only" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Icon only" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Icon + name" }),
    ).toBeInTheDocument();
  });

  it("disables icon display options until the folder has a custom icon", () => {
    renderWindow();
    expect(screen.getByRole("radio", { name: "Icon only" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Icon + name" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Name only" })).toBeEnabled();
  });

  it("stages name and display edits and applies them only on Save", async () => {
    const user = userEvent.setup();
    // Seed storage to match the settings prop — in the app the prop derives
    // from storage via useFolderSettings, so the two are always consistent.
    await setFolderHasCustomIcon("f1", true);
    const { onClose, onSaved } = renderWindow({
      settings: { sidebarDisplay: "label-only", hasCustomIcon: true },
    });

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Renamed");
    await user.click(screen.getByRole("radio", { name: "Icon only" }));

    // Nothing persisted before Save.
    expect(mock.chrome.bookmarks.update).not.toHaveBeenCalled();
    expect((await getFolderSettings("f1")).sidebarDisplay).toBe("label-only");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mock.chrome.bookmarks.update).toHaveBeenCalledWith("f1", {
      title: "Renamed",
    });
    expect((await getFolderSettings("f1")).sidebarDisplay).toBe("icon-only");
    expect(onSaved).toHaveBeenCalled();
  });

  it("discards edits when closed via the close button without saving", async () => {
    const user = userEvent.setup();
    const { onClose } = renderWindow();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Should not persist");
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
    expect(mock.chrome.bookmarks.update).not.toHaveBeenCalled();
  });

  it("closes on Escape without persisting", async () => {
    const user = userEvent.setup();
    const { onClose } = renderWindow();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
    expect(mock.chrome.bookmarks.update).not.toHaveBeenCalled();
  });

  it("disables Save for an empty or whitespace-only name", async () => {
    const user = userEvent.setup();
    renderWindow();

    await user.clear(screen.getByLabelText("Name"));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.type(screen.getByLabelText("Name"), "   ");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Valid");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("previews a staged image and enables icon options without persisting until Save", async () => {
    stubImageBitmap();
    const user = userEvent.setup();
    const { onClose } = renderWindow({ folder: folderNode("f2", "Uploads") });

    await user.upload(screen.getByLabelText("Upload image"), pngFile());

    await waitFor(() => {
      const preview = screen.getByRole("img", { name: "Uploads" });
      expect(preview.getAttribute("src")).toMatch(/^blob:/);
    });
    // Staging the upload enables the icon display options immediately.
    expect(screen.getByRole("radio", { name: "Icon only" })).toBeEnabled();
    // Nothing written to storage yet.
    expect(await getIcon("f2")).toBeUndefined();
    expect((await getFolderSettings("f2")).hasCustomIcon).toBe(false);

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(await getIcon("f2")).toBeDefined();
    expect((await getFolderSettings("f2")).hasCustomIcon).toBe(true);
  });

  it("falls back to label-only when a staged image removal leaves an icon display mode", async () => {
    const user = userEvent.setup();
    await putIcon("f3", new Blob(["bytes"], { type: "image/png" }));
    // Seed storage consistently with the prop (icon present, icon-only mode).
    await setFolderHasCustomIcon("f3", true);
    await setFolderSidebarDisplay("f3", "icon-only");
    const { onClose } = renderWindow({
      folder: folderNode("f3", "Photos"),
      settings: { sidebarDisplay: "icon-only", hasCustomIcon: true },
    });

    // Icon-only is the current selection; stage a removal of the image.
    expect(screen.getByRole("radio", { name: "Icon only" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Remove image" }));

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(await getIcon("f3")).toBeUndefined();
    const saved = await getFolderSettings("f3");
    expect(saved.hasCustomIcon).toBe(false);
    expect(saved.sidebarDisplay).toBe("label-only");
  });

  it("requires confirmation before removing, then deletes the subtree and closes", async () => {
    const user = userEvent.setup();
    const { onClose } = renderWindow();

    await user.click(screen.getByRole("button", { name: "Remove folder" }));
    expect(mock.chrome.bookmarks.removeTree).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Confirm remove" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm remove" }));
    expect(mock.chrome.bookmarks.removeTree).toHaveBeenCalledWith("f1");
    expect(mock.chrome.bookmarks.remove).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

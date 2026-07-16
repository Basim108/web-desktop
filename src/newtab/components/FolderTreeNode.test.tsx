import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import { DndTestProvider } from "../../test/DndTestProvider";
import { FolderTreeNode } from "./FolderTreeNode";
import { setFolderHasCustomIcon } from "../../lib/storage/folderSettings";

const mock = installChromeMock();

function folderNode(
  id: string,
  parentId: string,
  title: string,
): chrome.bookmarks.BookmarkTreeNode {
  return { id, parentId, index: 0, title, syncing: false };
}

beforeEach(() => {
  mock.reset();
});

/**
 * Owns the shared openSettingsFolderId state the same way Sidebar does, so
 * tests exercise the real single-window-open-at-a-time coordination rather
 * than a stand-in. FolderTreeNode relies (via useSubfolders) on
 * useDndMonitor, which requires a DndContext ancestor — in the real app
 * that's provided by App.
 */
function Harness({
  folders,
  activeFolderId,
  onSelectFolder,
}: {
  folders: chrome.bookmarks.BookmarkTreeNode[];
  activeFolderId: string | undefined;
  onSelectFolder: (folderId: string) => void;
}) {
  const [openSettingsFolderId, setOpenSettingsFolderId] = useState<
    string | undefined
  >(undefined);

  return (
    <DndTestProvider>
      <ul>
        {folders.map((folder) => (
          <FolderTreeNode
            key={folder.id}
            folder={folder}
            activeFolderId={activeFolderId}
            onSelectFolder={onSelectFolder}
            depth={0}
            openSettingsFolderId={openSettingsFolderId}
            onOpenSettings={setOpenSettingsFolderId}
          />
        ))}
      </ul>
    </DndTestProvider>
  );
}

function renderFolderTreeNode(props: {
  folder: chrome.bookmarks.BookmarkTreeNode;
  activeFolderId: string | undefined;
  onSelectFolder: (id: string) => void;
  depth: number;
}) {
  return render(
    <Harness
      folders={[props.folder]}
      activeFolderId={props.activeFolderId}
      onSelectFolder={props.onSelectFolder}
    />,
  );
}

function gearFor(title: string): HTMLElement {
  return screen
    .getByRole("button", { name: title })
    .parentElement!.querySelector(".folder-settings-toggle") as HTMLElement;
}

describe("FolderTreeNode", () => {
  it("selects the folder when its row is clicked", async () => {
    const onSelectFolder = vi.fn();
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: onSelectFolder,
      depth: 0,
    });

    await user.click(screen.getByRole("button", { name: "Work" }));
    expect(onSelectFolder).toHaveBeenCalledWith("f1");
  });

  it("expands to show subfolders when the expand toggle is clicked", async () => {
    mock.addNode(folderNode("child-1", "f1", "Personal"));
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: vi.fn(),
      depth: 0,
    });

    expect(screen.queryByText("Personal")).not.toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", { name: "Expand folder" }),
    );

    expect(await screen.findByText("Personal")).toBeInTheDocument();
  });

  it("opens the folder settings window when the gear is clicked", async () => {
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: vi.fn(),
      depth: 0,
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Folder display settings" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Folder Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Work");
  });

  it("passes settings through so icon options are disabled without a custom icon", async () => {
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: vi.fn(),
      depth: 0,
    });

    await user.click(
      screen.getByRole("button", { name: "Folder display settings" }),
    );

    expect(screen.getByRole("radio", { name: "Icon only" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Name only" })).toBeEnabled();
  });

  it("enables icon options when the folder already has a custom icon", async () => {
    await setFolderHasCustomIcon("f1", true);
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: vi.fn(),
      depth: 0,
    });

    await user.click(
      await screen.findByRole("button", { name: "Folder display settings" }),
    );

    expect(
      await screen.findByRole("radio", { name: "Icon only" }),
    ).toBeEnabled();
  });

  it("toggles the window closed when the gear is clicked again", async () => {
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: vi.fn(),
      depth: 0,
    });

    await user.click(
      screen.getByRole("button", { name: "Folder display settings" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Folder display settings" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the window on Escape", async () => {
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: vi.fn(),
      depth: 0,
    });

    await user.click(
      screen.getByRole("button", { name: "Folder display settings" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("only allows one folder's settings window to be open at a time", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        folders={[
          folderNode("f1", "0", "Work"),
          folderNode("f2", "0", "Personal"),
        ]}
        activeFolderId={undefined}
        onSelectFolder={vi.fn()}
      />,
    );

    await user.click(gearFor("Work"));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByLabelText("Name")).toHaveValue("Work");

    // Switch to the other folder by closing then opening the second window,
    // since the modal backdrop covers the sidebar while one window is open.
    await user.keyboard("{Escape}");
    await user.click(gearFor("Personal"));

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByLabelText("Name")).toHaveValue("Personal");
  });

  it("live-updates its subfolder list on a chrome.bookmarks structure event, without any drag", async () => {
    const user = userEvent.setup();
    renderFolderTreeNode({
      folder: folderNode("f1", "0", "Work"),
      activeFolderId: undefined,
      onSelectFolder: vi.fn(),
      depth: 0,
    });

    // No expand toggle yet — f1 has no subfolders.
    expect(
      screen.queryByRole("button", { name: "Expand folder" }),
    ).not.toBeInTheDocument();

    // Simulates a folder created via Chrome's native bookmark manager
    // (or another open new-tab page), not a drag within this component.
    const child = folderNode("child-1", "f1", "Personal");
    mock.addNode(child);
    mock.chrome.bookmarks.onCreated.emit("child-1", child);

    await user.click(
      await screen.findByRole("button", { name: "Expand folder" }),
    );
    expect(await screen.findByText("Personal")).toBeInTheDocument();
  });
});

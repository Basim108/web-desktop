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

/** FolderTreeNode relies (via useSubfolders) on useDndMonitor, which requires a DndContext ancestor — in the real app that's provided by App. */
function renderFolderTreeNode(props: {
  folder: chrome.bookmarks.BookmarkTreeNode;
  activeFolderId: string | undefined;
  onSelectFolder: (id: string) => void;
  depth: number;
}) {
  return render(
    <DndTestProvider>
      <ul>
        <FolderTreeNode {...props} />
      </ul>
    </DndTestProvider>,
  );
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

  it("disables icon display options until the folder has a custom icon", async () => {
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
    expect(screen.getByRole("radio", { name: "Icon + name" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Name only" })).toBeEnabled();
  });

  it("enables icon display options once the folder has a custom icon", async () => {
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
});

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import { getBookmarksInFolder } from "../../lib/bookmarks/read";
import {
  EXPORT_FORMAT_VERSION,
  parseVersion,
} from "../../lib/transfer/version";
import { GeneralSettingsWindow } from "./GeneralSettingsWindow";

const mock = installChromeMock();
const currentMajor = parseVersion(EXPORT_FORMAT_VERSION)!.major;

function root(id: string, title: string, index: number) {
  return { id, parentId: "0", title, index, syncing: false } as const;
}
function seedRoots() {
  mock.addNode(root("1", "Bookmarks Bar", 0));
  mock.addNode(root("2", "Other Bookmarks", 1));
  mock.addNode(root("3", "Mobile Bookmarks", 2));
}

function backupFileJson(version = EXPORT_FORMAT_VERSION): string {
  return JSON.stringify({
    version,
    roots: {
      "1": {
        children: [
          {
            type: "bookmark",
            title: "Restored",
            url: "https://restored.example",
            position: null,
            settings: { labelDisplay: "under-icon", hasCustomIcon: false },
            icon: null,
          },
        ],
      },
    },
    general: {
      sidebarWidth: 240,
      generalSettings: { background: { kind: "none" } },
      canvasBackgroundIcon: null,
      defaultFolderIcon: null,
    },
  });
}

/** A valid file whose single bookmark has an unsafe url, so import skips it. */
function fileWithSkipJson(): string {
  return JSON.stringify({
    version: EXPORT_FORMAT_VERSION,
    roots: {
      "1": {
        title: "Bookmarks Bar",
        children: [
          {
            type: "bookmark",
            title: "Evil",
            url: "javascript:alert(1)",
            position: null,
            settings: { labelDisplay: "under-icon", hasCustomIcon: false },
            icon: null,
          },
        ],
      },
    },
    general: {
      sidebarWidth: 240,
      generalSettings: { background: { kind: "none" } },
      canvasBackgroundIcon: null,
      defaultFolderIcon: null,
    },
  });
}

function jsonFile(text: string, name = "backup.json"): File {
  return new File([text], name, { type: "application/json" });
}

function renderWindow() {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <GeneralSettingsWindow
      background={{ kind: "none" }}
      savedBackgroundUrl={undefined}
      onSaved={onSaved}
      onClose={onClose}
    />,
  );
  return { onClose, onSaved };
}

let reloadSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mock.reset();
  vi.clearAllMocks();
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({ close: () => {} })),
  );
  // downloadJson uses these; stub them side-effect-free without replacing the
  // URL constructor (isSafeNavigationUrl relies on `new URL()`).
  URL.createObjectURL = vi.fn(() => "blob:stub");
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  // A successful import reloads the page; stub the whole location object so the
  // test can assert reload (location.reload itself is non-configurable in jsdom).
  reloadSpy = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, reload: reloadSpy },
  });
});

describe("GeneralSettingsWindow — footer Export/Import", () => {
  it("shows Export and Import (left group) alongside Save", () => {
    renderWindow();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("Export downloads a file and closes the window", async () => {
    seedRoots();
    const user = userEvent.setup();
    const { onClose } = renderWindow();

    await user.click(screen.getByRole("button", { name: "Export" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("a valid import shows the Yes/No/Cancel confirmation, then No imports and reloads", async () => {
    seedRoots();
    const user = userEvent.setup();
    renderWindow();

    await user.upload(
      screen.getByLabelText("Import backup file"),
      jsonFile(backupFileJson()),
    );

    // Custom confirmation appears with all three choices.
    const confirm = await screen.findByRole("alertdialog", {
      name: "Import Bookmarks",
    });
    expect(confirm).toHaveTextContent(/replace/i);
    expect(
      within(confirm).getByRole("button", { name: "Yes" }),
    ).toBeInTheDocument();
    expect(
      within(confirm).getByRole("button", { name: "No" }),
    ).toBeInTheDocument();
    expect(
      within(confirm).getByRole("button", { name: "Cancel" }),
    ).toBeInTheDocument();

    await user.click(within(confirm).getByRole("button", { name: "No" }));

    await waitFor(() => expect(reloadSpy).toHaveBeenCalled());
    const restored = await getBookmarksInFolder("1");
    expect(restored.map((b) => b.title)).toEqual(["Restored"]);
  });

  it("renders only the confirmation while it is open (sized to content, not the settings panel)", async () => {
    seedRoots();
    const user = userEvent.setup();
    renderWindow();

    await user.upload(
      screen.getByLabelText("Import backup file"),
      jsonFile(backupFileJson()),
    );
    const confirm = await screen.findByRole("alertdialog", {
      name: "Import Bookmarks",
    });
    // The window is titled "Import Bookmarks".
    expect(within(confirm).getByText("Import Bookmarks")).toBeInTheDocument();

    // The settings body/footer are not rendered behind the confirmation.
    expect(screen.queryByText("Background")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Export" }),
    ).not.toBeInTheDocument();
  });

  it("an import with skipped entries shows a summary and reloads only after acknowledge", async () => {
    seedRoots();
    const user = userEvent.setup();
    renderWindow();

    await user.upload(
      screen.getByLabelText("Import backup file"),
      jsonFile(fileWithSkipJson()),
    );
    await user.click(
      within(
        await screen.findByRole("alertdialog", { name: "Import Bookmarks" }),
      ).getByRole("button", { name: "No" }),
    );

    // Summary appears pointing at the report file; no reload yet.
    const result = await screen.findByRole("alertdialog", {
      name: "Import Bookmarks",
    });
    expect(within(result).getByText("Import Bookmarks")).toBeInTheDocument();
    expect(result).toHaveTextContent(/could not be imported/i);
    expect(result).toHaveTextContent("backup-report.json");
    expect(URL.createObjectURL).toHaveBeenCalled(); // report downloaded
    expect(reloadSpy).not.toHaveBeenCalled();

    await user.click(within(result).getByRole("button", { name: "Reload" }));
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("answering Yes backs up (exports) before importing", async () => {
    seedRoots();
    const user = userEvent.setup();
    renderWindow();

    await user.upload(
      screen.getByLabelText("Import backup file"),
      jsonFile(backupFileJson()),
    );
    const confirm = await screen.findByRole("alertdialog", {
      name: "Import Bookmarks",
    });
    await user.click(within(confirm).getByRole("button", { name: "Yes" }));

    // The backup export produced a download before the import reloaded.
    await waitFor(() => expect(reloadSpy).toHaveBeenCalled());
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it("a denied import keeps the window open, shows a message, and never confirms", async () => {
    seedRoots();
    const user = userEvent.setup();
    const { onClose } = renderWindow();

    await user.upload(
      screen.getByLabelText("Import backup file"),
      jsonFile(backupFileJson(`${currentMajor + 1}.0.0`)),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /newer version/i,
    );
    expect(
      screen.queryByRole("alertdialog", { name: "Import Bookmarks" }),
    ).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("Cancel on the confirmation aborts without changing anything", async () => {
    seedRoots();
    mock.addNode({
      id: "keep",
      parentId: "1",
      title: "Keep",
      url: "https://keep.example",
      index: 0,
      syncing: false,
    });
    const user = userEvent.setup();
    const { onClose } = renderWindow();

    await user.upload(
      screen.getByLabelText("Import backup file"),
      jsonFile(backupFileJson()),
    );
    const confirm = await screen.findByRole("alertdialog", {
      name: "Import Bookmarks",
    });
    await user.click(within(confirm).getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Import" })).toBeEnabled(),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
    expect((await getBookmarksInFolder("1")).map((b) => b.id)).toEqual([
      "keep",
    ]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import { createBookmark, createFolder } from "./create";

const mock = installChromeMock();

beforeEach(() => {
  mock.reset();
  vi.clearAllMocks();
});

describe("createFolder", () => {
  it("creates a folder with a trimmed title and returns the node", async () => {
    const result = await createFolder("1", "  Work  ");

    expect(result.ok).toBe(true);
    expect(mock.chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "1",
      title: "Work",
    });
    if (result.ok) {
      expect(result.node.title).toBe("Work");
      expect(result.node.parentId).toBe("1");
      expect(result.node.id).toBeTruthy();
    }
  });

  it("rejects an empty or whitespace-only title without calling Chrome", async () => {
    const result = await createFolder("1", "   ");

    expect(result).toEqual({ ok: false, error: "empty-title" });
    expect(mock.chrome.bookmarks.create).not.toHaveBeenCalled();
  });

  it("places the folder at a given index (first child) when index is provided", async () => {
    const result = await createFolder("1", "First", 0);

    expect(result.ok).toBe(true);
    expect(mock.chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "1",
      title: "First",
      index: 0,
    });
  });

  it("omits index (appends at end) when index is not provided", async () => {
    await createFolder("1", "Last");

    expect(mock.chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "1",
      title: "Last",
    });
    const call = mock.chrome.bookmarks.create.mock.calls[0]?.[0];
    expect(call).not.toHaveProperty("index");
  });
});

describe("createBookmark", () => {
  it("creates a bookmark with a trimmed title and safe url, returning the node", async () => {
    const result = await createBookmark(
      "1",
      "  Example  ",
      "https://example.com/",
    );

    expect(result.ok).toBe(true);
    expect(mock.chrome.bookmarks.create).toHaveBeenCalledWith({
      parentId: "1",
      title: "Example",
      url: "https://example.com/",
    });
    if (result.ok) {
      expect(result.node.url).toBe("https://example.com/");
      expect(result.node.title).toBe("Example");
    }
  });

  it("rejects an empty or whitespace-only title without calling Chrome", async () => {
    const result = await createBookmark("1", "   ", "https://example.com");

    expect(result).toEqual({ ok: false, error: "empty-title" });
    expect(mock.chrome.bookmarks.create).not.toHaveBeenCalled();
  });

  it("rejects a url whose scheme is not on the safe allowlist", async () => {
    const result = await createBookmark("1", "Danger", "javascript:alert(1)");

    expect(result).toEqual({ ok: false, error: "unsafe-url" });
    expect(mock.chrome.bookmarks.create).not.toHaveBeenCalled();
  });
});

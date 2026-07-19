import { beforeEach, describe, expect, it, vi } from "vitest";
import { installChromeMock } from "../../test/chromeMock";
import {
  registerBookmarkListeners,
  subscribeToBookmarkChanges,
} from "../bookmarks/events";
import { getFolderPositions } from "../storage/positions";
import { acquireTransferLock, releaseTransferLock } from "./lock";

const mock = installChromeMock();

beforeEach(() => {
  mock.reset();
  vi.clearAllMocks();
});

/** Flushes the mutex/async queue the background listeners run their writes on. */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("transfer lock — background listeners", () => {
  it("suppresses onCreated auto-placement while locked and resumes after", async () => {
    registerBookmarkListeners();

    await acquireTransferLock();
    // A create fired while locked must NOT get an auto-placed position.
    await chrome.bookmarks.create({
      parentId: "1",
      title: "Locked",
      url: "https://x",
    });
    await flush();
    expect(await getFolderPositions("1")).toEqual({});

    await releaseTransferLock();
    // After release, normal auto-placement is back.
    const node = await chrome.bookmarks.create({
      parentId: "1",
      title: "Unlocked",
      url: "https://y",
    });
    await flush();
    expect(await getFolderPositions("1")).toHaveProperty(node.id);
  });

  it("awaits the background ack before returning from acquire", async () => {
    registerBookmarkListeners();
    await acquireTransferLock();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "transfer:setLock",
      locked: true,
    });
    await releaseTransferLock();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "transfer:setLock",
      locked: false,
    });
  });
});

describe("transfer lock — newtab subscribers", () => {
  it("suspends live refetch callbacks while locked and resyncs once on release", async () => {
    const callback = vi.fn();
    subscribeToBookmarkChanges(callback);

    await acquireTransferLock();
    mock.chrome.bookmarks.onCreated.emit("gen-x", {
      id: "gen-x",
      parentId: "1",
      title: "Q",
      url: "https://q",
      syncing: false,
    });
    expect(callback).not.toHaveBeenCalled();

    await releaseTransferLock();
    // forceBookmarkResync fires each raw subscriber exactly once on release.
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("transfer lock — idempotent release", () => {
  it("release without a prior acquire resumes subscribers without throwing", async () => {
    const callback = vi.fn();
    subscribeToBookmarkChanges(callback);

    await expect(releaseTransferLock()).resolves.toBeUndefined();

    // Subscribers are active (not left suspended by a stray release).
    mock.chrome.bookmarks.onCreated.emit("gen-z", {
      id: "gen-z",
      parentId: "1",
      title: "Z",
      url: "https://z",
      syncing: false,
    });
    expect(callback).toHaveBeenCalled();
  });
});

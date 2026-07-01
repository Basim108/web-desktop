import { describe, expect, it } from "vitest";
import { resolveDrop } from "./dragDrop";
import type { LayoutCell } from "./layout";

const page: LayoutCell[] = [
  { bookmarkId: "a", cell: { page: 0, row: 0, col: 0 } },
  { bookmarkId: "b", cell: { page: 0, row: 0, col: 1 } },
];

describe("resolveDrop", () => {
  it("relocates the dragged item when the target cell is empty", () => {
    const updates = resolveDrop("a", { page: 0, row: 1, col: 0 }, page);
    expect(updates).toEqual([
      { bookmarkId: "a", cell: { page: 0, row: 1, col: 0 } },
    ]);
  });

  it("swaps the dragged item with whatever occupies the target cell", () => {
    const updates = resolveDrop("a", { page: 0, row: 0, col: 1 }, page);
    expect(updates).toEqual([
      { bookmarkId: "a", cell: { page: 0, row: 0, col: 1 } },
      { bookmarkId: "b", cell: { page: 0, row: 0, col: 0 } },
    ]);
  });

  it("is a no-op-equivalent single update when dropped on its own cell", () => {
    const updates = resolveDrop("a", { page: 0, row: 0, col: 0 }, page);
    expect(updates).toEqual([
      { bookmarkId: "a", cell: { page: 0, row: 0, col: 0 } },
    ]);
  });

  it("returns no updates if the dragged id isn't in the displayed page", () => {
    const updates = resolveDrop("missing", { page: 0, row: 0, col: 0 }, page);
    expect(updates).toEqual([]);
  });
});

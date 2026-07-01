import type { LayoutCell } from "./layout";
import type { GridCell } from "./types";

export interface PositionUpdate {
  bookmarkId: string;
  cell: GridCell;
}

/**
 * Resolves what stored-position updates should result from dropping
 * `activeId` onto `targetCell` within the currently displayed page. A
 * drag is always authoritative — it overwrites stored position
 * unconditionally, regardless of whether the dragged or displaced item
 * was previously "pinned" or shrink-compacted (see lib/grid/layout.ts).
 * Dropping onto an empty cell just relocates the dragged item; dropping
 * onto an occupied cell swaps the two.
 */
export function resolveDrop(
  activeId: string,
  targetCell: GridCell,
  displayedPage: LayoutCell[],
): PositionUpdate[] {
  const activeEntry = displayedPage.find((e) => e.bookmarkId === activeId);
  if (!activeEntry) {
    return [];
  }

  const occupant = displayedPage.find(
    (e) =>
      e.bookmarkId !== activeId &&
      e.cell.page === targetCell.page &&
      e.cell.row === targetCell.row &&
      e.cell.col === targetCell.col,
  );

  if (!occupant) {
    return [{ bookmarkId: activeId, cell: targetCell }];
  }

  return [
    { bookmarkId: activeId, cell: targetCell },
    { bookmarkId: occupant.bookmarkId, cell: activeEntry.cell },
  ];
}

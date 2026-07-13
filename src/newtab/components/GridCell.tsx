import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

interface GridCellProps {
  cellKey: string;
  size: number;
  /** Whether this cell holds a bookmark — gates the plain-hover highlight/cursor, which shouldn't apply to empty cells. */
  occupied: boolean;
  children?: ReactNode;
}

export function GridCell({ cellKey, size, occupied, children }: GridCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: cellKey,
    data: { type: "cell" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`grid-cell${occupied ? " grid-cell--occupied" : ""}${isOver ? " grid-cell--over" : ""}`}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

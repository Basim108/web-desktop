import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { ReactNode } from "react";

/**
 * Mirrors App's production sensor config (distance-based activation, so a
 * plain click isn't swallowed as a drag) for components that rely on
 * useDndMonitor/useDraggable/useDroppable outside of the real App tree.
 */
export function DndTestProvider({ children }: { children: ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  return <DndContext sensors={sensors}>{children}</DndContext>;
}

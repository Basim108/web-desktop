import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { Canvas } from "./components/Canvas";
import { Sidebar } from "./components/Sidebar";
import { useSubfolders } from "./hooks/useSubfolders";
import { moveNodeToFolder } from "../lib/bookmarks/move";
import { resolveCrossFolderDrop } from "../lib/bookmarks/dragResolve";

/** Chrome's bookmark tree root id — parent of the top-level folders (Bookmarks Bar, Other Bookmarks, etc.). */
const ROOT_FOLDER_ID = "0";

export function App() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Cross-folder drag (bookmark -> sidebar folder, folder -> sidebar folder)
  // is resolved here since it's the one ancestor shared by both the sidebar
  // and the canvas. Within-canvas cell drops are resolved locally by Canvas
  // itself via useDndMonitor.
  function handleDragEnd(event: DragEndEvent) {
    const action = resolveCrossFolderDrop(
      String(event.active.id),
      event.active.data.current as
        | { type?: string; sourceFolderId?: string; sourceParentId?: string }
        | undefined,
      event.over?.data.current as
        { type?: string; folderId?: string } | undefined,
    );
    if (!action) return;
    const nodeId =
      action.kind === "move-bookmark" ? action.bookmarkId : action.folderId;
    void moveNodeToFolder(nodeId, action.destFolderId);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <AppContent />
    </DndContext>
  );
}

function AppContent() {
  const { folders: rootFolders, loading } = useSubfolders(ROOT_FOLDER_ID);
  // Tracks only an explicit user override; absent an override, the first
  // root folder is selected. Computed during render rather than synced via
  // an effect, since it's fully derivable from props/state each render.
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined,
  );
  const activeFolderId = selectedFolderId ?? rootFolders[0]?.id;

  return (
    <div className="app">
      <Sidebar
        rootFolders={rootFolders}
        loading={loading}
        activeFolderId={activeFolderId}
        onSelectFolder={setSelectedFolderId}
      />
      {activeFolderId ? (
        <Canvas folderId={activeFolderId} />
      ) : (
        <p className="canvas-empty">No bookmark folders found.</p>
      )}
    </div>
  );
}

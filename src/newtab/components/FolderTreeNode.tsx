import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useSubfolders } from "../hooks/useSubfolders";
import { useFolderSettings } from "../hooks/useFolderSettings";
import { resolveFolderDisplay } from "../../lib/storage/folderSettings";
import { CustomIconImage } from "./CustomIconImage";
import { FolderSettingsWindow } from "./FolderSettingsWindow";

interface FolderTreeNodeProps {
  folder: chrome.bookmarks.BookmarkTreeNode;
  activeFolderId: string | undefined;
  onSelectFolder: (folderId: string) => void;
  depth: number;
  /** Id of the folder whose settings window is currently open across the whole sidebar, or undefined if none is. */
  openSettingsFolderId: string | undefined;
  /** Opens this folder's settings window (pass its id) or closes whichever one is open (pass undefined). Lifted to Sidebar so only one window is ever open at a time. */
  onOpenSettings: (folderId: string | undefined) => void;
}

export function FolderTreeNode({
  folder,
  activeFolderId,
  onSelectFolder,
  depth,
  openSettingsFolderId,
  onOpenSettings,
}: FolderTreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const settingsOpen = openSettingsFolderId === folder.id;
  const { folders: subfolders } = useSubfolders(folder.id);
  const { settings, reload, version } = useFolderSettings(folder.id);

  // A folder row is both a drag source (moving it to another folder) and a
  // drop target (accepting a dragged bookmark or another dragged folder) —
  // the same node uses both hooks, combining their refs below.
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: folder.id,
    data: {
      type: "folder",
      folderId: folder.id,
      sourceParentId: folder.parentId,
    },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: folder.id,
    data: { type: "folder", folderId: folder.id },
  });
  function setFolderRowRef(node: HTMLButtonElement | null) {
    setDragRef(node);
    setDropRef(node);
  }

  const display = resolveFolderDisplay(settings);
  const isActive = activeFolderId === folder.id;
  const hasChildren = subfolders.length > 0;

  return (
    <li>
      <div
        className={`folder-row${isActive ? " folder-row--active" : ""}${isOver ? " folder-row--over" : ""}`}
        style={{ paddingLeft: depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="folder-expand-toggle"
            aria-label={expanded ? "Collapse folder" : "Expand folder"}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className="folder-expand-spacer" />
        )}

        <button
          ref={setFolderRowRef}
          type="button"
          className={`folder-select${isDragging ? " folder-select--dragging" : ""}`}
          onClick={() => onSelectFolder(folder.id)}
          title={display === "icon-only" ? folder.title : undefined}
          style={{ transform: CSS.Translate.toString(transform) }}
          {...listeners}
          {...attributes}
        >
          {display !== "label-only" && (
            <CustomIconImage
              itemId={folder.id}
              alt={folder.title}
              version={version}
            />
          )}
          {display !== "icon-only" && (
            <span className="folder-label">{folder.title}</span>
          )}
        </button>

        <button
          type="button"
          className="folder-settings-toggle"
          aria-label="Folder display settings"
          onClick={() => onOpenSettings(settingsOpen ? undefined : folder.id)}
        >
          ⚙
        </button>

        {settingsOpen && (
          <FolderSettingsWindow
            folder={folder}
            settings={settings}
            iconVersion={version}
            onSaved={reload}
            onClose={() => onOpenSettings(undefined)}
          />
        )}
      </div>

      {expanded && hasChildren && (
        <ul className="folder-children">
          {subfolders.map((child) => (
            <FolderTreeNode
              key={child.id}
              folder={child}
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              depth={depth + 1}
              openSettingsFolderId={openSettingsFolderId}
              onOpenSettings={onOpenSettings}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

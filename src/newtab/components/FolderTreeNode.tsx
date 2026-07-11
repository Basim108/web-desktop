import { useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useSubfolders } from "../hooks/useSubfolders";
import { useFolderSettings } from "../hooks/useFolderSettings";
import {
  resolveFolderDisplay,
  setFolderHasCustomIcon,
  setFolderSidebarDisplay,
} from "../../lib/storage/folderSettings";
import type { FolderSidebarDisplay } from "../../lib/storage/schema";
import { CustomIconImage } from "./CustomIconImage";
import { FolderIconPreview } from "./FolderIconPreview";
import { IconUploadControls } from "./IconUploadControls";

interface FolderTreeNodeProps {
  folder: chrome.bookmarks.BookmarkTreeNode;
  activeFolderId: string | undefined;
  onSelectFolder: (folderId: string) => void;
  depth: number;
  /** Id of the folder whose settings popup is currently open across the whole sidebar, or undefined if none is. */
  openSettingsFolderId: string | undefined;
  /** Opens this folder's settings popup (pass its id) or closes whichever one is open (pass undefined). Lifted to Sidebar so only one popup is ever open at a time. */
  onOpenSettings: (folderId: string | undefined) => void;
}

const DISPLAY_OPTIONS: { value: FolderSidebarDisplay; label: string }[] = [
  { value: "label-only", label: "Name only" },
  { value: "icon-only", label: "Icon only" },
  { value: "icon-and-label", label: "Icon + name" },
];

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
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);
  const settingsToggleRef = useRef<HTMLButtonElement | null>(null);
  const { folders: subfolders } = useSubfolders(folder.id);
  const { settings, reload, version } = useFolderSettings(folder.id);

  useEffect(() => {
    if (!settingsOpen) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (settingsPanelRef.current?.contains(target)) return;
      if (settingsToggleRef.current?.contains(target)) return;
      onOpenSettings(undefined);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenSettings(undefined);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsOpen, onOpenSettings]);

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

  async function handleDisplayChange(next: FolderSidebarDisplay) {
    await setFolderSidebarDisplay(folder.id, next);
    reload();
  }

  async function handleIconChange(hasCustomIcon: boolean) {
    await setFolderHasCustomIcon(folder.id, hasCustomIcon);
    reload();
  }

  return (
    <li>
      <div
        className={`folder-row${isActive ? " folder-row--active" : ""}`}
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
          className={`folder-select${isOver ? " folder-select--over" : ""}${isDragging ? " folder-select--dragging" : ""}`}
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
          ref={settingsToggleRef}
          type="button"
          className="folder-settings-toggle"
          aria-label="Folder display settings"
          onClick={() => onOpenSettings(settingsOpen ? undefined : folder.id)}
        >
          ⚙
        </button>

        {settingsOpen && (
          <div
            ref={settingsPanelRef}
            className="folder-settings-panel"
            role="group"
          >
            {settings.hasCustomIcon && (
              <FolderIconPreview
                folderId={folder.id}
                alt={folder.title}
                version={version}
              />
            )}
            {DISPLAY_OPTIONS.map((option) => (
              <label key={option.value} className="folder-settings-option">
                <input
                  type="radio"
                  name={`folder-display-${folder.id}`}
                  value={option.value}
                  checked={settings.sidebarDisplay === option.value}
                  disabled={
                    !settings.hasCustomIcon && option.value !== "label-only"
                  }
                  onChange={() => void handleDisplayChange(option.value)}
                />
                {option.label}
              </label>
            ))}
            <IconUploadControls
              itemId={folder.id}
              hasCustomIcon={settings.hasCustomIcon}
              onChange={(hasCustomIcon) => void handleIconChange(hasCustomIcon)}
            />
          </div>
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

import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";

interface BookmarkIconProps {
  bookmark: chrome.bookmarks.BookmarkTreeNode;
  size: number;
  folderId: string;
}

/**
 * Placeholder visual only — real favicon/custom-icon rendering is
 * implemented in Group 7. Clicking navigates the current tab, dragging
 * repositions it within the canvas or moves it to another folder if
 * dropped on a sidebar folder row (see App's shared DndContext).
 */
export function BookmarkIcon({ bookmark, size, folderId }: BookmarkIconProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: bookmark.id,
      data: { type: "bookmark", sourceFolderId: folderId },
    });

  function handleClick() {
    if (bookmark.url) {
      window.location.assign(bookmark.url);
    }
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`bookmark-icon${isDragging ? " bookmark-icon--dragging" : ""}`}
      style={{
        width: size,
        height: size,
        transform: CSS.Translate.toString(transform),
      }}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <span className="bookmark-icon-placeholder" aria-hidden="true" />
      <span className="bookmark-icon-label">{bookmark.title}</span>
    </button>
  );
}

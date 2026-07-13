import type { GridCell } from "../grid/types";

/** Positions of a folder's direct bookmark children: bookmarkId -> cell. */
export type FolderPositions = Record<string, GridCell>;

export type FolderSidebarDisplay =
  "icon-only" | "label-only" | "icon-and-label";

/** A folder's own sidebar row settings. Independent per folder — no inheritance chain (unlike grid settings). */
export interface FolderSettings {
  sidebarDisplay: FolderSidebarDisplay;
  /** Metadata mirror of whether an IndexedDB icon record exists (Group 7), so UI can gate icon options without an async IndexedDB read. */
  hasCustomIcon: boolean;
}

export type BookmarkLabelDisplay = "under-icon" | "tooltip";

/** A bookmark's own display settings. Independent per bookmark — no inheritance (same shape of rule as FolderSettings). */
export interface BookmarkSettings {
  labelDisplay: BookmarkLabelDisplay;
  /** Metadata mirror of whether an IndexedDB icon record exists (Group 7), so UI can render/gate without an async IndexedDB read. */
  hasCustomIcon: boolean;
}

/**
 * Full chrome.storage.local shape. Only `positions` and `folderSettings`
 * are implemented so far; the remaining key is reserved so later groups
 * (label settings) share one documented schema instead of ad-hoc keys.
 */
export interface StorageSchema {
  /** folderId -> (bookmarkId -> cell) */
  positions: Record<string, FolderPositions>;
  /** bookmarkId -> label display + custom-icon metadata mirror */
  bookmarkSettings: Record<string, BookmarkSettings>;
  /** folderId -> sidebar display settings */
  folderSettings: Record<string, FolderSettings>;
  /** User-resized sidebar width in px. */
  sidebarWidth: number;
}

export const STORAGE_KEYS = {
  POSITIONS: "positions",
  BOOKMARK_SETTINGS: "bookmarkSettings",
  FOLDER_SETTINGS: "folderSettings",
  SIDEBAR_WIDTH: "sidebarWidth",
} as const satisfies Record<string, keyof StorageSchema>;

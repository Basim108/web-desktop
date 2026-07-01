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

/**
 * Full chrome.storage.local shape. Only `positions` and `folderSettings`
 * are implemented so far; the remaining keys are reserved so later groups
 * (grid/label settings) share one documented schema instead of ad-hoc keys.
 */
export interface StorageSchema {
  /** folderId -> (bookmarkId -> cell) */
  positions: Record<string, FolderPositions>;
  /** folderId -> grid layout settings (Group 4) */
  gridSettings?: Record<string, unknown>;
  /** bookmarkId -> label display + custom icon ref (Groups 7/8) */
  bookmarkSettings?: Record<string, unknown>;
  /** folderId -> sidebar display settings */
  folderSettings: Record<string, FolderSettings>;
}

export const STORAGE_KEYS = {
  POSITIONS: "positions",
  GRID_SETTINGS: "gridSettings",
  BOOKMARK_SETTINGS: "bookmarkSettings",
  FOLDER_SETTINGS: "folderSettings",
} as const satisfies Record<string, keyof StorageSchema>;

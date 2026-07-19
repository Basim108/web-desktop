import type { GridCell } from "../grid/types";
import type {
  BookmarkSettings,
  FolderSettings,
  GeneralSettings,
} from "../storage/schema";

/**
 * The extension-state export/import file format. Everything is embedded inline
 * in the bookmark tree, keyed by structural position rather than Chrome bookmark
 * id, so it can be restored after a replace-import reassigns every id. Custom
 * icons and the two global images are inlined as base64 image data URLs to keep
 * the file self-contained.
 */
export interface ExportFileV1 {
  /** Format version in `x.y.z` form (see version.ts). */
  version: string;
  /** Top-level nodes grouped by the well-known protected-root ids. */
  roots: Partial<Record<ProtectedRootId, ExportRoot>>;
  general: ExportGeneral;
}

/** The protected Chrome bookmark roots. These ids are stable across profiles. */
export type ProtectedRootId = "1" | "2" | "3";

export interface ExportRoot {
  /** The root's display title as read from the live bookmark tree (e.g. "Bookmarks bar"). */
  title: string;
  children: ExportNode[];
}

export type ExportNode = ExportFolderNode | ExportBookmarkNode;

export interface ExportFolderNode {
  type: "folder";
  title: string;
  settings: FolderSettings;
  /** base64 image data URL, or null when the folder has no custom icon. */
  icon: string | null;
  children: ExportNode[];
}

export interface ExportBookmarkNode {
  type: "bookmark";
  title: string;
  url: string;
  /** Grid cell within its folder, or null when unpositioned. */
  position: GridCell | null;
  settings: BookmarkSettings;
  /** base64 image data URL, or null when the bookmark has no custom icon. */
  icon: string | null;
}

/** Global, non-id-keyed state. */
export interface ExportGeneral {
  sidebarWidth: number;
  generalSettings: GeneralSettings;
  /** Canvas background image as a base64 data URL, or null when unset. */
  canvasBackgroundIcon: string | null;
  /** Default folder icon image as a base64 data URL, or null when unset. */
  defaultFolderIcon: string | null;
}

/** Why an entry was skipped during import. */
export type SkipReason =
  "empty-title" | "unsafe-url" | "parent-skipped" | "root-unavailable";

/** One row of the downloadable import report. */
export interface SkippedEntryRecord {
  /** Slash-joined folder path from the root display name down to the entry's parent. */
  absoluteFolderPath: string;
  name: string;
  url: string | null;
  reason: SkipReason;
}

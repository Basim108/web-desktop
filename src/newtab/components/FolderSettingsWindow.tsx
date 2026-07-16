import { useEffect, useId, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { removeFolder, updateFolderTitle } from "../../lib/bookmarks/edit";
import { ICON_ERROR_MESSAGES } from "../../lib/icons/errorMessages";
import { validateIconFile } from "../../lib/icons/validation";
import {
  setFolderHasCustomIcon,
  setFolderSidebarDisplay,
} from "../../lib/storage/folderSettings";
import { deleteIcon, putIcon } from "../../lib/storage/iconDb";
import type {
  FolderSettings,
  FolderSidebarDisplay,
} from "../../lib/storage/schema";
import { CustomIconImage } from "./CustomIconImage";

interface FolderSettingsWindowProps {
  folder: chrome.bookmarks.BookmarkTreeNode;
  settings: FolderSettings;
  /** Bumped by the caller's settings hook; forwarded to CustomIconImage so the current icon refetches. */
  iconVersion: number;
  /** Called after a successful Save so the caller can refresh (e.g. reload settings/icon). */
  onSaved: () => void;
  onClose: () => void;
}

/**
 * Staged icon edit. `unchanged` keeps whatever the folder already shows;
 * `upload` holds a validated, in-memory image (previewed via an object URL,
 * not yet written to IndexedDB); `removed` clears the custom icon. Nothing is
 * persisted until Save — closing the window discards the staged state.
 */
type PendingIcon =
  | { kind: "unchanged" }
  | { kind: "upload"; file: File; previewUrl: string }
  | { kind: "removed" };

const DISPLAY_OPTIONS: { value: FolderSidebarDisplay; label: string }[] = [
  { value: "label-only", label: "Name only" },
  { value: "icon-only", label: "Icon only" },
  { value: "icon-and-label", label: "Icon + name" },
];

/**
 * Centered, opaque "Folder Settings" window (portaled to document.body) for a
 * single folder: icon, name, sidebar display mode, and removal. Styled to
 * match the Edit Bookmark window. All edits are staged and applied atomically
 * on Save; the close control, backdrop, and Escape discard them. Removal
 * deletes the real Chrome folder (and its subtree) after a confirmation step
 * and relies on the events.ts onRemoved cascade for cleanup.
 */
export function FolderSettingsWindow({
  folder,
  settings,
  iconVersion,
  onSaved,
  onClose,
}: FolderSettingsWindowProps) {
  const titleId = useId();
  const nameId = useId();
  const displayGroupName = useId();

  const [name, setName] = useState(folder.title);
  const [sidebarDisplay, setSidebarDisplay] = useState<FolderSidebarDisplay>(
    settings.sidebarDisplay,
  );
  const [pendingIcon, setPendingIcon] = useState<PendingIcon>({
    kind: "unchanged",
  });
  const [iconError, setIconError] = useState<string | undefined>(undefined);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameValid = name.trim().length > 0;
  const canSave = nameValid && !saving;
  // "Has a custom icon" for the staged state: a pending upload counts, a
  // pending removal does not, and otherwise it's whatever the folder already
  // has. The display radios and the saved display mode key off this, not the
  // persisted flag, so the icon options enable/disable before Save.
  const hasCustomIconNow =
    pendingIcon.kind === "upload" ||
    (pendingIcon.kind === "unchanged" && settings.hasCustomIcon);

  // Revoke the staged upload's object URL when it's replaced or the window
  // unmounts, so a discarded preview never leaks.
  useEffect(() => {
    if (pendingIcon.kind !== "upload") return;
    const { previewUrl } = pendingIcon;
    return () => URL.revokeObjectURL(previewUrl);
  }, [pendingIcon]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = await validateIconFile(file);
    if (!result.ok) {
      setIconError(
        result.error ? ICON_ERROR_MESSAGES[result.error] : "Upload failed.",
      );
      return;
    }
    setIconError(undefined);
    setPendingIcon({
      kind: "upload",
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  function handleRemoveImage() {
    setIconError(undefined);
    setPendingIcon({ kind: "removed" });
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);

    if (pendingIcon.kind === "upload") {
      await putIcon(folder.id, pendingIcon.file);
      await setFolderHasCustomIcon(folder.id, true);
    } else if (pendingIcon.kind === "removed") {
      await deleteIcon(folder.id);
      await setFolderHasCustomIcon(folder.id, false);
    }

    const result = await updateFolderTitle(folder.id, name);
    if (!result.ok) {
      setSaving(false);
      return;
    }

    // Clamp to label-only when there's no staged icon, so setFolderSidebarDisplay
    // (which rejects icon modes without an icon) never throws — mirrors
    // resolveFolderDisplay's semantics.
    await setFolderSidebarDisplay(
      folder.id,
      hasCustomIconNow ? sidebarDisplay : "label-only",
    );

    onSaved();
    onClose();
  }

  async function handleRemove() {
    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }
    await removeFolder(folder.id);
    onClose();
  }

  function renderPreview() {
    if (pendingIcon.kind === "upload") {
      return (
        <img
          src={pendingIcon.previewUrl}
          alt={folder.title}
          className="custom-icon"
        />
      );
    }
    if (pendingIcon.kind === "unchanged" && settings.hasCustomIcon) {
      return (
        <CustomIconImage
          itemId={folder.id}
          alt={folder.title}
          version={iconVersion}
        />
      );
    }
    return <span className="favicon-fallback" aria-hidden="true" />;
  }

  return createPortal(
    <div
      className="folder-settings-window-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="folder-settings-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="folder-settings-window-titlebar">
          <span id={titleId} className="folder-settings-window-title">
            Folder Settings
          </span>
          <button
            type="button"
            className="folder-settings-window-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="folder-settings-window-body">
          <div className="folder-settings-window-icon-row">
            <div className="folder-settings-window-icon-preview">
              {renderPreview()}
            </div>
            <div className="folder-settings-window-image-controls">
              <p className="folder-settings-window-hint">
                Upload a custom image for this folder.
              </p>
              <div className="folder-settings-window-image-buttons">
                <label className="folder-settings-window-upload-button">
                  Upload image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    className="folder-settings-window-upload-input"
                    onChange={(event) => void handleFileChange(event)}
                  />
                </label>
                {hasCustomIconNow && (
                  <button
                    type="button"
                    className="folder-settings-window-remove-image"
                    onClick={handleRemoveImage}
                  >
                    Remove image
                  </button>
                )}
              </div>
              {iconError && (
                <p className="folder-settings-window-image-error" role="alert">
                  {iconError}
                </p>
              )}
            </div>
          </div>

          <div className="folder-settings-window-field">
            <label
              className="folder-settings-window-field-label"
              htmlFor={nameId}
            >
              Name
            </label>
            <input
              id={nameId}
              type="text"
              className="folder-settings-window-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={name.length > 0 && !nameValid}
            />
          </div>

          <div className="folder-settings-window-field folder-settings-window-field--top">
            <span className="folder-settings-window-field-label">Display</span>
            <div className="folder-settings-window-radio-group">
              {DISPLAY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="folder-settings-window-radio"
                >
                  <input
                    type="radio"
                    name={displayGroupName}
                    value={option.value}
                    checked={sidebarDisplay === option.value}
                    disabled={
                      !hasCustomIconNow && option.value !== "label-only"
                    }
                    onChange={() => setSidebarDisplay(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          {name.length > 0 && !nameValid && (
            <p className="folder-settings-window-input-error" role="alert">
              Enter a folder name.
            </p>
          )}
        </div>

        <div className="folder-settings-window-actions">
          <button
            type="button"
            className="folder-settings-window-remove"
            onClick={() => void handleRemove()}
          >
            {confirmingRemove ? "Confirm remove" : "Remove folder"}
          </button>
          <button
            type="button"
            className="folder-settings-window-save"
            onClick={() => void handleSave()}
            disabled={!canSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { CustomIconImage } from "./CustomIconImage";

interface FolderIconPreviewProps {
  folderId: string;
  alt: string;
  version: number;
}

/** Shows the folder's uploaded custom icon inside its settings popup, sized responsively by viewport width (see .folder-settings-icon-preview in main.css). */
export function FolderIconPreview({
  folderId,
  alt,
  version,
}: FolderIconPreviewProps) {
  return (
    <div className="folder-settings-icon-preview">
      <CustomIconImage itemId={folderId} alt={alt} version={version} />
    </div>
  );
}

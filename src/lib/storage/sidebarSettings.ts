import { getStorageValue, setStorageValue } from "./local";
import { STORAGE_KEYS } from "./schema";

export const DEFAULT_SIDEBAR_WIDTH = 240;
export const MIN_SIDEBAR_WIDTH = 40;
/** Defensive outer ceiling on the stored preference — the largest viewport tier's max-width. */
export const MAX_SIDEBAR_WIDTH_CEILING = 1024;

function clamp(width: number): number {
  return Math.min(
    MAX_SIDEBAR_WIDTH_CEILING,
    Math.max(MIN_SIDEBAR_WIDTH, width),
  );
}

/** Reads the persisted sidebar width, clamped to [min, ceiling] and falling back to the default if unset. */
export async function getSidebarWidth(): Promise<number> {
  const stored = await getStorageValue(STORAGE_KEYS.SIDEBAR_WIDTH);
  if (stored === undefined) {
    return DEFAULT_SIDEBAR_WIDTH;
  }
  return clamp(stored);
}

export async function setSidebarWidth(width: number): Promise<void> {
  await setStorageValue(STORAGE_KEYS.SIDEBAR_WIDTH, clamp(width));
}

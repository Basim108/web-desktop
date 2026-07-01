import { getFolderAncestorChain } from "../bookmarks/read";
import { getStorageValue, setStorageValue } from "./local";
import { GLOBAL_DEFAULT_GRID_SETTINGS, STORAGE_KEYS } from "./schema";
import type { GridSettings } from "./schema";

async function getAllGridSettingsOverrides(): Promise<
  Record<string, GridSettings>
> {
  const settings = await getStorageValue(STORAGE_KEYS.GRID_SETTINGS);
  return settings ?? {};
}

export async function getGlobalGridSettings(): Promise<GridSettings> {
  const settings = await getStorageValue(STORAGE_KEYS.GLOBAL_GRID_SETTINGS);
  return settings ?? GLOBAL_DEFAULT_GRID_SETTINGS;
}

export async function setGlobalGridSettings(
  settings: GridSettings,
): Promise<void> {
  await setStorageValue(STORAGE_KEYS.GLOBAL_GRID_SETTINGS, settings);
}

export async function getGridSettingsOverride(
  folderId: string,
): Promise<GridSettings | undefined> {
  const all = await getAllGridSettingsOverrides();
  return all[folderId];
}

export async function setGridSettingsOverride(
  folderId: string,
  settings: GridSettings,
): Promise<void> {
  const all = await getAllGridSettingsOverrides();
  await setStorageValue(STORAGE_KEYS.GRID_SETTINGS, {
    ...all,
    [folderId]: settings,
  });
}

export async function clearGridSettingsOverride(
  folderId: string,
): Promise<void> {
  const all = await getAllGridSettingsOverrides();
  if (!(folderId in all)) {
    return;
  }
  const { [folderId]: _removed, ...rest } = all;
  await setStorageValue(STORAGE_KEYS.GRID_SETTINGS, rest);
}

/**
 * Resolves a folder's effective grid settings: its own override, else the
 * nearest ancestor's override, else the global default.
 */
export async function resolveGridSettings(
  folderId: string,
): Promise<GridSettings> {
  const [chain, allOverrides, globalSettings] = await Promise.all([
    getFolderAncestorChain(folderId),
    getAllGridSettingsOverrides(),
    getGlobalGridSettings(),
  ]);

  for (const ancestorId of chain) {
    const override = allOverrides[ancestorId];
    if (override) {
      return override;
    }
  }
  return globalSettings;
}

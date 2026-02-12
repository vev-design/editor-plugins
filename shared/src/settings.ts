import { SettingsType } from './types';

export function getSettingsPath(url: string): SettingsType {
  try {
    const settings = url.split('/').splice(-2)[0];
    const type = url.split('/').splice(-1)[0];

    if (
      settings === 'settings' &&
      (type === 'global' ||
        type === 'workspace' ||
        type === 'team' ||
        type === 'meta_fields' ||
        type === 'asset_picker')
    ) {
      return type as SettingsType;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export interface GetPropertiesOptions {
  normalizeAssetType?: boolean;
}

export async function getPropertiesFromRequest<T extends Record<string, unknown>>(
  request: Request,
  options: GetPropertiesOptions = {},
): Promise<T> {
  try {
    const properties = (await request.json()) as T;

    if (
      options.normalizeAssetType &&
      'assetType' in properties &&
      typeof properties.assetType === 'string'
    ) {
      (properties as Record<string, unknown>).assetType = properties.assetType.toLowerCase();
    }

    return properties;
  } catch (e) {
    console.log('No request body');
    return {} as T;
  }
}

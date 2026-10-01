import {
  getPropertiesFromRequest as getPropertiesFromRequestBase,
  getSettingsPath,
} from 'shared';

export { getSettingsPath };

export type RequestProperties = {
  assetType?: 'image' | 'video' | 'other';
  filter?: { field: string; value: string }[];
};

export async function getPropertiesFromRequest(request: Request): Promise<RequestProperties> {
  return getPropertiesFromRequestBase<RequestProperties>(request, { normalizeAssetType: true });
}

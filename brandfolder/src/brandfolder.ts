import { registerVevPlugin } from '@vev/react';
import { BrandfolderClient } from './client.js';
import { getMetaFields, getPropertiesFromRequest, getSettings, getSettingsPath } from './settings';
import {
  EditorPluginAssetSourceFilterFields,
  EditorPluginKv,
  EditorPluginSettings,
  EditorPluginType,
  ProjectAsset,
} from '@vev/utils';
import { mapAssetToVevAsset } from './asset-mappers';

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv,
): Promise<ProjectAsset[] | EditorPluginSettings | EditorPluginAssetSourceFilterFields> {
  const requestProperties = await getPropertiesFromRequest(request);
  const { assetType } = requestProperties;

  const settingType = getSettingsPath(request.url);

  const client = new BrandfolderClient(env.apiKey, requestProperties.brandfolder_id, kv);

  // Handle settings
  if (settingType === 'meta_fields') {
    return getMetaFields(client, [assetType]);
  } else if (settingType) {
    return getSettings(settingType, client);
  }

  if (!requestProperties.brandfolder_id) throw new Error('Brandfolder ID is required');

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get('search');

  const results = await client.searchAssets(search, requestProperties, [assetType]);

  return await Promise.all(
    results.data.map(async (item) => {
      return await mapAssetToVevAsset(item, results.attachments);
    }),
  );
}

registerVevPlugin({
  id: 'brandfolderassetsource',
  name: 'Brandfolder',
  type: EditorPluginType.ASSET_SOURCE,
  icon: 'https://cdn.bfldr.com/I6FML9WY/as/pgltaq-5fsycg-1f0c0u/brandfolder-icon.svg',
  form: [
    {
      type: 'string',
      name: 'apiKey',
      title: 'Brandfolder API Key',
    },
  ],
  handler,
});

export default handler;

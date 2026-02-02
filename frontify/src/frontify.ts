import { registerVevPlugin } from '@vev/react';
import { FrontifyAsset, FrontifyClient } from './client';
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

  if (assetType === 'video') return [];

  const settingType = getSettingsPath(request.url);

  const client = new FrontifyClient(env.domain, env.apiKey, requestProperties.brand_id);

  // Handle settings
  if (settingType === 'meta_fields') {
    return getMetaFields(client, [assetType]);
  } else if (settingType) {
    return getSettings(settingType, client);
  }

  if (!requestProperties.brand_id) throw new Error('Brand ID is required');

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get('search');

  const libraryFilter = requestProperties.filter.find((value) => {
    return value.field === 'library';
  });

  let results: FrontifyAsset[] = [];
  if (libraryFilter && libraryFilter.value) {
    results = await client.searchAssetsInLibrary(libraryFilter.value, search || '');
  } else {
    results = await client.searchAllAssets(search || '');
  }

  return await Promise.all(
    results.map(async (item) => {
      return await mapAssetToVevAsset(item);
    }),
  );
}

registerVevPlugin({
  id: 'frontifyassetsource',
  name: 'Frontify',
  type: EditorPluginType.ASSET_SOURCE,
  icon: 'https://storage.googleapis.com/cdn.vev.design/public/image%20(6).png',
  form: [
    {
      type: 'string',
      name: 'domain',
      description: 'E.g. https://my-company.frontify.com',
      title: 'Frontify domain',
    },
    {
      type: 'string',
      name: 'apiKey',
      description:
        'Go to https://{your-domain}/api/developer/token to generate a token. The basic:read scope is required.',
      title: 'Frontify API Key',
    },
  ],
  handler,
});

export default handler;

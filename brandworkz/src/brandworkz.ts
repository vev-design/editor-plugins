import { registerVevPlugin } from '@vev/react';
import { BrandworkzClient } from './client';
import { getPropertiesFromRequest, getSettingsPath } from './settings';
import {
  EditorPluginAssetSourceFilterFields,
  EditorPluginKv,
  EditorPluginSettings,
  EditorPluginType,
  ProjectAsset,
} from '@vev/utils';
import { getAssetPicker } from './get-asset-picker';

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv,
): Promise<ProjectAsset[] | EditorPluginSettings | EditorPluginAssetSourceFilterFields | Response> {
  const requestProperties = await getPropertiesFromRequest(request);
  const { assetType } = requestProperties;

  const settingType = getSettingsPath(request.url);
  const client = new BrandworkzClient(
    env.domain,
    env.consumerId,
    env.consumerSecret,
    env.username,
    env.password,
  );

  console.log('settingType', settingType);

  // Handle settings
  if (settingType === 'asset_picker') {
    const assetInsert = await client.getAssetPickerRequired();
    return getAssetPicker(assetInsert);
  } else if (settingType === 'meta_fields') {
    return [];
  } else if (settingType) {
    return [];
  }
}

registerVevPlugin({
  id: 'brandworkzassetsource',
  name: 'Brandworkz',
  type: EditorPluginType.ASSET_SOURCE,
  icon: 'https://storage.googleapis.com/devcdn.vev.design/brandworkz_62595.png',
  form: [
    {
      type: 'string',
      name: 'domain',
      description: 'E.g. https://my-company.brandworkz.com',
      title: 'Brandworkz domain',
    },
    {
      type: 'string',
      title: 'Consumer ID',
      name: 'consumerId',
    },
    {
      type: 'string',
      title: 'Consumer Secret',
      name: 'consumerSecret',
    },
    {
      type: 'string',
      title: 'Username',
      name: 'username',
    },
    {
      type: 'string',
      title: 'Password',
      name: 'password',
    },
  ],
  handler,
});

export default handler;

import { registerVevPlugin } from '@vev/react';
import { BynderClient } from './client.js';
import { BynderAPIAsset, Kv } from './types';
import { PROPERTY_PREFIX } from './constants';
import { getSettings, getSettingsPath } from './settings';

/**
 *     "property_copyright": "Syngenta Crop Protection AG",
 *     "property_subterritory": [
 *       "canada"
 *     ],
 */
async function mapAssetToVevAsset(asset: BynderAPIAsset, client: BynderClient) {
  const metaData: Record<string, string> = {};
  await Promise.all(
    Object.keys(asset).map(async (key) => {
      if (key.startsWith(PROPERTY_PREFIX)) {
        const metaProperty = await client.getMetaProperty([key]);

        if (!metaProperty) {
          console.error(`Missing metaproperty for ${key}`);
        } else {
          if (Array.isArray(asset[key])) {
            const value = metaProperty.options[asset[key][0]].label;
            if (value) metaData[metaProperty.label] = value;
          } else if (typeof asset[key] === "object") {
            const value = metaProperty.options[asset[key]].label;
            if (value) metaData[metaProperty.label] = value;
          } else {
            const value = asset[key];
            if (value) metaData[metaProperty.label] = asset[key];
          }
        }
      }
    })
  );

  return {
    key: asset.id,
    name: asset.name,
    url: asset.thumbnails.transformBaseUrl,
    thumb: asset.thumbnails.thul,
    metadata: {
      description: asset.description,
      width: asset.width,
      height: asset.height,
      link: asset.transformBaseUrl,
      ...metaData,
    },
  };
}

async function handler(request: Request, env: Record<string, string>, kv: Kv) {
  console.log("env", "\n", JSON.stringify(env, null, 4), "\n");
  const settingType = getSettingsPath(request.url);

  const client = new BynderClient(
    env.clientId,
    env.clientSecret,
    env.bynderDomain,
    kv
  );

  // Handle settings
  if (settingType) {
    return getSettings(settingType, client, ["image"]);
  }

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get("search");

  await client.syncMetaProperties(["image"]);
  const results = await client.searchAssets(search, ["image"]);

  const images = await Promise.all(
    results.map(async (result) => {
      return await mapAssetToVevAsset(result, client);
    })
  );

  return {
    images,
  };
}

registerVevPlugin({
  id: "bynderassetsource",
  name: "Bynder",
  type: "asset-source",
  icon: "https://play-lh.googleusercontent.com/7IBBtMND0mS6LNyTp1WVHCRw006eXAoV6VOgKQGWwSHSgnoBG75k_K4j_AYytURtTA=w480-h960-rw",
  form: [
    {
      type: "string",
      name: "bynderDomain",
      title: "Bynder domain",
    },
    {
      type: "string",
      name: "clientId",
      title: "Client ID",
    },
    {
      type: "string",
      name: "clientSecret",
      title: "Client Secret",
    },
  ],
  handler: handler,
});

export default handler;

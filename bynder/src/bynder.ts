import { registerVevPlugin } from "@vev/react";
import { BynderClient } from "./client.js";
import {
  getMetaFields,
  getPropertiesFromRequest,
  getSettings,
  getSettingsPath,
} from "./settings";
import {
  EditorPluginAssetSourceFilterFields,
  EditorPluginKv,
  EditorPluginSettings,
  EditorPluginType,
  ProjectAsset,
} from "@vev/utils";
import { mapAssetToVevAsset } from "./asset-mappers";

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv
): Promise<
  ProjectAsset[] | EditorPluginSettings | EditorPluginAssetSourceFilterFields
> {
  const requestProperties = await getPropertiesFromRequest(request);
  const assetType = requestProperties.assetType;

  const settingType = getSettingsPath(request.url);

  const client = new BynderClient(
    env.clientId,
    env.clientSecret,
    env.bynderDomain,
    kv
  );

  // Handle settings
  if (settingType === "meta_fields") {
    return getMetaFields(client, [assetType]);
  } else if (settingType) {
    return getSettings(settingType, client, [assetType]);
  }

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get("search");

  await client.syncMetaProperties(["image"]);
  const results = await client.searchAssets(search, requestProperties, [
    assetType,
  ]);

  return await Promise.all(
    results.map(async (result) => {
      return await mapAssetToVevAsset(result, client);
    })
  );
}

registerVevPlugin({
  id: "bynderassetsource",
  name: "Bynder",
  type: EditorPluginType.ASSET_SOURCE,
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

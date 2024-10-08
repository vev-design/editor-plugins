import { registerVevPlugin } from "@vev/react";
import { EditorPluginKv, EditorPluginType } from "@vev/utils";
import { Client } from "./client";
import {
  BaseProjectAsset,
  ProjectAsset,
  ProjectImageAsset,
  ProjectVideoAsset,
} from "./vev-types";
import { Resource } from "./types";
import { getPropertiesFromRequest, getSettings, getPath } from "./settings";
import { getMetaFields, MetaFields } from "./metaFields";
import { createThumbnail } from "./transforms";

function getMimeType(resource: Resource): string {
  if (resource.resource_type !== "raw") {
    return `${resource.resource_type}/${resource.format}`;
  } else {
    return `application/${resource.format}`;
  }
}

function mapAssetToVevAsset(
  resources: Resource[] = [],
  selfHostAssets?: boolean
): ProjectAsset[] {
  return resources.map((resource) => {
    switch (resource.resource_type) {
      case "image":
        return {
          key: resource.asset_id,
          url: resource.secure_url,
          filename: resource.filename,
          mimeType: getMimeType(resource),
          dimension: { width: resource.width, height: resource.height },
          selfHosted: !!selfHostAssets,
          thumb: createThumbnail(resource.secure_url, 'IMAGE'),
        } as ProjectImageAsset;
      case "video":
        return {
          key: resource.asset_id,
          url: resource.secure_url,
          filename: resource.filename,
          mimeType: getMimeType(resource),
          duration: resource.duration,
          dimension: { width: resource.width, height: resource.height },
          videoSample: createThumbnail(resource.secure_url, 'VIDEO'),
          videoThumbnail: createThumbnail(resource.secure_url, 'VIDEO_THUMB'),
          selfHosted: !!selfHostAssets,
        } as ProjectVideoAsset;
      case "raw":
        return {
          key: resource.asset_id,
          url: resource.secure_url,
          filename: resource.filename,
          mimeType: getMimeType(resource),
          selfHosted: !!selfHostAssets,
        } as BaseProjectAsset;
    }
  });
}

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv
): Promise<ProjectAsset[] | MetaFields> {
  const requestProperties = await getPropertiesFromRequest(request);
  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get("search");

  const settingType = getPath(request.url);
  const client = new Client(env.CLOUD_NAME, env.KEY, env.SECRET);

  // Handle settings and meta fields
  if (settingType === "meta_fields") {
    return getMetaFields(client);
  } else if (settingType) {
    return getSettings(settingType);
  }

  const response = await client.searchAssets(
    search,
    requestProperties.assetType,
    requestProperties.filter,
  );
  return mapAssetToVevAsset(
    response.resources,
    requestProperties.selfHostAssets
  );
}

registerVevPlugin({
  id: "cloudinaryassetsource",
  name: "Cloudinary",
  type: EditorPluginType.ASSET_SOURCE,
  icon: "https://www.svgrepo.com/show/353566/cloudinary.svg",
  form: [
    {
      type: "string",
      name: "CLOUD_NAME",
      title: "Cloud name",
    },
    {
      type: "string",
      name: "KEY",
      title: "API key",
    },
    {
      type: "string",
      name: "SECRET",
      title: "API secret",
    },
  ],
  handler: handler,
});

export default handler;

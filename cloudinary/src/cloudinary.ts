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

function getMimeType(resource: Resource): string {
  if (resource.resource_type !== "raw") {
    return `${resource.resource_type}/${resource.format}`;
  } else {
    return `application/${resource.format}`;
  }
}

function mapAssetToVevAsset(resources: Resource[]): ProjectAsset[] {
  return resources.map((resource) => {
    switch (resource.resource_type) {
      case "image":
        return {
          id: resource.asset_id,
          url: resource.url,
          filename: resource.filename,
          mimeType: getMimeType(resource),
          dimension: { width: resource.width, height: resource.height },
        } as ProjectImageAsset;
      case "video":
        return {
          id: resource.asset_id,
          url: resource.url,
          filename: resource.filename,
          mimeType: getMimeType(resource),
          duration: resource.duration,
          dimension: { width: resource.width, height: resource.height },
        } as ProjectVideoAsset;
      case "raw":
        return {
          id: resource.asset_id,
          url: resource.url,
          filename: resource.filename,
          mimeType: getMimeType(resource),
        } as BaseProjectAsset;
    }
  });
}

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv
): Promise<ProjectAsset[]> {
  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get("search");

  const client = new Client(env.CLOUD_NAME, env.KEY, env.SECRET);
  const response = await client.searchAssets(search);
  console.log("response", "\n", JSON.stringify(response, null, 4), "\n");
  return mapAssetToVevAsset(response.resources);
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

import { registerVevPlugin } from "@vev/react";
import {
  EditorPluginKv,
  EditorPluginType,
  ProjectAsset,
  ProjectImageAsset,
} from "@vev/utils";

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv
): Promise<ProjectAsset[]> {
  const image: ProjectImageAsset = {
    mimeType: "image/jpeg",
    updated: 0,
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3f/JPEG_example_flower.jpg",
    key: "image-1",
  };

  return [image];
}

registerVevPlugin({
  name: "Asset Source Template",
  type: EditorPluginType.ASSET_SOURCE,
  form: [],
  handler: handler,
});

export default handler;

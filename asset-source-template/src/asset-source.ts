import { registerVevPlugin } from "@vev/react";
import { EditorPluginKv, EditorPluginType, ProjectAsset } from "@vev/utils";

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv
): Promise<ProjectAsset[]> {
  const results: ProjectAsset[] = [];
  return results;
}

registerVevPlugin({
  name: "Asset Source Template",
  type: EditorPluginType.ASSET_SOURCE,
  form: [
    {
      type: "string",
      name: "API_KEY",
      title: "API Key",
    },
  ],
  handler: handler,
});

export default handler;

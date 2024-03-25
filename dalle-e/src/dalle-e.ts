import { registerVevPlugin } from "@vev/react";
import { EditorPluginKv, EditorPluginType } from "@vev/utils";
import { ProjectAsset, ProjectImageAsset } from "./vev-types";
import { getPath, getPropertiesFromRequest } from "./settings";

const API = "https://api.openai.com/v1/images/generations";

interface Image {
  url: string;
  revised_prompt: string;
}

function mapAssetToVevAsset(
  photos: Image[] = [],
  search: string
): ProjectAsset[] {
  return photos.map((photo) => {
    return {
      key: `${Date.now()}`,
      url: photo.url,
      filename: `AI | ${search}`,
      mimeType: "image/png",
      dimension: { width: 1024, height: 1024 },
      selfHosted: false,
      thumb: photo.url,
      metaData: {
        description: photo.revised_prompt,
      }
    } as ProjectImageAsset;
  });
}

export type MetaFields = Record<string, string[]>;

async function handler(
  request: Request,
  env: Record<string, string>,
  kv: EditorPluginKv
): Promise<ProjectAsset[] | MetaFields> {
  const requestProperties = await getPropertiesFromRequest(request);
  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get("search");

  if (!search || search.length < 2) {
    return [];
  }

  const settingType = getPath(request.url);

  // Handle settings and meta fields
  if (settingType === "meta_fields") {
    return {};
  } else if (settingType) {
    return {};
  }

  if (requestProperties.filter) {
    return [];
  }
  console.log('env.API_KEY', env.API_KEY);
  const response = await fetch(API, {
    body: JSON.stringify({
      prompt: search,
      n: 1,
      size: "1024x1024",
      response_format: "url",
      model: "dall-e-3",
      style: env.STYLE || "natural",
    }),
    headers: {
      Authorization: `Bearer ${env.API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  console.log('response', response);

  const json = (await response.json()).data as Image[];
  console.log('json2', json);

  return mapAssetToVevAsset(json, search);
}

registerVevPlugin({
  id: "dalleassetsource",
  name: "AI Images",
  type: EditorPluginType.ASSET_SOURCE,
  icon: "https://www.svgrepo.com/show/306500/openai.svg",
  form: [
    {
      type: "string",
      name: "API_KEY",
      title: "API Key",
    },
    {
      title: "Style",
      name: "STYLE",
      type: "select",
      options: {
        display: "radio",
        items: [
          { label: "Vivid", value: "vivid" },
          { label: "Natural", value: "natural" },
        ],
      },
    },
  ],
  handler: handler,
});

export default handler;

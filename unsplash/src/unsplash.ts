import { registerVevPlugin } from "@vev/react";
import {
  EditorPluginKv,
  EditorPluginType,
  ProjectAsset,
  ProjectImageAsset,
} from "@vev/utils";
import { getPath, getPropertiesFromRequest } from "./settings";

const API = "https://api.unsplash.com/";

interface Photo {
  id: string;
  urls: { full: string; small: string };
  user: { first_name: string; last_name: string };
  links: { html: string };
  width: number;
  height: number;
  description: string;
}

function mapAssetToVevAsset(photos: Photo[] = []): ProjectAsset[] {
  return photos.map((photo) => {
    return {
      key: photo.id,
      url: photo.urls.full,
      filename: `Unsplash | ${photo.user.first_name} ${
        photo.user.last_name || ""
      }`,
      mimeType: "image/jpg",
      dimension: { width: photo.width, height: photo.height },
      selfHosted: false,
      thumb: photo.urls.small,
      metaData: {
        description: photo.description,
        width: `${photo.width}`,
        height: `${photo.height}`,
        user: `${photo.user.first_name} ${photo.user.last_name}`,
        link: photo.links.html,
      },
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

  const response = await fetch(
    `${API}/search/photos?query=${search}&content_filter=high&per_page=20`,
    {
      headers: {
        "Accept-Version": "v1",
        Authorization: `Client-ID ${env.API_KEY}`,
      },
    }
  );

  const json = (await response.json()).results as Photo[];
  return mapAssetToVevAsset(json);
}

registerVevPlugin({
  id: "unsplashassetsource",
  name: "Unsplash",
  type: EditorPluginType.ASSET_SOURCE,
  icon: "https://logowik.com/content/uploads/images/unsplash8609.jpg",
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

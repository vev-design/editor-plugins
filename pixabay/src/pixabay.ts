import { registerVevPlugin } from "@vev/react";
import { EditorPluginKv, EditorPluginType } from "@vev/utils";
import { ProjectAsset, ProjectImageAsset } from "./vev-types";
import { getPath, getPropertiesFromRequest } from "./settings";

const API = "https://pixabay.com/api";

interface Photo {
  id: string;
  webformatURL: string;
  imageURL: string;
  pageURL: string;
  imageWidth: number;
  imageHeight: number;
  description: string;
  user: string;
}


function mapAssetToVevAsset(photo: Photo): ProjectImageAsset {
  const url = photo.pageURL.split('/');

  return {
    key: url[url.length - 2],
    url: photo.imageURL,
    filename: `Pixabay | ${photo.user}`,
    mimeType: "image/jpg",
    dimension: { width: photo.imageWidth, height: photo.imageHeight },
    thumb: photo.webformatURL,
    metaData: {
      description: photo.description,
      width: `${photo.imageWidth}`,
      height: `${photo.imageHeight}`,
      user: `@${photo.user}`,
    },
    selfHosted: false,
  };
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


  const params = new URLSearchParams();
  params.set('key', env.API_KEY);
  params.set('safesearch', 'true');
  params.set('per_page', '15');

  if(search && search !== '') {
    params.set('q', encodeURIComponent(search));
  }

  const fetchuUrl = `${API}?${params.toString()}`;


  const response = await fetch(
    fetchuUrl,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  console.log('response', response);

  const json = (await response.json()).hits as Photo[];
  return json.map(mapAssetToVevAsset);
}

registerVevPlugin({
  id: "pixabayassetsource",
  name: "Pixabay",
  type: EditorPluginType.ASSET_SOURCE,
  icon: "https://upload.wikimedia.org/wikipedia/commons/7/72/Pixabay-logo-new.svg",
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

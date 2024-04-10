import { registerVevPlugin } from "@vev/react";
import { EditorPluginKv, EditorPluginType, ProjectAsset, ProjectImageAsset, ProjectVideoAsset } from "@vev/utils";
import { getPath, getPropertiesFromRequest } from "./settings";

const API_IMAGE = "https://pixabay.com/api";
const API_VIDEO = "https://pixabay.com/api/videos/";

interface Photo {
  id: string;
  pageURL: string;
  webformatURL: string;
  imageURL: string;
  imageWidth: number;
  imageHeight: number;
  description: string;
  user: string;
}

interface VideoType {
  url: string;
  width: number;
  height: number;
  thumbnail: string;
}
interface Video {
  id: string;
  pageURL: string;
  videos: {
    medium: VideoType;
    small: VideoType;
    tiny: VideoType;
  };
  user: string;
}

function mapImageAssetToVevAsset(photo: Photo): ProjectImageAsset {
  const url = photo.pageURL.split("/");

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

function mapVideoAssetToVevAsset(video: Video): ProjectVideoAsset {
  const url = video.pageURL.split("/");

  return {
    key: url[url.length - 2],
    url: video.videos.medium.url,
    filename: `Pixabay | ${video.user}`,
    mimeType: "video/mp4",
    dimension: {
      width: video.videos.medium.width,
      height: video.videos.medium.height,
    },
    additionalSources: [],
    metaData: {
      width: `${video.videos.medium.width}`,
      height: `${video.videos.medium.height}`,
      user: `@${video.user}`,
    },
    videoSample: video.videos.tiny.url,
    videoThumbnail: video.videos.tiny.thumbnail,
    selfHosted: true,
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
  params.set("key", env.API_KEY);
  params.set("safesearch", "true");
  params.set("per_page", "20");

  if (search && search !== "") {
    params.set("q", search);
  }

  let results: ProjectAsset[] = [];
  if (!requestProperties.assetType || requestProperties.assetType === "IMAGE") {
    const response = await fetch(`${API_IMAGE}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });
    const json = (await response.json()).hits as Photo[];
    const projectImageAssets = json.map(mapImageAssetToVevAsset);
    results.push(...projectImageAssets);
  }

  if (!requestProperties.assetType || requestProperties.assetType === "VIDEO") {
    const response = await fetch(`${API_VIDEO}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });
    const json = (await response.json()).hits as Video[];
    const projectVideoAssets = json.map(mapVideoAssetToVevAsset);
    results.push(...projectVideoAssets);
  }

  return results;
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

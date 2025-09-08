import { registerVevPlugin } from "@vev/react";
import {
  EditorPluginType,
  ProjectAsset,
  ProjectImageAsset,
  ProjectVideoAsset,
} from "@vev/utils";
import { getPath, getPropertiesFromRequest } from "./settings";

const API_IMAGE = "https://api.pexels.com/v1/search";
const API_IMAGE_CURATED = "https://api.pexels.com/v1/curated";
const API_VIDEO = "https://api.pexels.com/videos/search";
const API_VIDEO_CURATED =  "https://api.pexels.com/videos/popular";

interface Photo {
  id: string;
  width: number;
  height: number;
  alt: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface VideoType {
  quality: 'hls' | 'sd' | 'hd';
  width: number;
  height: number;
  link: string;
  file_type: string;
}
interface Video {
  id: string;
  url: string;
  image: string;
  video_files: VideoType[];
  user: { id: string; name: string; url: string };
}

function mapImageAssetToVevAsset(photo: Photo): ProjectImageAsset {
  return {
    key: `${photo.id}`,
    url: photo.src.original,
    filename: `Pexels | ${photo.photographer}`,
    mimeType: "image/png",
    dimension: { width: photo.width, height: photo.height },
    thumb: photo.src.tiny,
    metaData: {
      description: `${photo.alt}. ${photo.photographer}: ${photo.photographer_url}`,
      width: `${photo.width}`,
      height: `${photo.height}`,
      user: `${photo.photographer_url}`,
    },
    updated: Date.now(),
    selfHosted: false,
  };
}

function mapVideoAssetToVevAsset(video: Video): ProjectVideoAsset {
  const videoType = video.video_files.find(value => value.quality === "hd");
  const videoTypeSmall = video.video_files.find(value => value.quality === "sd");
  return {
    key: `${video.id}`,
    url: videoType.link,
    filename: `Pexels | ${video.user.name}`,
    mimeType: videoType.file_type,
    dimension: {
      width: videoType.width,
      height: videoType.height,
    },
    additionalSources: [],
    metaData: {
      description: `${video.user.name}: ${video.user.url}`,
      width: `${videoType.width}`,
      height: `${videoType.height}`,
      user: `@${video.user}`,
    },
    videoSample: videoTypeSmall.link,
    videoThumbnail: video.image,
    selfHosted: false,
    updated: Date.now(),
  };
}

export type MetaFields = Record<string, string[]>;

async function handler(
  request: Request,
  env: Record<string, string>
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
  params.set("per_page", "20");

  if (search && search !== "") {
    params.set("query", search);
  }

  let results: ProjectAsset[] = [];
  if (!requestProperties.assetType || requestProperties.assetType === "IMAGE") {
    const endpoint = search && search !== "" ? API_IMAGE : API_IMAGE_CURATED;
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        Authorization: env.API_KEY,
      },
    });

    if (response.ok) {
      let newVar = await response.json();
      const json = newVar.photos as Photo[];
      const projectImageAssets = json.map(mapImageAssetToVevAsset);
      results.push(...projectImageAssets);
    }
  }

  if (requestProperties.assetType === "VIDEO") {
    params.set("per_page", "5");
    const endpoint = search && search !== "" ? API_VIDEO : API_VIDEO_CURATED;
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        Authorization: env.API_KEY,
      },
    });
    if (response.ok) {
      const json = (await response.json()).videos as Video[];
      const projectVideoAssets = json.map(mapVideoAssetToVevAsset);
      results.push(...projectVideoAssets);
    }
  }

  return results;
}

registerVevPlugin({
  id: "pexelsassetsource",
  name: "Pexels",
  type: EditorPluginType.ASSET_SOURCE,
  icon: "https://storage.googleapis.com/devcdn.vev.design/misc/logggo.png",
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

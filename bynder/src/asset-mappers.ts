import { BynderAPIAsset } from "./types";
import { BynderClient } from "./client";
import { ProjectImageAsset, ProjectVideoAsset } from "@vev/utils";
import { PROPERTY_PREFIX } from "./constants";

export async function mapAssetToVevAsset(
  asset: BynderAPIAsset,
  client: BynderClient
) {
  if (asset.type === "video") {
    return mapAssetToVevVideoAsset(asset, client);
  }

  if (asset.type === "image") {
    return mapAssetToVevImageAsset(asset, client);
  }
}
/**
 *     "property_copyright": "Syngenta Crop Protection AG",
 *     "property_subterritory": [
 *       "canada"
 *     ],
 */
export async function mapAssetToVevImageAsset(
  asset: BynderAPIAsset,
  client: BynderClient
): Promise<ProjectImageAsset> {
  const metaData: Record<string, string> = {};
  await Promise.all(
    Object.keys(asset).map(async (key) => {
      if (key.startsWith(PROPERTY_PREFIX)) {
        const metaProperty = await client.getMetaProperty([key]);

        try {
          if (!metaProperty) {
            console.error(`Missing meta property for ${key}`);
          } else {
            if (Array.isArray(asset[key])) {
              const value = metaProperty.options[asset[key][0]]?.label;
              if (value) metaData[metaProperty.label] = value;
            } else if (typeof asset[key] === "object") {
              const value = metaProperty.options[asset[key]]?.label;
              if (value) metaData[metaProperty.label] = value;
            } else {
              const value = asset[key];
              if (value) metaData[metaProperty.label] = asset[key];
            }
          }
        } catch (e) {
          console.error(`Could not not map meta property ${key}`);
          console.error(e);
        }
      }
    })
  );

  return {
    key: asset.id,
    filename: asset.name,
    url: asset.thumbnails.transformBaseUrl || asset.thumbnails.webimage,
    thumb: asset.thumbnails.thul,
    dimension: { width: asset.width, height: asset.height },
    mimeType: "image/jpg",
    metaData: {
      description: asset.description,
      width: `${asset.width}`,
      height: `${asset.width}`,
      link: asset.transformBaseUrl,
      ...metaData,
    },
  };
}

/**
 *     "property_copyright": "Syngenta Crop Protection AG",
 *     "property_subterritory": [
 *       "canada"
 *     ],
 */
export async function mapAssetToVevVideoAsset(
  asset: BynderAPIAsset,
  client: BynderClient
): Promise<ProjectVideoAsset> {
  console.log("asset", asset);
  const metaData: Record<string, string> = {};
  await Promise.all(
    Object.keys(asset).map(async (key) => {
      if (key.startsWith(PROPERTY_PREFIX)) {
        const metaProperty = await client.getMetaProperty([key]);

        if (!metaProperty) {
          console.error(`Missing meta property for ${key}`);
        } else {
          if (Array.isArray(asset[key])) {
            const value = metaProperty.options[asset[key][0]].label;
            if (value) metaData[metaProperty.label] = value;
          } else if (typeof asset[key] === "object") {
            const value = metaProperty.options[asset[key]].label;
            if (value) metaData[metaProperty.label] = value;
          } else {
            const value = asset[key];
            if (value) metaData[metaProperty.label] = asset[key];
          }
        }
      }
    })
  );

  return {
    selfHosted: true,
    key: asset.id,
    filename: asset.name,
    url: asset.videoPreviewURLs[1] || asset.videoPreviewURLs[0],
    additionalSources: [],
    videoThumbnail: asset.thumbnails.webimage || asset.thumbnails.thul,
    dimension: { width: asset.width, height: asset.height },
    mimeType: `video/${asset.extension[0]}`,
    metaData: {
      description: asset.description,
      width: `${asset.width}`,
      height: `${asset.width}`,
      link: asset.transformBaseUrl,
      ...metaData,
    },
  };
}

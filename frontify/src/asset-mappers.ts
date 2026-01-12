import { ProjectImageAsset, ProjectVideoAsset } from '@vev/utils';
import { FrontifyAsset } from './client';

export async function mapAssetToVevAsset(asset: FrontifyAsset) {
  return mapAssetToVevImageAsset(asset);
}

export function mapAssetToVevImageAsset(asset: FrontifyAsset): ProjectImageAsset {
  return {
    key: asset.id,
    filename: asset.filename,
    url: asset.downloadUrl,
    thumb: asset.previewUrl,
    updated: Date.now(),
    dimension: { width: asset.width, height: asset.height },
    mimeType: `image/${asset.extension}`,
    metaData: {
      description: asset.description || '',
      width: `${asset.width}`,
      height: `${asset.height}`,
    },
    selfHosted: false,
  };
}

// export function mapAssetToVevVideoAsset(asset: FrontifyAsset): ProjectVideoAsset {
//   console.log('asset', asset);
//   console.log('attachments', attachment);
//
//   return {
//     key: asset.id,
//     filename: asset.attributes.name,
//     url: attachment.attributes.url,
//     updated: Date.now(),
//     additionalSources: [],
//     dimension: { width: 0, height: 0 },
//     mimeType: attachment.attributes.mimetype,
//     metaData: {
//       description: '',
//       width: `${attachment.attributes.width}`,
//       height: `${attachment.attributes.height}`,
//     },
//     selfHosted: false,
//   };
// }

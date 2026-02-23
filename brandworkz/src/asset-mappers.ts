import { ProjectImageAsset } from '@vev/utils';
import { BrandworkzAsset } from './client';

export async function mapAssetToVevAsset(asset: BrandworkzAsset) {
  return mapAssetToVevImageAsset(asset);
}

export function mapAssetToVevImageAsset(asset: BrandworkzAsset): ProjectImageAsset {
  return {
    key: asset.GUID,
    filename: asset.title,
    url: asset.embed_link,
    thumb: asset.thumbnailUrlCdn,
    updated: Date.now(),
    dimension: { width: asset.pixelWidth, height: asset.pixelHeight },
    mimeType: asset.mimetype,
    metaData: {
      description: asset.extendedKeywords || '',
      width: `${asset.pixelWidth}`,
      height: `${asset.pixelHeight}`,
    },
    selfHosted: false,
  };
}

// export function mapAssetToVevVideoAsset(asset: BrandworkzAsset): ProjectVideoAsset {
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

import { AssetAttributes, AttachmentAttributes, BaseItem } from './client';
import { ProjectImageAsset, ProjectVideoAsset } from '@vev/utils';

export async function mapAssetToVevAsset(
  asset: BaseItem<AssetAttributes>,
  attachments: Record<string, BaseItem<AttachmentAttributes>>,
) {
  const attachmentId = asset.relationships.attachments.data[0].id;
  const attachment = attachments[attachmentId];

  if (attachment.attributes.mimetype.startsWith('video')) {
    return mapAssetToVevVideoAsset(asset, attachment);
  }

  if (attachment.attributes.mimetype.startsWith('image')) {
    return mapAssetToVevImageAsset(asset, attachment);
  }
}

export function mapAssetToVevImageAsset(
  asset: BaseItem<AssetAttributes>,
  attachment: BaseItem<AttachmentAttributes>,
): ProjectImageAsset {
  return {
    key: asset.id,
    filename: asset.attributes.name,
    url: attachment.attributes.url,
    thumb: attachment.attributes.thumbnail_url,
    updated: Date.now(),
    dimension: { width: 0, height: 0 },
    mimeType: attachment.attributes.mimetype,
    metaData: {
      description: '',
      width: `${attachment.attributes.width}`,
      height: `${attachment.attributes.height}`,
    },
    selfHosted: false,
  };
}

export function mapAssetToVevVideoAsset(
  asset: BaseItem<AssetAttributes>,
  attachment: BaseItem<AttachmentAttributes>,
): ProjectVideoAsset {
  console.log('asset', asset);
  console.log('attachments', attachment);

  return {
    key: asset.id,
    filename: asset.attributes.name,
    url: attachment.attributes.url,
    updated: Date.now(),
    additionalSources: [],
    dimension: { width: 0, height: 0 },
    mimeType: attachment.attributes.mimetype,
    metaData: {
      description: '',
      width: `${attachment.attributes.width}`,
      height: `${attachment.attributes.height}`,
    },
    selfHosted: false,
  };
}

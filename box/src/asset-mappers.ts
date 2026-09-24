import { ProjectImageAsset } from '@vev/utils';
import { BOX_API, BoxClient, BoxItem, IMAGE_EXTENSIONS } from './client';

export function mapBoxFileToVevImageAsset(item: BoxItem, thumb?: string): ProjectImageAsset {
  return {
    key: item.id,
    filename: item.name,
    mimeType: IMAGE_EXTENSIONS[item.extension?.toLowerCase() ?? ''] ?? 'image/jpeg',
    updated: item.modified_at ? Date.parse(item.modified_at) : Date.now(),
    // Box redirects this URL to a signed dl.boxcloud.com download.
    url: `${BOX_API}/files/${encodeURIComponent(item.id)}/content`,
    thumb,
    requiresAuth: true,
    selfHosted: false,
    metaData: {},
  };
}

export async function mapBoxFilesWithThumbnails(
  client: BoxClient,
  items: BoxItem[],
): Promise<ProjectImageAsset[]> {
  return Promise.all(
    items.map(async (item) => mapBoxFileToVevImageAsset(item, await client.getThumbnail(item.id))),
  );
}

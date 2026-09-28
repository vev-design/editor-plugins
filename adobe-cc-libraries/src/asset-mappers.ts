import { ProjectImageAsset } from '@vev/utils';
import { CcElement, CcLibrariesClient } from './client';

/**
 * Full-size PNG rendition of the element. This covers PNG, JPEG, SVG, PSD, and AI graphics.
 * Vev sends only the bearer token during import, so the URL carries the client ID as `api_key`.
 */
export function getImportUrl(element: CcElement, clientId: string): string {
  const url = new URL((element.thumbnail?.rendition ?? '').replace(/;size=\d+/, ''));
  url.searchParams.set('api_key', clientId);
  return url.toString();
}

export function mapElementToVevImageAsset(
  element: CcElement,
  clientId: string,
  thumb?: string,
): ProjectImageAsset {
  return {
    key: element.id,
    filename: element.name,
    mimeType: 'image/png',
    updated: element.modified_date ?? Date.now(),
    url: getImportUrl(element, clientId),
    thumb,
    requiresAuth: true,
    selfHosted: false,
    metaData: {},
  };
}

export async function mapElementsWithThumbnails(
  client: CcLibrariesClient,
  elements: CcElement[],
): Promise<ProjectImageAsset[]> {
  return Promise.all(
    elements.map(async (element) =>
      mapElementToVevImageAsset(element, client.clientId, await client.getThumbnail(element)),
    ),
  );
}

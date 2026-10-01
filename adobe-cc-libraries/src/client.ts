export const CC_LIBRARIES_API = 'https://cc-libraries.adobe.io/api/v1';

// Libraries serves thumbnails, renditions, and files from this host.
export const CC_STORAGE_HOST = 'cc-api-storage.adobe.io';

// Graphics elements: bitmap and vector images. Each one has a PNG rendition.
export const IMAGE_ELEMENT_TYPE = 'application/vnd.adobe.element.image+dcx';

// The Libraries API accepts at most 10 libraries for each page.
const LIBRARY_PAGE_SIZE = 10;
const MAX_LIBRARY_PAGES = 10;

export interface CcElement {
  id: string;
  name: string;
  type: string;
  modified_date?: number;
  thumbnail?: { type?: string; rendition?: string };
}

export interface CcLibrary {
  id: string;
  name: string;
  library_urn?: string;
  ownership?: string;
  elements_count?: number;
  modified_date?: number;
}

/** Adobe rejected the access token. The handler converts this to a Vev refresh signal. */
export class CcAuthError extends Error {}

/**
 * Adobe requires the OAuth client ID as `x-api-key` on each request.
 * Adobe IMS access tokens are JWTs with a `client_id` claim, so the handler does not need a setting.
 */
export function getClientId(accessToken: string): string {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    if (typeof claims.client_id === 'string' && claims.client_id) return claims.client_id;
  } catch {
    // Handled below.
  }
  throw new Error('The Adobe access token has no client_id claim');
}

export function isImageElement(element: CcElement): boolean {
  return element.type === IMAGE_ELEMENT_TYPE && isStorageUrl(element.thumbnail?.rendition);
}

// Send the token only to Adobe storage. Other rendition URLs are ignored.
function isStorageUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === CC_STORAGE_HOST;
  } catch {
    return false;
  }
}

export class CcLibrariesClient {
  private accessToken: string;
  readonly clientId: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.clientId = getClientId(accessToken);
  }

  private async request(url: string | URL, init: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.clientId,
      },
      // Do not forward the bearer token to a redirect target.
      redirect: 'manual',
    });
    if (response.status === 401) throw new CcAuthError('Adobe rejected the access token');
    return response;
  }

  private async json<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${CC_LIBRARIES_API}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await this.request(url);
    if (!response.ok) throw new Error(`Adobe request failed with status ${response.status}`);
    return (await response.json()) as T;
  }

  /** Own libraries and libraries that other users share with this user. */
  async listLibraries(): Promise<CcLibrary[]> {
    const libraries: CcLibrary[] = [];
    for (let page = 0; page < MAX_LIBRARY_PAGES; page++) {
      const result = await this.json<{ libraries?: CcLibrary[]; total_count?: number }>(
        '/libraries',
        {
          owner: 'all',
          orderBy: '-modified_date',
          start: String(page * LIBRARY_PAGE_SIZE),
          limit: String(LIBRARY_PAGE_SIZE),
        },
      );
      const entries = result.libraries ?? [];
      libraries.push(...entries);
      const total = result.total_count ?? Infinity;
      if (entries.length < LIBRARY_PAGE_SIZE || libraries.length >= total) break;
    }
    return libraries;
  }

  async getLibrary(libraryId: string): Promise<CcLibrary> {
    return this.json<CcLibrary>(`/libraries/${encodeURIComponent(libraryId)}`);
  }

  async listImageElements(libraryId: string, limit = 100): Promise<CcElement[]> {
    const result = await this.json<{ elements?: CcElement[] }>(
      `/libraries/${encodeURIComponent(libraryId)}/elements`,
      { type: IMAGE_ELEMENT_TYPE, start: '0', limit: String(limit) },
    );
    return (result.elements ?? []).filter(isImageElement);
  }

  /** Without a query, returns the most recently changed images in all libraries. */
  async searchImages(query: string, limit = 30): Promise<CcElement[]> {
    const response = await this.request(`${CC_LIBRARIES_API}/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        asset_type: ['element'],
        type: [IMAGE_ELEMENT_TYPE],
        owner: 'all',
        orderBy: '-modified_date',
        limit,
        ...(query ? { query_string: query } : {}),
      }),
    });
    if (!response.ok) throw new Error(`Adobe search failed with status ${response.status}`);
    const result = (await response.json()) as { elements?: CcElement[] };
    return (result.elements ?? []).filter(isImageElement);
  }

  /** Returns a data URI, so the browser never needs the Adobe token. */
  async getThumbnail(element: CcElement): Promise<string | undefined> {
    const rendition = element.thumbnail?.rendition;
    if (!isStorageUrl(rendition)) return undefined;
    try {
      const response = await this.request(rendition);
      const contentType = response.headers.get('content-type')?.split(';')[0].trim() ?? '';
      if (response.status !== 200 || !/^image\/(png|jpeg|gif|webp)$/.test(contentType)) {
        return undefined;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return `data:${contentType};base64,${btoa(binary)}`;
    } catch (e) {
      if (e instanceof CcAuthError) throw e;
      return undefined;
    }
  }
}

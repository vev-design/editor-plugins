export const BOX_API = 'https://api.box.com/2.0';

// Vev validates and decodes these formats during authenticated import.
export const IMAGE_EXTENSIONS: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};

// Vev rejects authenticated downloads above 50 MB.
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;

const FILE_FIELDS = 'id,type,name,extension,modified_at,size';

export interface BoxItem {
  id: string;
  type: 'file' | 'folder' | 'web_link';
  name: string;
  extension?: string;
  modified_at?: string;
  size?: number;
}

export interface BoxFolder {
  id: string;
  name: string;
  path_collection?: { entries: { id: string; name: string }[] };
}

/** Box rejected the access token. The handler converts this to a Vev refresh signal. */
export class BoxAuthError extends Error {}

export function isImportableImage(item: BoxItem): boolean {
  return (
    item.type === 'file' &&
    !!item.extension &&
    item.extension.toLowerCase() in IMAGE_EXTENSIONS &&
    (item.size === undefined || item.size <= MAX_IMPORT_BYTES)
  );
}

export class BoxClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request(path: string, params: Record<string, string> = {}): Promise<Response> {
    const url = new URL(`${BOX_API}${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${this.accessToken}` },
      // Do not forward the bearer token to a redirect target.
      redirect: 'manual',
    });
    if (response.status === 401) throw new BoxAuthError('Box rejected the access token');
    return response;
  }

  private async json<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const response = await this.request(path, params);
    if (!response.ok) throw new Error(`Box request failed with status ${response.status}`);
    return (await response.json()) as T;
  }

  async searchImages(query: string, limit = 30): Promise<BoxItem[]> {
    const result = await this.json<{ entries: BoxItem[] }>('/search', {
      query,
      type: 'file',
      file_extensions: Object.keys(IMAGE_EXTENSIONS).join(','),
      fields: FILE_FIELDS,
      limit: String(limit),
    });
    return result.entries.filter(isImportableImage);
  }

  async recentImages(limit = 30): Promise<BoxItem[]> {
    const result = await this.json<{ entries: { item: BoxItem }[] }>('/recent_items', {
      fields: FILE_FIELDS,
      limit: '200',
    });
    return result.entries
      .map((entry) => entry.item)
      .filter(isImportableImage)
      .slice(0, limit);
  }

  async getFolder(folderId: string): Promise<BoxFolder> {
    return this.json<BoxFolder>(`/folders/${encodeURIComponent(folderId)}`, {
      fields: 'id,name,path_collection',
    });
  }

  async listFolder(folderId: string, limit = 200): Promise<BoxItem[]> {
    const result = await this.json<{ entries: BoxItem[] }>(
      `/folders/${encodeURIComponent(folderId)}/items`,
      { fields: FILE_FIELDS, limit: String(limit), sort: 'name', direction: 'ASC' },
    );
    return result.entries;
  }

  /** Returns a data URI, so the browser never needs the Box token. */
  async getThumbnail(fileId: string): Promise<string | undefined> {
    try {
      const response = await this.request(`/files/${encodeURIComponent(fileId)}/thumbnail.png`, {
        min_width: '160',
        min_height: '160',
      });
      // 202 and 302 mean Box has no thumbnail yet.
      if (response.status !== 200) return undefined;
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return `data:image/png;base64,${btoa(binary)}`;
    } catch (e) {
      if (e instanceof BoxAuthError) throw e;
      return undefined;
    }
  }
}

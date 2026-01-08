import { EditorPluginKv } from '@vev/utils';
import { RequestProperties } from './settings';

export interface BaseRequest<Item extends object, Attachment extends object = undefined> {
  data: BaseItem<Item>[];
  included?: BaseItem<Attachment>[];
  meta: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    total_count: number;
  };
}

export interface BaseItem<Attr extends object> {
  id: string;
  type: string;
  attributes: Attr;
  relationships?: Record<string, { data: BaseItem<any>[] }>;
}

export type BrandfolderAttributes = {
  name: string;
  tagline: string;
  privacy: string;
  slug: string;
};

export type AssetAttributes = {
  name: string;
  description: string;
  thumbnail_url: string;
  approved: boolean;
};

export type AttachmentAttributes = {
  mimetype: string;
  extension: string;
  filename: string;
  original_filename: string;
  size: number;
  width: number;
  height: number;
  url: string;
  position: number;
  thumbnail_url: string;
};

export type CollectionAttributes = {
  name: string;
  slug: string;
  tagline: string;
  public: boolean;
  stealth: boolean;
  is_workspace: boolean;
};

export type SectionAttributes = { name: string };

export class BrandfolderClient {
  private readonly apiKey: string;
  private brandfolderId: string;
  private kv: EditorPluginKv;

  constructor(apiKey: string, brandfolderId: string, kv: EditorPluginKv) {
    this.brandfolderId = brandfolderId;
    this.apiKey = apiKey;
    this.kv = kv;
  }

  private async request<Item extends object, Attachment extends object = undefined>(
    url: string,
    method: string = 'GET',
    body?: any,
  ): Promise<BaseRequest<Item, Attachment>> {
    console.log(`Requesting ${method} ${url}`);
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 200) {
      return (await response.json()) as BaseRequest<Item, Attachment>;
    }
    console.error(await response.json());
    throw new Error(`Got unhandled response status ${response.status}`);
  }

  public async getBrandfolders() {
    return await this.request<BrandfolderAttributes>('https://brandfolder.com/api/v4/brandfolders');
  }

  public async getCollections() {
    return await this.request<CollectionAttributes>(
      `https://brandfolder.com/api/v4/brandfolders/${this.brandfolderId}/collections`,
    );
  }

  public async getSections() {
    return await this.request<SectionAttributes>(
      `https://brandfolder.com/api/v4/brandfolders/${this.brandfolderId}/sections`,
    );
  }

  public async searchAssets(
    query: string,
    requestProperties: RequestProperties,
    type: ('image' | 'video' | 'other')[],
  ) {
    console.log(`Searching assets: "${query}" ${type}`);
    const extensionString: string[] = [];
    const searchParams = new URLSearchParams();
    searchParams.set('include', 'attachments');
    searchParams.set('per', '20');

    if (type.includes('image')) {
      extensionString.push('extension:png OR extension:jpeg OR extension:jpg');
    }

    if (type.includes('video')) {
      extensionString.push(
        'extension:mp4 OR extension:webp OR extension:mov OR extension:avi OR extension:wmv OR extension:mkv',
      );
    }

    let searchString = `(${extensionString.join(' OR ')}) AND NOT asset_type:document`;

    const collectionFilter = requestProperties.filter?.find((filter) => {
      return filter.field === 'collection';
    });
    const sectionFilter = requestProperties.filter?.find((filter) => {
      return filter.field === 'section';
    });

    if (query) {
      searchString += ` AND ${query}`;
    }

    if (collectionFilter && collectionFilter.value) {
      searchString += ` AND collection:"${collectionFilter.value}"`;
    }

    if (sectionFilter && sectionFilter.value) {
      searchString += ` AND section:"${sectionFilter.value}"`;
    }

    searchParams.set('search', searchString);

    const result = await this.request<AssetAttributes, AttachmentAttributes>(
      `https://brandfolder.com/api/v4/brandfolders/${this.brandfolderId}/assets?${searchParams.toString()}`,
    );

    const attachments: Record<string, BaseItem<AttachmentAttributes>> = {};
    result.included?.forEach((attachment) => (attachments[attachment.id] = attachment));

    return {
      data: result.data,
      attachments,
    };
  }
}

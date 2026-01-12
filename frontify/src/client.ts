export type FrontifyAsset = {
  id: string;
  title: string;
  filename: string;
  previewUrl: string;
  downloadUrl: string;
  extension: string;
  description?: string;
  width: number;
  height: number;
};

export class FrontifyClient {
  private domain: string;
  private apiKey: string;
  private brandId: string;

  constructor(domain: string, apiKey: string, brandId: string) {
    this.domain = domain;
    this.apiKey = apiKey;
    this.brandId = brandId;
  }

  async getBrands() {
    const query = `
query Brands {
  brands {
    id
    name
  }
}
`;

    const response = await this.query(query);
    return response.data.brands as { id: string; name: string }[];
  }

  async getMediaLibraries() {
    const query = `
query Libraries($brandId: ID!) {
  brand(id: $brandId) {
    libraries {
      items {
        __typename
        ... on MediaLibrary { id name }
      }
    }
  }
}
`;

    const response = await this.query(query, { brandId: this.brandId });
    return response.data.brand.libraries.items.filter((item) => {
      return item.__typename && item.__typename === 'MediaLibrary';
    }) as { id: string; name: string }[];
  }

  async searchAllAssetsInLibrary(libraryId: string, search: string) {
    const query = `
query SearchInMediaLibrary($libraryId: ID!, $search: String!, $page: Int = 1, $limit: Int = 25) {
  library(id: $libraryId) {
    ... on MediaLibrary {
      assets(page: $page, limit: $limit, query: { search: $search }) {
        total
        hasNextPage
        items {
          __typename
          id
          title
          ... on Image {
            filename
            previewUrl(width: 200)
            downloadUrl
            width
            height
            description
            extension
          }
        }
      }
    }
  }
}
    `;

    const results = await this.query(query, { libraryId, search });
    return results.data.library.assets.items.filter(
      (item) => item.__typename === 'Image',
    ) as FrontifyAsset[];
  }

  async searchAllAssets(search: string) {
    const mediaLibraries = await this.getMediaLibraries();

    const results = await Promise.all(
      mediaLibraries.map(async (value) => {
        return await this.searchAllAssetsInLibrary(value.id, search);
      }),
    );

    return results.flat();
  }

  private async query(query: string, variables: Record<string, any> = {}) {
    const response = await fetch(`https://${this.domain}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = await response.json();

    if (response.status !== 200 || json.errors) {
      console.error(json.errors || json);
      throw new Error('Failed to fetch Frontify data');
    }

    return json as any;
  }
}

import { SearchResponse } from './types';

export class Client {
  cloud: string;
  key: string;
  secret: string;

  constructor(cloud: string, key: string, secret: string) {
    this.cloud = cloud;
    this.key = key;
    this.secret = secret;
  }

  async searchAssets(query: string): Promise<SearchResponse> {
    const body = {
      expression: query,
      sort_by: [{ score: "desc" }],
      max_results: 100,
    };

    const response = await fetch(
      `https://${this.key}:${this.secret}@api.cloudinary.com/v1_1/${this.cloud}/resources/search`,
      {
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );

    return response.json();
  }
}

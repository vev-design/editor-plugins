import { SearchResponse } from './types';
import { getPropertiesFromRequest } from './settings';

export class Client {
  cloud: string;
  key: string;
  secret: string;

  constructor(cloud: string, key: string, secret: string) {
    this.cloud = cloud;
    this.key = key;
    this.secret = secret;
  }

  async searchAssets(query: string, resourceType?: 'image' | 'video' | 'other'): Promise<SearchResponse> {
    let expression = query;

    if(resourceType && resourceType != 'other') {
      expression = `resource_type:${resourceType} AND ${query}`
    }

    if(resourceType && resourceType == 'other') {
      expression = `resource_type:raw AND ${query}`
    }

    const body = {
      expression,
      sort_by: [{ score: "desc" }],
      max_results: 50,
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

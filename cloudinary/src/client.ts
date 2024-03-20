import { SearchResponse } from "./types";

export class Client {
  cloud: string;
  key: string;
  secret: string;
  cloudUrl: string;

  constructor(cloud: string, key: string, secret: string) {
    this.cloud = cloud;
    this.key = key;
    this.secret = secret;
    this.cloudUrl = `https://${this.key}:${this.secret}@api.cloudinary.com/v1_1/${this.cloud}`;
  }

  async searchAssets(
    query: string,
    resourceType?: "IMAGE" | "VIDEO" | "OTHER",
    filter?: Record<string, string>
  ): Promise<SearchResponse> {
    console.log('query', query);
    console.log('resourceType', resourceType);
    console.log('filter', filter);

    let expression = query;

    if (resourceType) {
      if (resourceType != "OTHER") {
        expression = `resource_type:${resourceType.toLowerCase()}`;
      } else {
        expression = `resource_type:raw`;
      }

      if (query && query !== "") {
        expression += " AND ${query}";
      }
    }

    if(filter && Object.keys(filter).length > 0) {
      const filterExpression =  expression !== null && expression !== '' ? [expression] : [];

      Object.keys(filter).forEach(key => {
        filterExpression.push(`${key}=${filter[key]}`)
      });
      console.log('filterExpression', filterExpression);
      expression = filterExpression.join(' AND ');
    }

    const body = {
      expression,
      sort_by: [{ score: "desc" }],
      max_results: 50,
    };

    console.log('body', body);

    const response = await fetch(`${this.cloudUrl}/resources/search`, {
      body: JSON.stringify(body),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    return response.json();
  }

  async getTags() {
    const tags = await Promise.all(
      ["image", "video", "raw"].map(async (resourceType) => {
        const response = await fetch(`${this.cloudUrl}/tags/${resourceType}`, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "GET",
        });
        return (await response.json()).tags as Promise<string[]>;
      })
    );

    return tags.flatMap((value) => value);
  }
}

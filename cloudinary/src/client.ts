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
    resourceType?: "IMAGE" | "VIDEO" | "OTHER"
  ): Promise<SearchResponse> {
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

    const body = {
      expression,
      sort_by: [{ score: "desc" }],
      max_results: 50,
    };

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

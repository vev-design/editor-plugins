import { Kv } from "./bynder";
import { BynderAPIAsset } from './types';

interface AuthResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
}

const AUTH_RETRIES = 3;

export class BynderClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly bynderDomain: string;
  private newTokenRetries = AUTH_RETRIES;
  private kv: Kv;

  constructor(
    clientId: string,
    clientSecret: string,
    bynderDomain: string,
    kv: Kv
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.bynderDomain = bynderDomain;
    this.kv = kv;
  }

  private async getAccessToken(): Promise<string> {
    const kvRes = await this.kv.get<string>(["accessToken"]);
    if (kvRes.value) {
      console.log(`Using access token from KV: ${kvRes.value}`);
      return kvRes.value;
    } else {
      return await this.requestNewAccessToken();
    }
  }

  private async requestNewAccessToken(): Promise<string> {
    console.log("Requesting new access token");
    const response = await fetch(
      `https://${this.bynderDomain}/v6/authentication/oauth2/token`,
      {
        body: `client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      }
    );

    const responseJson = (await response.json()) as AuthResponse;
    await this.kv.set(["accessToken"], responseJson.access_token);
    return responseJson.access_token;
  }

  public async searchAssets(query: string, type: ("image" | "video")[]): Promise<BynderAPIAsset[]> {
    console.log(`Searching assets: "${query}" ${type}`);
    const accessToken = await this.getAccessToken();

    const url = `https://${this.bynderDomain}/api/v4/media?type=${type.join(
      ","
    )}${query && query !== "" ? `&keyword=${query}` : ''}`;

    const response = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 401) {
      if(this.newTokenRetries > 0) {
        this.newTokenRetries--;
        console.log("Got 401: Requesting new token");
        await this.requestNewAccessToken();
        return this.searchAssets(query, type);
      } else {
        throw new Error('Got 401 and exceeded number of retries');
      }
    } else if (response.status === 200) {
      console.log("Success!");
      return await response.json();
    } else {
      throw Error(`Got unhandled response status ${response.status}`);
    }
  }
}

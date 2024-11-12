import {
  BynderAPIAsset,
  BynderMetaProperties,
  BynderMetaProperty, Filter,
  KVBynderMetaProperties,
  KVBynderMetaProperty,
} from './types';
import { PROPERTY_PREFIX } from "./constants";
import { EditorPluginKv, EditorPluginKvKey } from '@vev/utils';
import { RequestProperties } from './settings';

interface AuthResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
}

const AUTH_RETRIES = 3;

enum KVKeys {
  accessToken = "accessToken",
  metaproperties = "metaproperties",
  metaPropertiesTimestamp = "metaPropertiesTimestamp",
}

const oneDay = 24 * 60 * 60 * 1000;

export class BynderClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly bynderDomain: string;
  private metaPropertyCache: Record<string, KVBynderMetaProperty>;
  private newTokenRetries = AUTH_RETRIES;
  private kv: EditorPluginKv;

  constructor(
    clientId: string,
    clientSecret: string,
    bynderDomain: string,
    kv: EditorPluginKv
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.bynderDomain = bynderDomain;
    this.kv = kv;
    this.metaPropertyCache = {};
  }

  private async getAccessToken(): Promise<string> {
    const kvRes = await this.kv.get<string>([KVKeys.accessToken]);
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
    await this.kv.set([KVKeys.accessToken], responseJson.access_token);
    return responseJson.access_token;
  }

  private cleanMetaProperties(
    metaproperties: BynderMetaProperty
  ): KVBynderMetaProperty {
    const options: Record<string, KVBynderMetaProperty> = {};
    const kvMetaProps =
      metaproperties.options?.map(this.cleanMetaProperties) || [];

    kvMetaProps.forEach((metaprop) => {
      options[metaprop.name] = metaprop;
    });

    if (Object.keys(options).length) {
      return {
        label: metaproperties.label,
        name: metaproperties.name,
        options,
      };
    } else {
      return {
        label: metaproperties.label,
        name: metaproperties.name,
      };
    }
  }

  public async getAllMetaProperties(
    type: ("image" | "video" | "other")[]
  ): Promise<BynderMetaProperties> {
    console.log("Getting meta properties");
    const accessToken = await this.getAccessToken();

    const url = `https://${
      this.bynderDomain
    }/api/v4/metaproperties?type=${type.join(",")}&options=1`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      if (this.newTokenRetries > 0) {
        this.newTokenRetries--;
        console.log("Got 401: Requesting new token");
        await this.requestNewAccessToken();
        return this.getAllMetaProperties(type);
      } else {
        throw new Error("Got 401 and exceeded number of retries");
      }
    } else if (response.status === 200) {
      return await response.json();
    } else {
      throw Error(`Got unhandled response status ${response.status}`);
    }
  }

  public async syncMetaProperties(type: ("image" | "video" | "other")[]) {
      console.log("Fetching metaproperties");
      const bynderMetaProperties = await this.getAllMetaProperties(type);

      const kvPayload: KVBynderMetaProperties = {};

      Object.keys(bynderMetaProperties).forEach((metapropKey) => {
        kvPayload[`${PROPERTY_PREFIX}${metapropKey}`] =
          this.cleanMetaProperties(bynderMetaProperties[metapropKey]);
      });

    this.metaPropertyCache = kvPayload;
  }

  public async getMetaProperty(key: EditorPluginKvKey): Promise<KVBynderMetaProperty> {
    if (this.metaPropertyCache[key.join()]) {
      return this.metaPropertyCache[key.join()];
    } else {
      console.warn(`Could not get metaproperty ${key}`)
    }
  }

  public async searchAssets(
    query: string,
    filter: RequestProperties | undefined,
    type: ("image" | "video" | "other")[]
  ): Promise<BynderAPIAsset[]> {
    console.log(`Searching assets: "${query}" ${type}`);
    const accessToken = await this.getAccessToken();

    const params = new URLSearchParams();

    params.set("type", type.join(','));

    if(query && query !== "") {
      params.set('keyword', query);
    }

    if(filter && filter.filter) {
      filter.filter.forEach(filterField => {
        const paramValue = `${PROPERTY_PREFIX}${filterField.field}`;
        if(params.has(paramValue)) {
          const prevValue = params.get(paramValue);
          params.set(paramValue, `${prevValue},${filterField.value}`);
        } else {
          params.set(paramValue, filterField.value);
        }
      });
    }

    if(filter && filter.property_filter) {
      Object.keys(filter.property_filter).forEach((prop) => {
        const paramValue = `${PROPERTY_PREFIX}${prop}`;
        const propValue = filter.property_filter[prop];
        if(propValue) {
          params.set(paramValue, propValue)
        }
      });
    }

    console.log('params', params.toString());

    const url = `https://${this.bynderDomain}/api/v4/media?${params.toString()}`;

    console.log('url', url);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      if (this.newTokenRetries > 0) {
        this.newTokenRetries--;
        console.log("Got 401: Requesting new token");
        await this.requestNewAccessToken();
        return this.searchAssets(query, filter, type);
      } else {
        throw new Error("Got 401 and exceeded number of retries");
      }
    } else if (response.status === 200) {
      console.log("Success!");
      return await response.json();
    } else {
      throw Error(`Got unhandled response status ${response.status}`);
    }
  }
}

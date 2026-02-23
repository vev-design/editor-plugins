export interface BrandworkzAsset {
  GUID: string;
  title: string;
  thumbnailUrlCdn: string;
  createdBy: string;
  assetType: string;
  mimetype: string;
  embed_link: string;
  pixelWidth: number;
  pixelHeight: number;
  extendedKeywords: string;
}

interface UninitializedState {
  initialized: false;
  apiUrl: undefined;
  clientId: undefined;
  version: undefined;
}

interface InitializedState {
  initialized: true;
  apiUrl: string;
  clientId: string;
  version: string;
}

type ClientState = UninitializedState | InitializedState;

export class BrandworkzClient {
  private domain: string;
  private consumerId: string;
  private consumerSecret: string;
  private username: string;
  private password: string;
  private token: string | undefined;

  private state: ClientState = {
    initialized: false,
    apiUrl: undefined,
    clientId: undefined,
    version: undefined,
  };

  constructor(
    domain: string,
    consumerId: string,
    consumerSecret: string,
    username: string,
    password: string,
  ) {
    this.domain = domain.trim();
    this.consumerId = consumerId.trim();
    this.consumerSecret = consumerSecret.trim();
    this.username = username;
    this.password = password;
  }

  async getApiData() {
    if (this.state.initialized) {
      return this.state;
    }
    const response = await fetch(`https://api.brandworkz.com/getAPIURL?clientURL=${this.domain}`);
    if (response.ok) {
      const json = (await response.json()) as {
        result: {
          message: string;
          code: number;
        };
        data: {
          api_url: string;
          client_id: string;
          version: string;
        };
      };

      this.state = {
        initialized: true,
        apiUrl: json.data.api_url,
        clientId: json.data.client_id,
        version: json.data.version,
      };

      return this.state;
    }
    throw Error('Failed to fetch Brandworkz API URL');
  }

  async getAPIToken() {
    await this.getApiData();
    if (this.token) {
      return this.token;
    }
    const response = await fetch(`${this.state.apiUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${this.consumerId}:${this.consumerSecret}`)}`,
        Accept: 'application/json;charset=UTF-8',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_db: this.state.clientId,
        username: this.username,
        password: this.password,
      }),
    });

    const tokenResponse = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    this.token = tokenResponse.access_token;
    return tokenResponse.access_token;
  }

  async getAssetInsert() {
    const token = await this.getAPIToken();
    const parameters = new URLSearchParams({
      usage: 'WORDPRESS',
      size: '50',
      allowedTransformSystemrefs: '',
      collapse: 'true',
      assetType: 'Image,Video,Audio',
      enableDetailView: 'true',
      enableMultiSelect: 'true',
      createdByUserId: '',
    });

    const response = await fetch(
      `${this.state.apiUrl}/v${this.state.version}/${this.state.clientId}/assetInsert?${parameters.toString()}`,
      {
        headers: {
          Accept: 'text/html',
          Authorization: 'Bearer ' + token,
        },
      },
    );
    let html = await response.text();
    html = html.replace(
      '"apiBaseUrl" : "https://api.brandworkz.com"',
      '"apiBaseUrl" : "https://us-api.brandworkz.com"',
    );
    return html;
  }

  async getAssetPickerRequired() {
    return {
      assetInsert: await this.getAssetInsert(),
      auth: {
        token: await this.getAPIToken(),
        type: 'external',
        consumerId: this.consumerId,
        consumerSecret: this.consumerSecret,
        clientDb: this.state.clientId,
        username: this.username,
        password: this.password,
      },
    };
  }
}

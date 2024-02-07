import { registerVevPlugin } from "@vev/react";
import { BynderClient } from './client.js';
import { BynderAPIAsset } from './types';

// KV types
type KeyPart = string | number | bigint | boolean | symbol;

type KvKey = KeyPart[];

interface KvCommitResult {
  ok: true;
  versionstamp: string;
}

interface KvEntry<T> {
  key: KvKey;
  value: T;
  versionstamp: string;
}

export interface Kv {
  set: (key: KvKey, value: unknown) => Promise<KvCommitResult>;
  get: <T>(key: KvKey) => Promise<KvEntry<T>>;
  delete: (key: KvKey) => Promise<void>;
}

function mapAssetToVevAsset(asset: BynderAPIAsset) {
  return {
    key: asset.id,
    name: asset.name,
    thumb: asset.thumbnails.webimage,
    url: asset.thumbnails.transformBaseUrl,
    type: 'image',
    metadata: {
      description: asset.description,
      width: asset.width,
      height: asset.height,
      link: asset.transformBaseUrl,
    },
  };
}


async function handler(request: Request, env: Record<string, string>, kv: Kv) {
  console.log('env', '\n', JSON.stringify(env, null, 4), '\n');
  let lastPath = request.url.split("/").splice(-1)[0];
  const client = new BynderClient(env.clientId, env.clientSecret, env.bynderDomain, kv);

  const url = new URL(request.url);
  const urlSearchParams = new URLSearchParams(url.search);
  const search = urlSearchParams.get("search");

  const result = await client.searchAssets(search, ['image']);
  return result.map(mapAssetToVevAsset);
}

registerVevPlugin({
  id: "bynderassetsource",
  name: "Bynder",
  type: "asset-source",
  icon: "https://cdn.worldvectorlogo.com/logos/bynder.svg",
  form: [
    {
      type: "string",
      name: "bynderDomain",
      title: "Bynder domain",
    },
    {
      type: "string",
      name: "clientId",
      title: "Client ID",
    },
    {
      type: "string",
      name: "clientSecret",
      title: "Client Secret",
    },
  ],
  handler: handler,
});

export default handler;

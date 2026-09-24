import { registerVevPlugin } from '@vev/react';
import {
  EditorPluginAssetSourceFilterFields,
  EditorPluginContext,
  EditorPluginKv,
  EditorPluginSettings,
  EditorPluginType,
  ProjectAsset,
} from '@vev/utils';
import { mapBoxFilesWithThumbnails } from './asset-mappers';
import { BoxAuthError, BoxClient } from './client';
import { BOX_ICON } from './icon';
import { getAssetPicker } from './picker';
import { getPropertiesFromRequest, getSettingsPath } from './settings';

function jsonResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response('{}', {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

// Vev refreshes the token and retries once when it receives this signal.
function invalidTokenResponse(): Response {
  return jsonResponse(401, { 'x-vev-oauth-error': 'invalid_token' });
}

async function handler(
  request: Request,
  _env: Record<string, string>,
  _kv: EditorPluginKv,
  ctx?: EditorPluginContext,
): Promise<ProjectAsset[] | EditorPluginSettings | EditorPluginAssetSourceFilterFields | Response> {
  const settingType = getSettingsPath(request.url);

  if (settingType === 'meta_fields') return [];
  if (settingType && settingType !== 'asset_picker') return { form: [] };

  if (!ctx?.auth) return jsonResponse(401);
  const client = new BoxClient(ctx.auth.accessToken);

  try {
    if (settingType === 'asset_picker') return await getAssetPicker(client, request);

    const { assetType } = await getPropertiesFromRequest(request);
    // Vev imports authenticated assets only as images.
    if (assetType && assetType !== 'image') return [];

    const search = new URL(request.url).searchParams.get('search')?.trim();
    const files = search ? await client.searchImages(search) : await client.recentImages();
    return await mapBoxFilesWithThumbnails(client, files);
  } catch (e) {
    if (e instanceof BoxAuthError) return invalidTokenResponse();
    throw e;
  }
}

registerVevPlugin({
  id: 'boxassetsource',
  name: 'Box',
  type: EditorPluginType.ASSET_SOURCE,
  icon: BOX_ICON,
  form: [],
  oauth: {
    authorizeUrl: 'https://account.box.com/api/oauth2/authorize',
    tokenUrl: 'https://api.box.com/oauth2/token',
    revokeUrl: 'https://api.box.com/oauth2/revoke',
    // Box requires the write scope for GET /files/{id}/content. Read-only tokens get 403.
    scopes: ['root_readwrite'],
    tokenAuthMethod: 'client_secret_post',
    clientCredentials: 'install',
    connection: 'user',
    userInfo: { url: 'https://api.box.com/2.0/users/me', labelField: 'login' },
    assetHosts: ['api.box.com'],
    assetRedirectHosts: ['dl.boxcloud.com', 'public.boxcloud.com'],
  },
  handler,
});

export default handler;

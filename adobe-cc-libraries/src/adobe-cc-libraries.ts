import { registerVevPlugin } from '@vev/react';
import {
  EditorPluginAssetSourceFilterFields,
  EditorPluginContext,
  EditorPluginKv,
  EditorPluginSettings,
  EditorPluginType,
  ProjectAsset,
} from '@vev/utils';
import { mapElementsWithThumbnails } from './asset-mappers';
import { CcAuthError, CcLibrariesClient, CC_STORAGE_HOST } from './client';
import { CC_LIBRARIES_ICON } from './icon';
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
  const client = new CcLibrariesClient(ctx.auth.accessToken);

  try {
    if (settingType === 'asset_picker') return await getAssetPicker(client, request);

    const { assetType } = await getPropertiesFromRequest(request);
    // Vev imports authenticated assets only as images.
    if (assetType && assetType !== 'image') return [];

    // An empty search returns the most recently changed images.
    const search = new URL(request.url).searchParams.get('search')?.trim() ?? '';
    const elements = await client.searchImages(search);
    return await mapElementsWithThumbnails(client, elements);
  } catch (e) {
    if (e instanceof CcAuthError) return invalidTokenResponse();
    throw e;
  }
}

registerVevPlugin({
  id: 'adobecclibraries',
  name: 'Adobe CC Libraries',
  type: EditorPluginType.ASSET_SOURCE,
  icon: CC_LIBRARIES_ICON,
  form: [],
  oauth: {
    authorizeUrl: 'https://ims-na1.adobelogin.com/ims/authorize/v2',
    tokenUrl: 'https://ims-na1.adobelogin.com/ims/token/v3',
    revokeUrl: 'https://ims-na1.adobelogin.com/ims/revoke',
    // Scopes from the Libraries API guide. IMS returns a refresh token only with offline_access.
    scopes: [
      'openid',
      'AdobeID',
      'creative_sdk',
      'profile',
      'address',
      'email',
      'cc_files',
      'cc_libraries',
      'offline_access',
    ],
    tokenAuthMethod: 'client_secret_basic',
    // Each customer creates an Adobe app and enters its credentials in the install form.
    clientCredentials: 'install',
    connection: 'user',
    userInfo: { url: 'https://ims-na1.adobelogin.com/ims/userinfo/v2', labelField: 'email' },
    assetHosts: [CC_STORAGE_HOST],
  },
  handler,
});

export default handler;

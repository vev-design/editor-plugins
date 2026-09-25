# OAuth editor plugins

Vev manages provider authorization, client credentials, token storage, and token refresh.
Your server handler receives the access token through its fourth argument, `ctx`.
The browser receives asset data. It does not receive the provider token.

## Availability

This guide describes the pending OAuth implementation:

- [Backend and CLI wrapper, PR #6734](https://github.com/vev-design/vev/pull/6734)
- [Editor controls and picker sessions, PR #6735](https://github.com/vev-design/vev/pull/6735)
- [Authenticated image import, PR #6736](https://github.com/vev-design/vev/pull/6736)

These links identify the implementation. They do not confirm a production release.
Use a CLI build that generates wrapper protocol version `1` and package types that include OAuth support.
The repository's existing dependency versions do not guarantee this support.
Do not set `wrapperVersion` manually. The CLI generates it during the build.

Before hosted testing, the target environment needs the backend, editor, rules, secrets, and TTL configuration.
Authenticated image imports also need the image-import release.
Provider app setup and end-to-end verification remain release requirements.

## Choose connection and credential settings

These settings control separate parts of the integration:

| Setting             | Value       | Behavior                                                                             |
| ------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `connection`        | `'user'`    | Each Vev user connects a provider login. This is the default.                        |
| `connection`        | `'install'` | Account members use one shared provider login.                                       |
| `clientCredentials` | `'install'` | An account settings manager enters the provider app credentials during installation. |
| `clientCredentials` | `'vev'`     | The backend loads provider app credentials from Vev-managed Secret Manager storage.  |

For shared connections, only users with `PlatformPermission.manageAccountSettings` can connect, replace, or disconnect the login.
Other account members can use the connection.
Default plugins keep shared connections separate for each consuming Vev account.

An OAuth client identifies the provider app. A connection identifies the authorized provider login.
For example, installation credentials can support separate personal connections for each account member.

## Register the plugin

Adapt the asset-source template or an existing provider package.
Use compatible `@vev/react` and `@vev/utils` packages.

The example below assumes a provider search response with an `items` array.
Replace the example endpoints, scope, response mapping, and download URL with your provider's values.
The `.example` hostnames are placeholders.

```ts
import { registerVevPlugin } from '@vev/react';
import { EditorPluginType } from '@vev/utils';

registerVevPlugin({
  id: 'oauth-image-library',
  name: 'OAuth Image Library',
  type: EditorPluginType.ASSET_SOURCE,
  form: [],
  oauth: {
    authorizeUrl: 'https://login.provider.example/oauth/authorize',
    tokenUrl: 'https://api.provider.example/oauth/token',
    scopes: ['files.read'],
    tokenAuthMethod: 'client_secret_basic',
    clientCredentials: 'install',
    connection: 'user',
    assetHosts: ['api.provider.example'],
    assetRedirectHosts: ['downloads.provider.example'],
  },
  async handler(request, _env, _kv, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/settings/meta_fields') return [];
    if (url.pathname === '/settings/asset_picker') {
      return new Response('{}', {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.pathname.startsWith('/settings/')) return { form: [] };

    if (!ctx?.auth) {
      return new Response('{}', {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const endpoint = new URL('https://api.provider.example/files');
    endpoint.searchParams.set('search', url.searchParams.get('search') ?? '');
    const response = await fetch(endpoint, {
      headers: { authorization: `Bearer ${ctx.auth.accessToken}` },
    });

    // Use this signal only when the provider rejects the access token.
    if (response.status === 401) {
      return new Response('{}', {
        status: 401,
        headers: {
          'content-type': 'application/json',
          'x-vev-oauth-error': 'invalid_token',
        },
      });
    }
    if (!response.ok) throw new Error('Provider search failed');

    const result = await response.json();
    return result.items
      .filter((item) => item.mimeType.startsWith('image/'))
      .map((item) => ({
        key: String(item.id),
        filename: item.name,
        mimeType: item.mimeType,
        updated: Date.parse(item.updatedAt),
        url: `https://api.provider.example/files/${encodeURIComponent(item.id)}/content`,
        requiresAuth: true,
      }));
  },
});
```

Search uses `POST /?search=...`.
The JSON body can contain saved settings, `assetType`, and metadata `filter` entries.
Read this body when your provider supports those filters.

Return asset arrays directly. For custom `Response` objects, set `content-type: application/json`.
The JSON gateway rejects HTML. Picker HTML uses the separate Deno flow described below.

### OAuth options

| Field                  | Use                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `tokenAuthMethod`      | Use `'client_secret_basic'` or `'client_secret_post'`, as required by the provider.                      |
| `scopes`               | List the required scope strings. Use `[]` when the provider does not accept a scope parameter.           |
| `pkce`                 | S256 PKCE is enabled by default. Set `false` only when the provider requires its omission.               |
| `revokeUrl`            | Optional token revocation endpoint.                                                                      |
| `userInfo`             | Optional `{ url, labelField }` for the connection label. Lookup failure does not discard the connection. |
| `extraAuthorizeParams` | Optional provider parameters. Reserved OAuth parameters cannot be replaced.                              |
| `assetHosts`           | Exact hostnames permitted for initial authenticated image downloads.                                     |
| `assetRedirectHosts`   | Additional exact hostnames permitted after download redirects.                                           |

Provider URLs require HTTPS. Token, revocation, and user-info requests reject redirects.
Do not include credentials in URLs, manifest fields, form defaults, or authorization parameters.
Do not add client ID or client secret fields to `form`. The editor supplies these inputs for installation credentials.

For tenant-specific endpoints, use a complete hostname label, such as `https://{{tenant}}.provider.example/oauth/token`.
Declare the `tenant` installation field in `form`.
Templates cannot replace paths, ports, query values, or partial hostname labels.
Host allowlists use exact hostnames, without schemes, paths, or wildcards.

## Install and connect

After the target environment supports OAuth, deploy a rebuilt plugin with `vev deploy`.
Open the plugin installation form in the account integrations area.

1. Enter the provider app's client ID and client secret.
2. Copy the exact callback URL from the installation form.
3. Register that URL in the provider app's redirect settings.
4. Complete the installation.
5. Select **Connect** in the plugin's connection controls and approve provider access.

The callback includes a provider-specific suffix under `/v2/editor-plugin-oauth/callback`.
Do not construct this URL manually. Production, development, and emulator URLs differ.
If installation fields change the provider configuration, copy the updated callback URL.

For an expired connection, select **Reconnect**.
For a shared connection, the editor labels it **Account connection** and limits management controls to authorized users.
If the browser blocks the connection window, allow popups for the editor and retry.

For `clientCredentials: 'vev'`, omit the installation credential step.
The platform operator must configure `EDITOR_PLUGIN_OAUTH_CLIENTS` and grant access to the mapped secret.
Plugins cannot select arbitrary secret names.

## Handle tokens and retries

Use `ctx.auth.accessToken` only in server requests to the provider.
The context also includes the Vev user and consuming account.
Do not return tokens in asset data, picker HTML, image URLs, errors, or logs.

When the provider rejects a token, return both HTTP `401` and `x-vev-oauth-error: invalid_token`.
A plain plugin `401` does not request token refresh.
Check the provider's error response before sending this signal if it uses `401` for other errors.

The gateway retries read operations once after refresh.
This includes root search POSTs, metadata reads, and picker discovery.
Keep these routes free of state changes.
Settings writes are not replayed. They can return `oauth_request_retry_required` after refresh.
Picker session routes also permit one retry and must contain only read operations.

Vev manages refresh tokens and token rotation.
Do not implement a second refresh flow or store tokens in wrapper KV.
OAuth KV entries are scoped to the installation, consuming account, and Vev user.
Shared provider connections do not make KV entries shared between users.

## Add a picker window

Return HTML from `/settings/asset_picker` for both discovery POSTs and navigation GETs.
Return `content-type: text/html`.
For compatibility with local discovery, start the HTML text with `<html>`.

The editor opens the picker on the installation's Deno origin.
The wrapper handles the single-use ticket and sets an HttpOnly session cookie with a 30-minute lifetime.
Do not implement the ticket exchange or access the cookie from plugin code.

Keep scripts and styles inline.
The session permits GET, HEAD, and POST requests on `/`, `/settings/asset_picker`, and `/settings/meta_fields`.
Other paths, external picker redirects, and cross-origin state changes are rejected.

Use a same-origin request to load assets from the server handler:

```js
const response = await fetch('/?search=flowers', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ assetType: 'image' }),
});
if (!response.ok) throw new Error('Could not load assets');
const assets = await response.json();
```

After selection, send the selected assets to the exact editor origin:

```js
window.opener.postMessage(
  { type: 'pickAsset', assets: [selectedAsset] },
  'https://editor.vev.design',
);
```

Use `https://dev.vev.design` when testing in the development editor.
For cancellation, send `{ type: 'cancel' }` to the same origin.
Do not use `'*'` or accept an arbitrary target origin from a URL parameter.
The editor checks the source window, origin, and asset payload.
It attaches installation and connection identity itself.

If the session expires, reopen the picker from the editor.
If the connection expires, reconnect before reopening the picker.

## Import authenticated images

Set `requiresAuth: true` when the image download requires a provider bearer token.
Return a stable provider asset `key`, `url`, `mimeType`, and numeric `updated` timestamp.
Do not supply `oauthSource`; the editor owns that temporary field.

The editor shows `thumb` for authenticated images when it is an inline base64 PNG, JPEG, GIF, or WebP data URI.
Else it shows a placeholder. Load the thumbnail on the server; the browser never gets the provider token.
After selection, Vev downloads the image and saves the imported CDN values in the project.
Authenticated imports bypass `publicImages`.
`requiresAuth` takes precedence over `selfHosted`.

The initial download hostname must appear in `assetHosts`.
Each redirect hostname must appear in `assetHosts` or `assetRedirectHosts`.
After an origin change, Vev removes authorization for all remaining redirects.
The destination must accept that unauthenticated download, such as through a signed URL.

Downloads permit three redirects, 50 MB, and 30 seconds per attempt.
Vev validates the image bytes before upload.
Authenticated video, audio, and other file imports are unsupported.

Imported images use the existing project CDN behavior.
The copied images do not retain the provider's access controls.
Disconnecting the provider does not remove images already imported into the project.

## Local development

Use the compatible CLI and run commands from the plugin directory.
Add `.env` to an applicable `.gitignore` before creating the local token file.
The repository currently does not ignore `.env` files by default.

Set this value in the plugin's `.env` file:

```dotenv
VEV_DEV_ACCESS_TOKEN=replace-with-a-provider-development-access-token
```

The local parser reads literal values. Do not surround the token with quotes.
Keep this file out of commits.

Start the plugin with `vev start`.
The local server runs the generated development wrapper and injects the token into `ctx.auth`.
Production bundles ignore `VEV_DEV_ACCESS_TOKEN`.
If the development token expires, replace it and restart the local server.

Local testing covers handler requests and picker messages.
It does not verify hosted OAuth authorization, token refresh, shared permissions, or authenticated image import.
Use a deployed development installation for those checks.

## Migration and troubleshooting

Rebuild old plugins with the compatible CLI before enabling OAuth.
Adding a gateway secret to an old bundle does not add authentication.
If an existing installation lacks client credentials, reinstall it with the required credentials.
If provider configuration or connection mode changes, reinstall and authorize again.

Do not set reserved `VEV_`, `DENO_`, or `KV_` environment values during OAuth installation.
Vev generates the gateway credentials.

| Symptom or error                 | Action                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `oauth_rebuild_required`         | Rebuild and redeploy with the compatible CLI.                                 |
| `oauth_credentials_missing`      | Supply installation credentials or check the Vev-managed secret mapping.      |
| `oauth_management_denied`        | Use an account member with account-settings management permission.            |
| `oauth_expired`                  | Reconnect the provider from the editor.                                       |
| `oauth_request_retry_required`   | Check the operation result before submitting the write again.                 |
| `oauth_asset_connection_changed` | Search again and select an asset from the current connection.                 |
| `oauth_asset_host_denied`        | Check the initial and redirect hostname lists.                                |
| `oauth_worker_json_required`     | Return JSON for gateway requests. Serve picker HTML through the picker route. |
| Direct worker URL returns `401`  | Open the plugin through the editor gateway or its picker window.              |

Before activation, verify two personal users, shared-account permissions, a hosted picker, token refresh, and image import.
Also verify disconnect, reconnect, popup cancellation, and unsupported asset handling.
Keep installations disabled until the deployment and provider checks pass.

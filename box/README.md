# Box asset source editor plugin

This plugin adds Box files to the Vev editor asset panel.
Each Vev user connects their own Box account through OAuth 2.0.
The account that installs the plugin supplies its own Box app client ID and client secret.

Users can find images in two ways:

- **Asset panel search.** An empty search shows recent Box images. A search term searches all Box files that the user can access.
- **Picker window.** The user opens the Box picker from the asset panel, goes through folders, searches, and selects an image.

The plugin imports images only: JPEG, PNG, GIF, and WebP, up to 50 MB.
Vev copies each selected image to the project CDN.

For the general platform guide, see [OAuth editor plugins](../docs/oauth.md).

## How OAuth works

Vev keeps all secrets on the server. The browser never receives the Box access token.

```
 Account admin                 Vev                              Box
 ─────────────                 ───                              ───
 1. Install plugin ──────────► stores client ID + secret
    (client ID, secret)        shows callback URL
 2. Copy callback URL ─────────────────────────────────────────► Redirect URI in Box app

 Editor user
 ───────────
 3. Select "Connect" ────────► opens popup ──────────────────► account.box.com/api/oauth2/authorize
 4. Log in, "Grant access" ◄──────────────────────────────────── consent screen
                               callback ◄───────────────────── ?code=…
                               exchanges code at api.box.com/oauth2/token
                               stores access + refresh token for this user
 5. Search / picker ─────────► gateway ─► plugin handler (ctx.auth.accessToken) ─► api.box.com/2.0
                               ◄──────── asset list + data-URI thumbnails
 6. Select image ────────────► downloads api.box.com/2.0/files/{id}/content
                               follows 302 to dl.boxcloud.com (without token)
                               uploads to Vev CDN
```

Important points:

- `clientCredentials: 'install'` means the account admin enters the Box app credentials in the Vev install form. The plugin code and manifest contain no credentials.
- The plugin requests the `root_readwrite` scope. Box returns `403 access_denied_insufficient_permissions` for `GET /files/{id}/content` with a `root_readonly` token. The plugin code only reads from Box.
- `connection: 'user'` means each Vev user has a separate Box login. Users see only files that their own Box account can access.
- Box access tokens expire after 60 minutes. When Box returns `401`, the handler returns `401` with `x-vev-oauth-error: invalid_token`. Vev then uses the refresh token, gets a new access token, and retries the request once.
- Box rotates the refresh token on each refresh. Vev stores the new refresh token. Refresh tokens expire after 60 days without use. After that, the user selects **Reconnect**.
- The handler loads Box thumbnails on the server and returns them as `data:` URIs. This lets the asset panel and picker show previews without the token in the browser.
- The picker page runs on the plugin's Deno origin. Vev sets a 30-minute HttpOnly session cookie. The page sends the selected asset to the editor with `window.opener.postMessage`, only to `https://editor.vev.design` and `https://dev.vev.design`.

## Set up the Box app

Do these steps once for each Vev account that installs the plugin.

1. Open the [Box Developer Console](https://app.box.com/developers/console).
2. Select **Create Platform App**, then **Custom App**.
3. Enter a name, for example `Vev`. For **Authentication Method**, select **User Authentication (OAuth 2.0)**. Select **Create App**.
4. On the **Configuration** tab, under **Application Scopes**, select **Read all files and folders stored in Box** and **Write all files and folders stored in Box**. Clear all other scopes.
   Box requires the write scope to download files. The plugin does not change or upload files in Box.
5. Copy the **Client ID** and **Client Secret**. You need them in the Vev install form.
6. Keep this page open. You add the redirect URI after the Vev install.

If your Box enterprise restricts third-party apps, a Box admin must enable the app in the **Admin Console** under **Integrations**.

## Install the plugin in Vev

1. In Vev, open **Account settings** > **Integrations** and select **Box**.
2. Enter the Box **Client ID** and **Client Secret**.
3. Copy the callback URL from the install form. Do not construct this URL manually.
4. In the Box Developer Console, on the **Configuration** tab, add the callback URL under **OAuth 2.0 Redirect URIs**. Select **Save Changes**.
5. Complete the install in Vev.

## Connect a Box account

Each editor user does these steps once.

1. Open a project in the Vev editor and open the asset panel.
2. Select the **Box** source and select **Connect**.
3. In the popup, log in to Box and select **Grant access to Box**.
4. If the browser blocks the popup, allow popups for the editor and select **Connect** again.

The editor shows the connected Box login. To use another Box account, disconnect and connect again.
If the connection expires, select **Reconnect**.

## Local development

Run these commands from this directory.

1. In the Box Developer Console, open the app and select **Generate Developer Token** on the **Configuration** tab. The token is valid for 60 minutes.
2. Create `box/.env` with the token. Do not use quotes. The repository `.gitignore` excludes `.env`.

   ```dotenv
   VEV_DEV_ACCESS_TOKEN=replace-with-box-developer-token
   ```

3. Start the plugin:

   ```sh
   npm install
   vev start
   ```

The local server injects the token into `ctx.auth`. Local tests cover search, thumbnails, and the picker page.
They do not cover the OAuth popup, token refresh, or image import. Use a deployed development install for those checks.
When the token expires, generate a new one, update `.env`, and restart `vev start`.

OAuth support requires a Vev CLI with wrapper protocol version `1`.
`vev build` writes `"wrapperVersion": 1` to `.vev/build/editor-plugin/boxassetsource/manifest.json` when the CLI supports OAuth.

## Box API calls

| Purpose                     | Endpoint                                                         |
| --------------------------- | ---------------------------------------------------------------- |
| Search images               | `GET /2.0/search?type=file&file_extensions=jpg,jpeg,png,gif,webp` |
| Recent images (empty search) | `GET /2.0/recent_items`                                         |
| Folder listing (picker)     | `GET /2.0/folders/{id}` and `GET /2.0/folders/{id}/items`        |
| Thumbnail                   | `GET /2.0/files/{id}/thumbnail.png?min_width=160&min_height=160` |
| Download (Vev import)       | `GET /2.0/files/{id}/content`, 302 to `dl.boxcloud.com`          |
| Connection label            | `GET /2.0/users/me` (`login` field)                              |
| Disconnect                  | `POST /oauth2/revoke`                                            |

## Limits

- Images only. Vev does not support authenticated video, audio, or document imports.
- Maximum file size is 50 MB. The plugin hides larger files.
- Search and recent items return up to 30 images. A picker folder shows up to 200 items.
- Imported images are public on the Vev CDN. Box permissions do not apply to the copies.
- Disconnecting Box does not remove images that are already in a project.

## Troubleshooting

| Symptom                                     | Action                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| Box shows `redirect_uri_mismatch`           | Copy the callback URL from the Vev install form into the Box app again.          |
| Box shows `unauthorized_client`             | A Box admin must enable the app for the enterprise.                              |
| Box shows `invalid_scope`                   | Enable the read and write scopes in the Box app.                                 |
| `vev deploy` fails with `oauth_reinstall_required` | The OAuth config changed (for example, scopes). Uninstall the plugin in Vev, deploy, and install it again. |
| Import fails with `oauth_invalid_image`     | Box refused the download. Enable the write scope, then disconnect and connect.   |
| `oauth_expired`                             | Select **Reconnect** in the editor.                                              |
| `oauth_asset_host_denied` on import         | Box redirected to a host not in `assetRedirectHosts`. Add the host and redeploy. |
| Picker window shows `oauth_required`        | The picker session expired. Close the window and open the picker again.          |
| No thumbnails                               | Box has not generated the thumbnail yet. Search again later.                     |

## Icons

- `assets/box-icon.svg` — square app icon. `src/icon.ts` contains the same SVG as a data URI for the manifest.
- `assets/box-icon.png` — 256 × 256 PNG of the square icon.
- `assets/box-logo.svg` — Box wordmark.

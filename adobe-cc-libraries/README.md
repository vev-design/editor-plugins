# Adobe CC Libraries asset source editor plugin

This plugin adds graphics from Adobe Creative Cloud Libraries to the Vev editor asset panel.
Each Vev user connects their own Adobe account through OAuth 2.0.
The account that installs the plugin supplies its own Adobe app client ID and client secret.

Users can find images in two ways:

- **Asset panel search.** An empty search shows the most recently changed graphics. A search term searches all libraries that the user can open.
- **Picker window.** The user opens the picker from the asset panel, selects a library, searches, and selects an image.

The plugin imports **Graphics** elements (`application/vnd.adobe.element.image+dcx`): PNG, JPEG, SVG, PSD, AI, and other graphics.
Vev imports the full-size PNG rendition of each graphic and copies it to the project CDN.
Colors, character styles, and other element types are not shown.

For customer setup steps, see [SETUP.md](SETUP.md). For the general platform guide, see [OAuth editor plugins](../docs/oauth.md).

## How OAuth works

Vev keeps all secrets on the server. The browser never receives the Adobe access token.

```
 Account admin                 Vev                              Adobe
 ─────────────                 ───                              ─────
 1. Install plugin ──────────► stores client ID + secret
    (client ID, secret)        shows callback URL
 2. Copy callback URL ─────────────────────────────────────────► Redirect URI pattern in Adobe app

 Editor user
 ───────────
 3. Select "Connect" ────────► opens popup ──────────────────► ims-na1.adobelogin.com/ims/authorize/v2
 4. Log in, allow access ◄─────────────────────────────────────── consent screen
                               callback ◄───────────────────── ?code=…
                               exchanges code at /ims/token/v3
                               stores access + refresh token for this user
 5. Search / picker ─────────► gateway ─► plugin handler (ctx.auth.accessToken) ─► cc-libraries.adobe.io
                               ◄──────── asset list + data-URI thumbnails
 6. Select image ────────────► downloads cc-api-storage.adobe.io/…/:rendition?api_key=…
                               uploads to Vev CDN
```

Important points:

- `clientCredentials: 'install'` means the account admin enters the Adobe app credentials in the Vev install form. The plugin code and manifest contain no credentials.
- The Vev-owned Adobe Developer Console does not offer the Creative Cloud Libraries API (checked on 2026-09-28). For this reason, each customer creates the Adobe app in their own Adobe organization.
- Adobe requires the client ID as `x-api-key` on every API call. Adobe IMS access tokens are JWTs with a `client_id` claim. The handler reads the client ID from the token, so each installation uses its own client ID without a setting.
- Vev sends only `Authorization: Bearer` when it imports an image. Adobe also accepts the client ID as the `api_key` query parameter, so the import URL contains `api_key`. The client ID is a public identifier. The client secret never leaves the Vev backend.
- `connection: 'user'` means each Vev user has a separate Adobe login. Users see only their own libraries and libraries that other users share with them.
- Adobe access tokens expire after 24 hours. When Adobe returns `401`, the handler returns `401` with `x-vev-oauth-error: invalid_token`. Vev then uses the refresh token, gets a new access token, and retries the request once.
- Adobe returns a refresh token only with the `offline_access` scope. Adobe rotates the refresh token on each refresh. Adobe documents that a refresh token can be used for up to 14 days after the user logs in. After that, the user selects **Reconnect**.
- The handler loads thumbnails on the server and returns them as `data:` URIs. It sends the token only to `cc-api-storage.adobe.io`.
- The picker page runs on the plugin's Deno origin. Vev sets a 30-minute HttpOnly session cookie. The page sends the selected asset to the editor with `window.opener.postMessage`, only to `https://editor.vev.design` and `https://dev.vev.design`.

## Set up the Adobe app

The customer does these steps once. [SETUP.md](SETUP.md) contains the same steps for customers.

1. Open the [Adobe Developer Console](https://developer.adobe.com/console). Log in with an Adobe account in the customer's Adobe organization.
2. Select **Create new project**. Select **Edit project** and name it `Vev`.
3. Select **Add to Project** > **API** > **Creative Cloud Libraries**. Select **Next**.
4. Select **User Authentication** > **OAuth Web App**. Select **Next**.
5. Enter the redirect URIs. You copy them from the Vev install form (see below):
   - **Default redirect URI:** the callback URL.
   - **Redirect URI pattern:** the callback URL as a regex. Put a backslash before each dot, for example `https://example\.com/callback`.
6. Select **Save configured API**.
7. Copy the **Client ID** and **Client Secret**.

The project starts with the status **In Development**. Only beta users can log in.
Add each Vev user's Adobe email on the project's **Beta users** page.
If Adobe blocks company accounts, the customer submits the project for Adobe review on its **Approval** page.

## Install the plugin in Vev

1. In Vev, open **Account settings** > **Editor plugins** and select **Adobe CC Libraries**.
2. Copy the callback URL from the install form. Do not construct this URL manually.
3. In the Adobe Developer Console, add the callback URL to the OAuth Web App credential (step 5 above). Select **Save**.
4. In Vev, enter the Adobe **Client ID** and **Client Secret**. Complete the install.

## Local development

Run these commands from this directory.

1. Add `https://localhost/callback` to the Adobe app's redirect URI pattern.
2. Open this URL in a browser, with your client ID. Log in with a beta user.

   ```
   https://ims-na1.adobelogin.com/ims/authorize/v2?client_id=CLIENT_ID&response_type=code&redirect_uri=https://localhost/callback&scope=openid,AdobeID,creative_sdk,profile,address,email,cc_files,cc_libraries,offline_access
   ```

3. The browser opens `https://localhost/callback?code=…`. The page does not load. Copy the `code` value from the address bar.
4. Exchange the code for an access token:

   ```sh
   curl -s -u "CLIENT_ID:CLIENT_SECRET" \
     -d grant_type=authorization_code -d code=CODE \
     https://ims-na1.adobelogin.com/ims/token/v3
   ```

5. Create `adobe-cc-libraries/.env` with the `access_token` value. Do not use quotes. The repository `.gitignore` excludes `.env`.

   ```dotenv
   VEV_DEV_ACCESS_TOKEN=replace-with-adobe-access-token
   ```

6. Start the plugin:

   ```sh
   npm install
   vev start
   ```

The local server injects the token into `ctx.auth`. Local tests cover search, thumbnails, and the picker page.
They do not cover the OAuth popup, token refresh, or image import. Use a deployed development install for those checks.
The token is valid for 24 hours. After that, repeat steps 2 to 5 and restart `vev start`.

OAuth support requires a Vev CLI with wrapper protocol version `1` (`@vev/cli` 2.2.0 or later).
`vev build` writes `"wrapperVersion": 1` to `.vev/build/editor-plugin/adobecclibraries/manifest.json`.

## Adobe API calls

| Purpose                    | Endpoint                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| Search and recent graphics | `POST cc-libraries.adobe.io/api/v1/search`                                 |
| Library list (picker)      | `GET cc-libraries.adobe.io/api/v1/libraries?owner=all`                     |
| Library graphics (picker)  | `GET cc-libraries.adobe.io/api/v1/libraries/{id}` and `/elements?type=…`   |
| Thumbnail                  | `GET cc-api-storage.adobe.io/assets/adobe-libraries/…/:rendition;size=…`   |
| Download (Vev import)      | `GET cc-api-storage.adobe.io/assets/adobe-libraries/…/:rendition?api_key=` |
| Connection label           | `GET ims-na1.adobelogin.com/ims/userinfo/v2` (`email` field)               |
| Disconnect                 | `POST ims-na1.adobelogin.com/ims/revoke`                                   |

## Limits

- Graphics only. Vev imports every graphic as a PNG rendition.
- Maximum file size is 50 MB.
- Search and recent graphics return up to 30 images. The picker shows up to 100 libraries, 100 images for each library, and 60 search results.
- Imported images are public on the Vev CDN. Adobe permissions do not apply to the copies.
- Disconnecting Adobe does not remove images that are already in a project.
- Users may need to reconnect every 14 days.

## Troubleshooting

| Symptom                                                   | Action                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| No **Creative Cloud Libraries** card in the Adobe console | Adobe does not offer the API to this Adobe organization. Contact Adobe support.      |
| Adobe shows a redirect URI error                          | Copy the callback URL from the Vev install form into the Adobe credential again.     |
| Adobe shows a "development" notice                        | The Adobe app is not reviewed. Only beta users can log in.                           |
| A user cannot log in to Adobe                             | Add the user's Adobe email as a beta user, or submit the Adobe project for review.   |
| `oauth_credentials_missing`                               | Reinstall the plugin with the Adobe client ID and client secret.                     |
| `vev deploy` fails with `oauth_reinstall_required`        | The OAuth config changed. Uninstall the plugin in Vev, deploy, and install it again. |
| `oauth_expired`                                           | Select **Reconnect** in the editor.                                                  |
| `oauth_asset_host_denied` on import                       | Adobe redirected to a host not in `assetRedirectHosts`. Add the host and redeploy.   |
| Picker window shows `oauth_required`                      | The picker session expired. Close the window and open the picker again.              |
| `403 Api Key is invalid`                                  | The Adobe project does not have the Creative Cloud Libraries API.                    |

## Icons

- `assets/cc-libraries-icon.svg` — square app icon. `src/icon.ts` contains the same SVG as a data URI for the manifest.
- The icon is a neutral placeholder. Replace it with an approved Adobe logo when Adobe's brand guidelines permit.

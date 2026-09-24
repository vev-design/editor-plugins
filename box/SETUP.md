# Connect Box to Vev

With the Box plugin, you can use images from Box in the Vev editor.
An account admin sets up the plugin once. Then each user connects their own Box account.

## How it works

- Your company creates a Box app. Vev uses that app to ask Box for access.
- Each user logs in to Box and approves access. Vev stores the access on its servers. The user's browser never gets the Box access token.
- Users see only the Box files that their own Box account can open.
- When a user selects an image, Vev copies it to your project. The copy is public on the Vev CDN. Box permissions do not apply to the copy.
- The plugin supports JPEG, PNG, GIF and WebP images up to 50 MB.

## 1. Create the Box app (Box admin or developer)

1. Open the [Box Developer Console](https://app.box.com/developers/console).
2. Select **Create Platform App** > **Custom App**.
3. Enter a name, for example `Vev`.
4. For the authentication method, select **User Authentication (OAuth 2.0)**. Select **Create App**.
5. On the **Configuration** tab, under **Application Scopes**, select these two scopes:
   - **Read all files and folders stored in Box**
   - **Write all files and folders stored in Box**. Box requires this scope for downloads. Vev does not change or upload files in Box.
6. Select **Save Changes**.
7. Copy the **Client ID** and the **Client Secret**.

If your Box enterprise restricts third-party apps, a Box admin must enable the app in the Box **Admin Console**.

## 2. Install the plugin in Vev (Vev account admin)

1. In Vev, open **Account settings** > **Editor plugins** and select **Box**.
2. Copy the **OAuth callback URL**.
3. In the Box Developer Console, open your app. On the **Configuration** tab, add the URL under **OAuth 2.0 Redirect URIs**. Select **Save Changes**.
4. In Vev, enter the **Client ID** and **Client Secret**. Select **Connect**.

## 3. Connect your Box account (each user)

1. Open a project in the Vev editor and open the **Images** panel.
2. Select the Box icon next to the search field.
3. Log in to Box and select **Grant access to Box**.

After you connect, the Box icon opens a window where you can search Box and open folders. Select an image to add it to the project.
Box images also appear in the **Images** panel search.

If your browser blocks the login window, allow popups for the Vev editor and try again.
If the connection expires, select the Box icon again to reconnect.
To disconnect, open **Account settings** > **Editor plugins** > **Box**.

## Troubleshooting

| Problem                           | Solution                                                                   |
| --------------------------------- | -------------------------------------------------------------------------- |
| Box shows `redirect_uri_mismatch` | Copy the callback URL from Vev into the Box app again.                     |
| Box shows `invalid_scope`         | Enable the read and write scopes in the Box app.                           |
| Box shows `unauthorized_client`   | A Box admin must enable the app in the Box Admin Console.                  |
| The image import fails            | Check the write scope. Then disconnect and connect your Box account again. |

# Connect Adobe Creative Cloud Libraries to Vev

With the Adobe CC Libraries plugin, you can use graphics from your Creative Cloud Libraries in the Vev editor.
An account admin sets up the plugin once. Then each user connects their own Adobe account.

## How it works

- Your company creates an Adobe app. Vev uses that app to ask Adobe for access.
- Each user logs in to Adobe and allows access. Vev stores the access on its servers. The user's browser never gets the Adobe access token.
- Users see their own libraries and libraries that other users share with them.
- When a user selects a graphic, Vev copies it to your project as a PNG image. The copy is public on the Vev CDN. Adobe permissions do not apply to the copy.
- The plugin shows **Graphics** from your libraries. It does not show colors, character styles, or other element types.

## 1. Create the Adobe app (Adobe admin or developer)

1. Open the [Adobe Developer Console](https://developer.adobe.com/console). Log in with your company Adobe account.
2. Select **Create new project**. Then select **Edit project** and name the project `Vev`.
3. Select **Add to Project** > **API**. Select **Creative Cloud Libraries**, then **Next**.
4. Select **User Authentication** > **OAuth Web App**, then **Next**.
5. Keep this page open. You need the callback URL from Vev in the next part.

If you cannot find **Creative Cloud Libraries** in the list, contact Adobe support. Adobe does not offer the API to all organizations.

## 2. Install the plugin in Vev (Vev account admin)

1. In Vev, open **Account settings** > **Editor plugins** and select **Adobe CC Libraries**.
2. Copy the **OAuth callback URL**.
3. In the Adobe Developer Console, enter the callback URL in two fields:
   - **Default redirect URI:** paste the URL.
   - **Redirect URI pattern:** paste the URL. Then put a backslash (`\`) before each dot. For example, `https://example.com/callback` becomes `https://example\.com/callback`.
4. Select **Save configured API**.
5. Copy the **Client ID** and the **Client Secret** from the Adobe credential page.
6. In Vev, enter the **Client ID** and **Client Secret**. Select **Connect**.

## 3. Give users access (Adobe admin or developer)

A new Adobe project has the status **In Development**. Only beta users can log in.

1. In the Adobe Developer Console, open the `Vev` project.
2. Open **Beta users**. Add the Adobe email of each Vev user.

If Adobe blocks company accounts, submit the project for Adobe review on its **Approval** page. Adobe's target is 10 business days.

## 4. Connect your Adobe account (each user)

1. Open a project in the Vev editor and open the **Images** panel.
2. Select the Adobe CC Libraries icon next to the search field.
3. Log in to Adobe and allow access.

After you connect, the icon opens a window with your libraries. Select a library, or search. Select a graphic to add it to the project.
Graphics also appear in the **Images** panel search.

If your browser blocks the login window, allow popups for the Vev editor and try again.
Adobe can end the connection after 14 days. Then select the icon again to reconnect.
To disconnect, open **Account settings** > **Editor plugins** > **Adobe CC Libraries**.

## Troubleshooting

| Problem                                                   | Solution                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| No **Creative Cloud Libraries** card in the Adobe console | Contact Adobe support. Ask for access to the Creative Cloud Libraries API.                            |
| Adobe shows a redirect URI error                          | Copy the callback URL from Vev into the Adobe credential again. Check the backslashes in the pattern. |
| A user cannot log in to Adobe                             | Add the user's Adobe email as a beta user. Or submit the Adobe project for review.                    |
| A library does not show graphics                          | The plugin shows only Graphics. Add the image to the library as a graphic.                            |
| The connection stopped working                            | Select the icon again and log in to Adobe.                                                            |

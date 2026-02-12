export function getAssetPicker(): Response {
  const htmlResponse = `
<html>
<head>
  <script src="https://unpkg.com/@frontify/frontify-finder/dist/index.js"></script>
</head>
<body>
<button id="open-finder">Open Frontify Finder</button>
<div id="modalId"></div>
<script>
  function openFrontifyFinder() {
    window.FrontifyFinder.create({
      clientId: 'frontify-finder',
      domain: 'developer-sandbox-verdensvev.frontify.com',
      options: {
        allowMultiSelect: true,
      },
    })
      .then((finder) => {
        console.log('finder', finder);

        finder.onAssetsChosen((assets) => {
          parent.postMessage({ type: 'pickAsset', assets }, '*');
        });

        finder.onCancel(() => {
          parent.postMessage({ type: 'cancel', assets }, '*');
        });

        finder.mount(document.getElementById('assetPickerId'));
      })
      .catch((error) => {
        console.error('Frontify Finder closed or failed:', error);
      });
  }
  document.getElementById("open-finder").addEventListener('click', openFrontifyFinder, false);
</script>
</body>
</html>
  `;
  return new Response(htmlResponse, {
    headers: { 'content-type': 'text/html' },
  });
}

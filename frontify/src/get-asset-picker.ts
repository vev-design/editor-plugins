export function getAssetPicker(domain: string): Response {
  console.log('Returning picker domain: ', domain);
  const htmlResponse = `<html>
<head>
  <script src="https://unpkg.com/@frontify/frontify-finder/dist/index.js"></script>
  <style>
      *, html, body { margin: 0; padding: 0; box-sizing: border-box; }
      body { overflow: hidden; }
      #mounter { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: none; }
      #open-finder { display: block; }
  </style>
</head>
<body>
<div id="mounter"></div>
<script>
  function mapAssetToVevImageAsset(asset) {
    return {
      key: asset.id,
      filename: asset.filename,
      url: asset.downloadUrl,
      thumb: asset.previewUrl,
      updated: Date.now(),
      dimension: { width: asset.width, height: asset.height },
      mimeType: "image/" + asset.extension,
      metaData: {
        description: asset.description || '',
        width: "" + asset.width,
        height: "" + asset.height,
    },
      selfHosted: false,
  };
  }

  function openFrontifyFinder() {
    document.getElementById('mounter').style.display = 'block';
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
          console.log('assets', assets);
          window.opener.postMessage({ type: 'pickAsset', assets: assets.map(mapAssetToVevImageAsset) }, '*');
          window.close();
          document.getElementById('open-finder').style.display = 'block';
          document.getElementById('mounter').style.display = 'none';
        });

        finder.onCancel(() => {
          window.opener.postMessage({ type: 'cancel' }, '*');
          document.getElementById('open-finder').style.display = 'block';
          document.getElementById('mounter').style.display = 'none';
          window.close();
        });

        let mounter = document.getElementById('mounter');
        finder.mount(mounter);
      })
      .catch((error) => {
        console.error('Frontify Finder closed or failed:', error);
        document.getElementById('open-finder').style.display = 'block';
        document.getElementById('mounter').style.display = 'none';
        window.opener.postMessage({ type: 'cancel' }, '*');
      });
  }
  openFrontifyFinder();
</script>
</body>
</html>
`;
  return new Response(htmlResponse, {
    headers: { 'content-type': 'text/html' },
  });
}

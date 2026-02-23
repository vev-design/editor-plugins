export function getAssetPicker(insertData: {
  assetInsert: string;
  auth: {
    type: string;
    consumerId: string;
    consumerSecret: string;
    clientDb: string;
    username: string;
    password: string;
  };
}): Response {
  const htmlResponse = `<html>
<head>
  <style>*, html, body { margin: 0; padding: 0; box-sizing: border-box; }</style>
  <style>#loader {}</style>
</head>
<body>
<div id="loader">Loading....</div>
<script>
function mapAssetToVevImageAsset(asset) {
  return {
    key: asset.GUID,
    filename: asset.title,
    url: asset.embed_link,
    thumb: asset.thumbnailUrlCdn,
    updated: Date.now(),
    dimension: { width: asset.pixelWidth, height: asset.pixelHeight },
    mimeType: asset.mimetype,
    metaData: {
      description: asset.extendedKeywords || '',
      width: asset.pixelWidth + '',
      height: asset.pixelHeight + '',
    },
    selfHosted: false,
  };
}

window.initBwkzAssetInsert = () => {
  const obj = {
    auth: {
      type: 'internal',
      consumerId: '${insertData.auth.consumerId}',
      consumerSecret: '${insertData.auth.consumerSecret}',
      clientDb: '${insertData.auth.clientDb}',
      username: '${insertData.auth.username}',
      password: '${insertData.auth.password}',
    },
  };
  
  document.querySelector('#loader')?.remove();
  
  return obj;
};

  window.finishBwkzAssetInsert = (response) => {
    const assets = response.data.map(mapAssetToVevImageAsset);
    console.log('assets', assets);
    window.opener.postMessage({ type: 'pickAsset', assets }, '*');
  };
</script>
<div id="integration">${insertData.assetInsert}</div>
</body>
</html>`;
  return new Response(htmlResponse, {
    headers: { 'content-type': 'text/html' },
  });
}

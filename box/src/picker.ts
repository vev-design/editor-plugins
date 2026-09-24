import { ProjectImageAsset } from '@vev/utils';
import { mapBoxFilesWithThumbnails } from './asset-mappers';
import { BoxAuthError, BoxClient, BoxItem, isImportableImage } from './client';
import { BOX_ICON } from './icon';

// The picker posts selections only to these exact origins. Other origins drop the message.
const EDITOR_ORIGINS = ['https://editor.vev.design', 'https://dev.vev.design'];

const PICKER_PATH = '/settings/asset_picker';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Safe inside a <script> element: no "</script>" or HTML comment sequences.
function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function pickerUrl(params: Record<string, string>): string {
  return `${PICKER_PATH}?${new URLSearchParams(params).toString()}`;
}

interface PickerView {
  title: string;
  breadcrumb: { id: string; name: string }[];
  folders: BoxItem[];
  images: ProjectImageAsset[];
  query: string;
  folderId: string;
}

async function loadView(client: BoxClient, folderId: string, query: string): Promise<PickerView> {
  if (query) {
    const files = await client.searchImages(query, 60);
    return {
      title: `Results for “${query}”`,
      breadcrumb: [{ id: '0', name: 'All files' }],
      folders: [],
      images: await mapBoxFilesWithThumbnails(client, files),
      query,
      folderId,
    };
  }

  const [folder, items] = await Promise.all([
    client.getFolder(folderId),
    client.listFolder(folderId),
  ]);
  const ancestors = (folder.path_collection?.entries ?? []).map(({ id, name }) => ({
    id,
    name: id === '0' ? 'All files' : name,
  }));
  return {
    title: folder.id === '0' ? 'All files' : folder.name,
    breadcrumb: [...ancestors, { id: folder.id, name: folder.id === '0' ? 'All files' : folder.name }],
    folders: items.filter((item) => item.type === 'folder'),
    images: await mapBoxFilesWithThumbnails(client, items.filter(isImportableImage)),
    query,
    folderId,
  };
}

function renderPage(view: PickerView): string {
  const breadcrumb = view.breadcrumb
    .map((crumb, index) =>
      index === view.breadcrumb.length - 1 && !view.query
        ? `<span>${escapeHtml(crumb.name)}</span>`
        : `<a href="${escapeHtml(pickerUrl({ folder: crumb.id }))}">${escapeHtml(crumb.name)}</a>`,
    )
    .join('<span class="sep">/</span>');

  const folders = view.folders
    .map(
      (folder) => `<a class="folder" href="${escapeHtml(pickerUrl({ folder: folder.id }))}">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  <span>${escapeHtml(folder.name)}</span>
</a>`,
    )
    .join('');

  const images = view.images
    .map(
      (asset, index) => `<button class="image" type="button" data-index="${index}" title="${escapeHtml(asset.filename ?? '')}">
  ${asset.thumb ? `<img src="${escapeHtml(asset.thumb)}" alt="">` : '<div class="nothumb"></div>'}
  <span>${escapeHtml(asset.filename ?? '')}</span>
</button>`,
    )
    .join('');

  const empty =
    !view.folders.length && !view.images.length
      ? `<p class="empty">${view.query ? 'No images match this search.' : 'This folder has no folders or images.'}</p>`
      : '';

  // The editor replaces thumbnails of authenticated assets. Do not send the data URIs back.
  const assets = view.images.map(({ thumb: _thumb, ...asset }) => asset);

  return `<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Box</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #222; background: #fff; }
header { position: sticky; top: 0; z-index: 1; display: flex; gap: 12px; align-items: center; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e8e8e8; }
header img { width: 28px; height: 28px; }
header form { flex: 1; display: flex; gap: 8px; }
header input { flex: 1; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font: inherit; }
button, .btn { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; background: #fff; font: inherit; cursor: pointer; }
button.primary { background: #0061d5; border-color: #0061d5; color: #fff; }
nav { padding: 12px 16px 0; color: #666; }
nav a { color: #0061d5; text-decoration: none; }
nav .sep { margin: 0 6px; color: #aaa; }
main { padding: 12px 16px 24px; }
.folders { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-bottom: 16px; }
.folder { display: flex; gap: 8px; align-items: center; padding: 10px; border: 1px solid #e8e8e8; border-radius: 8px; color: inherit; text-decoration: none; }
.folder:hover { border-color: #0061d5; }
.folder svg { flex: none; width: 20px; height: 20px; fill: #0061d5; }
.folder span, .image span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.images { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.image { display: flex; flex-direction: column; gap: 6px; padding: 6px; text-align: left; border: 2px solid transparent; }
.image:hover, .image:focus { border-color: #0061d5; outline: none; }
.image img, .image .nothumb { width: 100%; aspect-ratio: 1; object-fit: contain; background: #f4f4f4; border-radius: 4px; }
.empty { color: #666; }
</style>
</head>
<body>
<header>
  <img src="${BOX_ICON}" alt="Box">
  <form method="get" action="${PICKER_PATH}">
    <input type="search" name="q" placeholder="Search images in Box" value="${escapeHtml(view.query)}">
    <button class="primary" type="submit">Search</button>
  </form>
  <button type="button" id="cancel">Cancel</button>
</header>
<nav>${breadcrumb}</nav>
<main>
  <h2>${escapeHtml(view.title)}</h2>
  ${folders ? `<div class="folders">${folders}</div>` : ''}
  ${images ? `<div class="images">${images}</div>` : ''}
  ${empty}
</main>
<script>
const assets = ${jsonForScript(assets)};
const origins = ${jsonForScript(EDITOR_ORIGINS)};
function send(message) {
  if (!window.opener) return;
  for (const origin of origins) window.opener.postMessage(message, origin);
}
document.querySelectorAll('.image').forEach((tile) => {
  tile.addEventListener('click', () => {
    const asset = assets[Number(tile.dataset.index)];
    if (asset) send({ type: 'pickAsset', assets: [asset] });
  });
});
document.getElementById('cancel').addEventListener('click', () => send({ type: 'cancel' }));
</script>
</body>
</html>`;
}

function renderError(message: string): string {
  return `<html>
<head><meta charset="utf-8"><title>Box</title>
<style>body { font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }</style>
</head>
<body><p>${escapeHtml(message)}</p><p><a href="${PICKER_PATH}">Open all files</a></p></body>
</html>`;
}

export async function getAssetPicker(client: BoxClient, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const folderId = url.searchParams.get('folder') || '0';
  const query = (url.searchParams.get('q') || '').trim();
  const headers = { 'content-type': 'text/html; charset=utf-8' };

  // Vev discovers the picker with a POST. Answer it without Box requests.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('<html><body>Box picker</body></html>', { headers });
  }

  if (!/^\d+$/.test(folderId)) {
    return new Response(renderError('The folder ID is not valid.'), { status: 400, headers });
  }

  try {
    const view = await loadView(client, folderId, query);
    return new Response(renderPage(view), { headers });
  } catch (e) {
    if (e instanceof BoxAuthError) throw e;
    return new Response(renderError('Box could not load this folder. Try again.'), {
      status: 502,
      headers,
    });
  }
}

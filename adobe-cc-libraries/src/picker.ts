import { ProjectImageAsset } from '@vev/utils';
import { mapElementsWithThumbnails } from './asset-mappers';
import { CcAuthError, CcLibrariesClient, CcLibrary } from './client';
import { CC_LIBRARIES_ICON } from './icon';

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
  const query = new URLSearchParams(params).toString();
  return query ? `${PICKER_PATH}?${query}` : PICKER_PATH;
}

interface PickerView {
  title: string;
  showHomeLink: boolean;
  libraries: CcLibrary[];
  images: ProjectImageAsset[];
  query: string;
  empty: string;
}

async function loadView(
  client: CcLibrariesClient,
  libraryId: string,
  query: string,
): Promise<PickerView> {
  if (query) {
    const elements = await client.searchImages(query, 60);
    return {
      title: `Results for “${query}”`,
      showHomeLink: true,
      libraries: [],
      images: await mapElementsWithThumbnails(client, elements),
      query,
      empty: 'No images match this search.',
    };
  }

  if (libraryId) {
    const [library, elements] = await Promise.all([
      client.getLibrary(libraryId),
      client.listImageElements(libraryId),
    ]);
    return {
      title: library.name,
      showHomeLink: true,
      libraries: [],
      images: await mapElementsWithThumbnails(client, elements),
      query,
      empty: 'This library has no images.',
    };
  }

  return {
    title: 'Libraries',
    showHomeLink: false,
    libraries: await client.listLibraries(),
    images: [],
    query,
    empty: 'You have no Creative Cloud Libraries.',
  };
}

function renderPage(view: PickerView): string {
  const breadcrumb = view.showHomeLink
    ? `<a href="${PICKER_PATH}">Libraries</a><span class="sep">/</span><span>${escapeHtml(view.title)}</span>`
    : '';

  const libraries = view.libraries
    .map(
      (library) => `<a class="library" href="${escapeHtml(pickerUrl({ library: library.id }))}">
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>
  <span>${escapeHtml(library.name)}</span>
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
    !view.libraries.length && !view.images.length
      ? `<p class="empty">${escapeHtml(view.empty)}</p>`
      : '';

  // The editor replaces thumbnails of authenticated assets. Do not send the data URIs back.
  const assets = view.images.map(({ thumb: _thumb, ...asset }) => asset);

  return `<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Adobe CC Libraries</title>
<style>
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #222; background: #fff; }
header { position: sticky; top: 0; z-index: 1; display: flex; gap: 12px; align-items: center; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e8e8e8; }
header img { width: 28px; height: 28px; }
header form { flex: 1; display: flex; gap: 8px; }
header input { flex: 1; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font: inherit; }
button, .btn { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; background: #fff; font: inherit; cursor: pointer; }
button.primary { background: #1473e6; border-color: #1473e6; color: #fff; }
nav { padding: 12px 16px 0; color: #666; }
nav a { color: #1473e6; text-decoration: none; }
nav .sep { margin: 0 6px; color: #aaa; }
main { padding: 12px 16px 24px; }
.libraries { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-bottom: 16px; }
.library { display: flex; gap: 8px; align-items: center; padding: 10px; border: 1px solid #e8e8e8; border-radius: 8px; color: inherit; text-decoration: none; }
.library:hover { border-color: #1473e6; }
.library svg { flex: none; width: 20px; height: 20px; fill: #eb1000; }
.library span, .image span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.images { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.image { display: flex; flex-direction: column; gap: 6px; padding: 6px; text-align: left; border: 2px solid transparent; }
.image:hover, .image:focus { border-color: #1473e6; outline: none; }
.image img, .image .nothumb { width: 100%; aspect-ratio: 1; object-fit: contain; background: #f4f4f4; border-radius: 4px; }
.empty { color: #666; }
</style>
</head>
<body>
<header>
  <img src="${CC_LIBRARIES_ICON}" alt="Adobe CC Libraries">
  <form method="get" action="${PICKER_PATH}">
    <input type="search" name="q" placeholder="Search images in your libraries" value="${escapeHtml(view.query)}">
    <button class="primary" type="submit">Search</button>
  </form>
  <button type="button" id="cancel">Cancel</button>
</header>
<nav>${breadcrumb}</nav>
<main>
  <h2>${escapeHtml(view.title)}</h2>
  ${libraries ? `<div class="libraries">${libraries}</div>` : ''}
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
<head><meta charset="utf-8"><title>Adobe CC Libraries</title>
<style>body { font: 14px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; }</style>
</head>
<body><p>${escapeHtml(message)}</p><p><a href="${PICKER_PATH}">Open all libraries</a></p></body>
</html>`;
}

export async function getAssetPicker(
  client: CcLibrariesClient,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const libraryId = url.searchParams.get('library') || '';
  const query = (url.searchParams.get('q') || '').trim();
  const headers = { 'content-type': 'text/html; charset=utf-8' };

  // Vev discovers the picker with a POST. Answer it without Adobe requests.
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('<html><body>Adobe CC Libraries picker</body></html>', { headers });
  }

  // Library IDs are UUIDs or URNs, for example urn:aaid:sc:US:2f3268e9-….
  if (libraryId && !/^[\w:.-]{1,200}$/.test(libraryId)) {
    return new Response(renderError('The library ID is not valid.'), { status: 400, headers });
  }

  try {
    const view = await loadView(client, libraryId, query);
    return new Response(renderPage(view), { headers });
  } catch (e) {
    if (e instanceof CcAuthError) throw e;
    return new Response(renderError('Adobe could not load this library. Try again.'), {
      status: 502,
      headers,
    });
  }
}

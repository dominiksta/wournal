const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_JSON = JSON.parse(fs.readFileSync('package.json'));
const VERSION = PACKAGE_JSON.version;

// ----------------------------------------------------------------------
// api setup
// ----------------------------------------------------------------------

const API_BASE = 'https://api.github.com';
const UPLOADS_BASE = 'https://uploads.github.com';

const makeApiClient = (url) => async (input, init) => {
  const method = (init && init.method) ? init.method : 'GET';
  const fullUrl = `${url}${input}`;
  const body = (init && init.body) ? init.body : '{}';
  console.log(`[api] ${method}: ${fullUrl} ${body}`);
  const resp = await fetch(
    fullUrl,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...((init && init.headers) ? init.headers : {})
      },
      ...init,
    }
  );
  let ret;
  try { ret = await resp.json(); } catch { ret = ''; }

  if (!resp.status.toString().startsWith('2')) {
    console.error(resp.status);
    console.error(ret);
    throw resp;
  }
  console.log(`[api] -> ${resp.status}`);
  return ret;
};

const releasesApi =
  makeApiClient(`${API_BASE}/repos/dominiksta/wournal/releases`);
const assetsApi =
  makeApiClient(`${API_BASE}/repos/dominiksta/wournal/releases/assets`);
const uploadsApi =
  makeApiClient(`${UPLOADS_BASE}/repos/dominiksta/wournal/releases`);

// ----------------------------------------------------------------------
// api methods
// ----------------------------------------------------------------------

const getReleaseByVer = async (tag) => {
  const resp = await releasesApi('');
  const found = resp.find(r => (r.name ?? '').includes(tag));
  return found === undefined ? undefined : found.id;
}

const getAssets = async (releaseId) =>
  (await releasesApi(`/${releaseId}/assets`, {}))
    .map(a => ({ id: a.id, name: a.name }));

const deleteAsset = (id) => assetsApi(`/${id}`, { method: 'DELETE' });

const uploadAsset = (releaseId, filePath, name, mimeType) =>
  uploadsApi(`/${releaseId}/assets?name=${name}`, {
    method: 'POST',
    body: new Blob([fs.readFileSync(filePath)], { type: mimeType }),
  })

const createRelease = async (tagName) =>
  (await releasesApi('', {
    method: 'POST',
    body: JSON.stringify({
      tag_name: tagName,
      name: tagName,
      draft: true,
      generate_release_notes: false,
    })
  })).id


// ----------------------------------------------------------------------
// detect & rename
// ----------------------------------------------------------------------

const OUT_DIR = './out/make/';

const EXT_MIMETYPES = {
  '.zip'      : 'application/zip',
  '.AppImage' : 'application/octet-stream',
  '.exe'      : 'application/vnd.microsoft.portable-executable',
}

const UPLOAD = {
  'zip/linux/x64/Wournal-linux-x64-<<VER>>.zip' : 'Wournal-GNU-Linux-Portable-<<VER>>.zip',
  'zip/win32/x64/Wournal-win32-x64-<<VER>>.zip' : 'Wournal-Windows-Portable-<<VER>>.zip',
  'AppImage/x64/Wournal-<<VER>>-x64.AppImage'   : 'Wournal-GNU-Linux-<<VER>>.AppImage',
  'nsis/x64/Wournal Setup <<VER>>.exe'          : 'Wournal-Windows-Setup-<<VER>>.exe',
};

async function main() {
  let releaseId = await getReleaseByVer(VERSION);
  if (releaseId === undefined) {
    console.log('creating new release');
    releaseId = await createRelease(VERSION);
  } else {
    console.log('using existing release, deleting existing assets');
  }

  for (const toUpload in UPLOAD) {
    const filePath = OUT_DIR + toUpload.replace('<<VER>>', VERSION);
    const uploadName = UPLOAD[toUpload].replace('<<VER>>', VERSION);
    console.log(`Looking for ${filePath}`);
    if (fs.existsSync(filePath)) {

      console.log(`Found ${filePath}`);
      const alreadyUploaded = (await getAssets(releaseId)).find(
        a => a.name === uploadName
      );
      if (alreadyUploaded !== undefined) {
        console.log('Existing asset found, deleting');
        await deleteAsset(alreadyUploaded.id);
      }

      const mimeType = EXT_MIMETYPES[path.extname(filePath)];
      console.log(`Uploading as ${uploadName} (${mimeType})`);
      await uploadAsset(releaseId, filePath, uploadName, mimeType);
      console.log(`Finished uploading ${uploadName}`);

    }
  }
}

main();

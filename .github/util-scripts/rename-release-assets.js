const { readFileSync } = require('node:fs');

// ----------------------------------------------------------------------
// api setup
// ----------------------------------------------------------------------

const API_BASE = 'https://api.github.com';

const makeApiClient = (url) => async (input, init) => {
  const method = (init && init.method) ? init.method : 'GET';
  const fullUrl = `${API_BASE}${url}${input}`;
  const body = (init && init.body) ? init.body : '{}';
  console.log(`[api] ${method}: ${fullUrl} ${body}`);
  const resp = await fetch(
    fullUrl,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      ...init,
    }
  );
  let ret;
  try { ret = await resp.json(); } catch { ret = ''; }

  if (!resp.status.toString().startsWith('2')) {
    console.error(resp.status);
    console.error(json);
    throw resp;
  }
  console.log(`[api] -> ${JSON.stringify(ret)}`);
  return ret;
};

const releasesApi = makeApiClient('/repos/dominiksta/wournal/releases');
const assetsApi = makeApiClient('/repos/dominiksta/wournal/releases/assets');

// ----------------------------------------------------------------------
// api methods
// ----------------------------------------------------------------------

const getReleaseByVer = async (tag) =>
  (await releasesApi('')).find(r => r.name.includes(tag)).id;

const getAssets = async (releaseId) =>
  (await releasesApi(`/${releaseId}/assets`, {}))
    .map(a => ({ id: a.id, name: a.name }));

const renameAsset = (assetId, name) =>
  assetsApi(`/${assetId}`, {
    method: 'PATCH', body: JSON.stringify({ name })
  });

const deleteAsset = (id) => assetsApi(`/${id}`, { method: 'DELETE' });

// ----------------------------------------------------------------------
// detect & rename
// ----------------------------------------------------------------------

const RENAME = {
  'Wournal-<<VER>>-x64.AppImage'  : 'Wournal-Linux-<<VER>>.AppImage',
  'Wournal-linux-x64-<<VER>>.zip' : 'Wournal-Linux-<<VER>>.zip',
  'Wournal-win32-x64-<<VER>>.zip' : 'Wournal-Windows-<<VER>>.zip',
  'Wournal.Setup.<<VER>>.exe'     : 'Wournal-Windows-Setup-<<VER>>.exe',
};

const DELETE = [ 'latest.yml' ];

async function main() {
  const packageJson = JSON.parse(readFileSync('package.json'));
  const version = packageJson.version;

  const releaseId = await getReleaseByVer(version);
  const availableAssets = await getAssets(releaseId);

  avail: for (const asset of availableAssets) {
    const { name, id } = asset;
    console.log(`Considering asset ${id}: ${name}`);

    for (const toRename in RENAME) {
      if (name === toRename.replace('<<VER>>', version)) {
        const newName = RENAME[toRename].replace('<<VER>>', version);
        console.log(`Renaming ${name} -> ${newName}`);
        await renameAsset(id, newName);
        continue avail;
      }
    }

    for (const toDelete of DELETE) {
      if (name === toDelete.replace('<<VER>>', version)) {
        console.log(`Deleting ${name}`);
        await deleteAsset(id);
        continue avail;
      }
    }

    console.log(`Asset ${name} was not renamed`);
  }
}

main();

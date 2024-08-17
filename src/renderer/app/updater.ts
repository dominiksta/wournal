import { Component, rx, h } from "@mvuijs/core";
import { OpenDialog } from 'common/dialog-manager';
import * as ui5 from '@mvuijs/ui5';
import PackageJson from 'PackageJson';
import { sanitize } from "dompurify";
import { marked } from "marked";
import { getLogger } from "Shared/logging";

const GITHUB_REPO_NAME = 'dominiksta/wournal';
const REMIND_AFTER_DAYS = 2;

const LOG = getLogger('updater');

export async function checkDisplayUpdates(
  openDialog: OpenDialog,
  releases?: Release[],
  forceShow: boolean = false,
) {
  if (releases === undefined) {
    const resp = await getGithubReleases();
    if (resp === false) return;
    releases = resp;
  }
  if (!forceShow) {
    if (compareVersionStrings(PackageJson.version, releases[0].ver) >= 0) return;
    if (
      (LastAnnoyed.get().getTime() / 1000) >
      ((Date.now() / 1000) - 60 * 60 * 24 * REMIND_AFTER_DAYS)
    ) return;
    LastAnnoyed.set(new Date());
  }

  const mdtohtml = (md: string) => sanitize(marked.parse(md) as string);

  openDialog(close => ({
    heading: 'Update Available',
    buttons: [
      {
        name: 'Update', design: 'Emphasized', icon: 'download', action: () => {
          window.open(releases[0].url);
          close();
        },
      },
      { name: 'Remind Me Later', design: 'Default', icon: 'future', action: () => close() },
    ],
    content: [
      h.p(
        'An update for Wournal is available. Please consider upgrading to ' +
        'benefit from new features and security updates.'
      ),
      h.h4(releases[0].name),
      // h.p({ fields: { innerHTML: mdtohtml(releases[0].descMd) } }),
      ui5.panel(
        { fields: { headerText: 'Changelog', collapsed: true } },
        releases.map(r => h.section(
          { classes: { 'changelog-release': true } },
          [
            h.h2(r.name),
            h.i(r.published.toLocaleString()),
            h.p({ fields: { innerHTML: mdtohtml(r.descMd) }})
          ]
        ))
      ),
    ],
    state: 'Information',
  }));
}

const LastAnnoyed = {
  _name: 'wournal_update_last_annoyed',

  get(): Date {
    const inls = localStorage.getItem(this._name);
    if (inls === null) localStorage.setItem(this._name, '0');
    return new Date(parseInt(localStorage.getItem(this._name)));
  },
  set(d: Date) {
    localStorage.setItem(this._name, d.getTime().toString());
  }
}

type Release = {
  ver: string,
  name: string,
  url: string,
  descMd: string,
  published: Date,
}

export function compareVersionStrings(va: string, vb: string): number {
  console.assert(va.split('.').length === 3);
  console.assert(vb.split('.').length === 3);

  const [va1, va2, va3] = va.split('.').map(s => parseInt(s));
  const [vb1, vb2, vb3] = vb.split('.').map(s => parseInt(s));

  if (va1 === vb1 && va2 === vb2 && va3 === vb3) return 0;
  if (va1 >= vb1 && va2 >= vb2 && va3 >= vb3) return 1;
  else return -1;
}

export async function getGithubReleases(): Promise<Release[] | false> {
  LOG.info('Fetching Github releases');
  let resp: Response;
  try {
    resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO_NAME}/releases`);
    if (resp.status !== 200) {
      LOG.warn('HTTP ' + resp.status, resp);
      return false;
    }
  } catch (e) {
    LOG.warn('HTTP Error', e);
    return false;
  }

  const releases: Release[] =
    (await resp.json()).map((r: any) => ({
      ver: r.tag_name,
      name: r.name,
      url: r.html_url,
      descMd: r.body,
      published: new Date(r.published_at),
    }));

  const ret = releases.sort((a, b) => compareVersionStrings(a.ver, b.ver)).reverse();
  LOG.info(
    `Got latest release: ${releases[0].ver}, ` +
    `current version: ${PackageJson.version}`
  );
  return ret;
}

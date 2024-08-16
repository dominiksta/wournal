import { getLogger } from "Shared/logging";

type LastPagesT = { fileName: string, pageNr: number }[];
type LastPagesParsedT = Map<string, number>;
const LAST_PAGES_LS_KEY = 'wournal-last-pages';
const STORE_MAX = 300;

const LOG = getLogger(__filename);

export const LastPages = {
  read() {
    LOG.info('Reading last pages');
    const inStorage = localStorage.getItem(LAST_PAGES_LS_KEY);

    if (inStorage === null) LAST_PAGES = [];
    else LAST_PAGES = JSON.parse(inStorage);

    for (const page of LAST_PAGES)
      LAST_PAGES_PARSED.set(page.fileName, page.pageNr);
  },

  write(): void {
    LOG.info('Writing last pages');
    localStorage.setItem(
      LAST_PAGES_LS_KEY, JSON.stringify(LAST_PAGES, null, 2)
    );
  },

  get(fileName: string): number | false {
    LastPages.read();
    const ret = LAST_PAGES_PARSED.has(fileName)
      ? LAST_PAGES_PARSED.get(fileName) : false;
    LOG.info(`Got last page ${fileName}: ${ret}`);
    return ret;
  },

  set(fileName: string, pageNr: number): void {
    LOG.info(`Setting last page ${fileName}: ${pageNr}`);
    LAST_PAGES.push({ fileName, pageNr });
    LAST_PAGES_PARSED.set(fileName, pageNr);
    if (LAST_PAGES.length > STORE_MAX) LAST_PAGES.splice(0, 1);
  },
}

let LAST_PAGES: LastPagesT = [];
let LAST_PAGES_PARSED: LastPagesParsedT = new Map();
LastPages.read();

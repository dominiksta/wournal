import { ApiClient } from "electron-api-client";

const LOCALSTORAGE_KEY = 'wournal_recent_files';
const KEEP_FILES = 10;

function ensure() {
  if (localStorage.getItem(LOCALSTORAGE_KEY) == null) {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify([]));
  }
}

const RecentFiles = {
  getPaths(): string[] {
    ensure();
    const paths = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY));
    if (!(paths instanceof Array))
      throw new Error(localStorage.getItem(LOCALSTORAGE_KEY));
    return paths;
  },

  add(path: string): void {
    ensure();
    const paths = this.getPaths();

    if (paths.includes(path)) { // move to front
      paths.splice(paths.indexOf(path), 1);
      paths.unshift(path);
    } else { // insert in front and maybe drop old
      paths.unshift(path);
      paths.splice(KEEP_FILES);
    }

    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(paths));
    ApiClient["shell:addRecentDocument"](path);
  },
}

export default RecentFiles;

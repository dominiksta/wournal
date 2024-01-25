import { ApiClient } from "electron-api-client";
import FileSystem from "./FileSystem";

const FileSystemElectron: FileSystem = {
  async write(path, blob) {
    return await ApiClient['file:write'](path, await blob.arrayBuffer());
  },

  async read(path) {
    const resp = await ApiClient['file:read'](path);
    if (!resp) return false;
    return new Blob([ resp ]);
  },

  async loadPrompt(filters) {
    return await ApiClient["file:loadPrompt"](filters);
  },

  async savePrompt(defaultPath, filters) {
    return await ApiClient["file:savePrompt"](defaultPath, filters);
  },

  async exists(path: string) { return await ApiClient['file:exists'](path) },
  async mkdir(path: string) { return await ApiClient['file:mkdir'](path) },
  async ls(path: string) { return await ApiClient['file:ls'](path) },
  async rm(path: string) { return await ApiClient['file:rm'](path) },
}

export default FileSystemElectron;

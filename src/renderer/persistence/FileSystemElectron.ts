import { ApiClient } from "electron-api-client";
import FileSystem from "./FileSystem";

const FileSystemElectron: FileSystem = {
  async write(path, blob) {
    return await ApiClient['file:write'](path, await blob.arrayBuffer());
  },

  async read(path) {
    return new Blob([ await ApiClient['file:read'](path) ]);
  },

  async loadPrompt(filters) {
    return await ApiClient["file:loadPrompt"](filters);
  },

  async savePrompt(defaultPath, filters) {
    return await ApiClient["file:savePrompt"](defaultPath, filters);
  },
}

export default FileSystemElectron;

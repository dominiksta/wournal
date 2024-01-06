import { ApiClient } from "electron-api-client";
import SystemClipboard from "./SystemClipboard";

export const SystemClipboardElectron: SystemClipboard = {

  async writeWournal(dto) { ApiClient["clipboard:writeWournal"](dto) },

  async readText() { return ApiClient["clipboard:readText"]() },
  async readImage() { return ApiClient["clipboard:readImage"]() },
  async readWournal() { return ApiClient["clipboard:readWournal"]() },

}

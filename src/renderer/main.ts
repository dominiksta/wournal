import { provideDependencies } from "dependency-injection";
import FileSystemElectron from "persistence/FileSystemElectron";
import { SystemClipboardElectron } from "util/SystemClipboardElectron";
import Wournal from "wournal";
import './electron-api-client';
import { ApiClient } from "./electron-api-client";

provideDependencies({
  'FileSystem': FileSystemElectron,
  'SystemClipboard': SystemClipboardElectron,
})

const wournal = new Wournal();

async function maybeLoadArgvDoc() {
  const argv = await ApiClient["process:argv"]();
  if (argv.length > 1) wournal.api.loadDocument(argv[1]);
}
maybeLoadArgvDoc();

window.electron.on["window:close"](async () => {
  console.log('OS attempting to close window');
  if (!(await wournal.api.promptClosingUnsaved())) {
    console.log('Closing Window');
    ApiClient["window:destroy"]();
  }
})

document.body.appendChild(wournal);

import { provideDependencies } from "dependency-injection";
import { BackgroundStyleT } from "document/BackgroundGenerators";
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
  if (argv.positionals.length > 3) return; // dev
  if (argv.positionals.length > 1) {
    const path = argv.positionals[argv.positionals.length - 1];
    const exists = await wournal.api.loadDocument(path);
    if (!exists) {
      wournal.api.newDocument({
        backgroundColor: argv.values["page-color"] as string ?? '#000000',
        backgroundStyle: argv.values["page-style"] as BackgroundStyleT ?? 'graph',
        height: parseInt(argv.values["page-height"] as string ?? '297'),
        width:  parseInt(argv.values["page-width"]  as string ?? '210'),
      }, path);
    }
  }
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

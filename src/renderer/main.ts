import FileSystemElectron from "persistence/FileSystemElectron";
import Wournal from "wournal";
import './electron-api-client';
import { ApiClient } from "./electron-api-client";

const wournal = new Wournal();

wournal.fileSystem = FileSystemElectron;

async function maybeLoadArgvDoc() {
  const argv = await ApiClient["process:argv"]();
  if (argv.length > 1) wournal.api.loadDocument(argv[1]);
}
maybeLoadArgvDoc();

window.electron.on["window:close"](() => {
  console.log('close');
  ApiClient["window:destroy"]();
})

document.body.appendChild(wournal);

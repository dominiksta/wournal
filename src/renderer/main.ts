import { DocumentRepositoryElectron } from "persistence/DocumentRepositoryElectron";
import Wournal from "wournal";
import './electron-api-client';
import { ApiClient } from "./electron-api-client";

const wournal = new Wournal();

wournal.docRepo = new DocumentRepositoryElectron();

async function maybeLoadArgvDoc() {
  const argv = await ApiClient["process:argv"]();
  if (argv.length > 1) wournal.api.loadDocument(argv[1]);
}
maybeLoadArgvDoc();

document.body.appendChild(wournal);

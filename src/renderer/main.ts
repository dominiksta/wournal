import { inject, provideDependencies } from "dependency-injection";
import { BackgroundStyleT } from "document/BackgroundGenerators";
import FileSystemElectron from "persistence/FileSystemElectron";
import { WournalPDFPageView } from "./pdf/WournalPDFPageView";
import { SystemClipboardElectron } from "util/SystemClipboardElectron";
import Wournal from "wournal";
import './electron-api-client';
import { ApiClient } from "./electron-api-client";
import * as pdfjs from 'pdfjs-dist';

provideDependencies({
  'FileSystem': FileSystemElectron,
  'SystemClipboard': SystemClipboardElectron,
})

setTimeout(async () => {
  const fs = inject('FileSystem');
  const file = await fs.read('/home/dominik/Source/private/wournal/test.pdf.pdf');
  if (!file) throw new Error();

  const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;

  const viewer = new WournalPDFPageView(await pdf.getPage(1));
  console.log(viewer.display);
  // document.body.appendChild(viewer.display);
  // viewer.setZoom(2);
}, 500);


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

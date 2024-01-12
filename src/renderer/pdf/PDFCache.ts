import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import * as pdfjs from 'pdfjs-dist';
import { inject } from "dependency-injection";

const loadedPDFs: { [location: string]: { [fileName: string]: PDFDocumentProxy }} = {
  'filesystem': {},
};

// TODO: hash

export const PDFCache = {

  async fromBlob(
    blob: Blob, desc: { fileName: string, location: string }
  ): Promise<PDFDocumentProxy> {
    const { fileName, location } = desc;
    if (!(fileName in loadedPDFs[location])) {
      const pdf = await pdfjs.getDocument(await blob.arrayBuffer()).promise;
      loadedPDFs[location][fileName] = pdf;
    }
    return loadedPDFs[location][fileName];
  },

  async fromLocation(
    desc: { fileName: string, location: string }
  ): Promise<PDFDocumentProxy | false> {
    const fs = inject('FileSystem');
    const { fileName, location } = desc;
    if (location !== 'filesystem') throw new Error();
    if (!(fileName in loadedPDFs[location])) {
      const file = await fs.read(fileName);
      if (file === false) return false;
      await this.fromBlob(file, desc);
    }
    return loadedPDFs[location][fileName];
  }

}

import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import * as pdfjs from 'pdfjs-dist';
import { inject } from "dependency-injection";

const loadedPDFs: { [fileName: string]: PDFDocumentProxy } = {};

export class FileNotFoundError extends Error {
  constructor(
    public fileName: string,
    message?: string, options?: ErrorOptions
  ) { super(message, options) }
}

export const PDFCache = {

  async fromBlob(
    blob: Blob, fileName: string
  ): Promise<PDFDocumentProxy> {
    if (!(fileName in loadedPDFs)) {
      console.debug(`Loading PDF: ${fileName}`);
      const pdf = await pdfjs.getDocument(await blob.arrayBuffer()).promise;
      loadedPDFs[fileName] = pdf;
    }
    return loadedPDFs[fileName];
  },

  async fromLocation(
    fileName: string,
  ): Promise<PDFDocumentProxy | false> {
    const fs = inject('FileSystem');
    if (!(fileName in loadedPDFs)) {
      const file = await fs.read(fileName);
      if (file === false) return false;
      await this.fromBlob(file, fileName);
    }
    return loadedPDFs[fileName];
  },

  async destroy(
    fileName: string
  ): Promise<void> {
    if (!(fileName in loadedPDFs)) return;
    console.debug(`Freeing PDF: ${fileName}`);
    const resp = await loadedPDFs[fileName].destroy();
    delete loadedPDFs[fileName];
    return resp;
  }

}

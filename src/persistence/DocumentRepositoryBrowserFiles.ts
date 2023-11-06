import { FileUtils } from "../util/FileUtils";
import { LOG } from "../util/Logging";
import { DocumentRepository } from "./DocumentRepository";
import { DocumentDTO } from "./DocumentDTO";
import ZipFile from "../util/ZipFile";

export class DocumentRepositoryBrowserFiles extends DocumentRepository {

  private static instance: DocumentRepository = null;
  private constructor() { super(); }
  static getInstance(): DocumentRepositoryBrowserFiles {
    if (this.instance === null)
      this.instance = new DocumentRepositoryBrowserFiles();
    return this.instance;
  }

  /**
   * Load the document through a file picker interface from the
   * browser. `identification` will be ignored.
   */
  override async load(identification: string): Promise<DocumentDTO> {
    const file = await FileUtils.promptReadFile(
      ["woj"]
    );

    if (file.name.endsWith(".svg")) {
      return new DocumentDTO(file.name, [
        await FileUtils.blobToUtf8String(file, "string")
      ]);
    } else {
      const zipFile = await ZipFile.fromBlob(file);
      const pages = await Promise.all((await zipFile.allFiles())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async f => await FileUtils.blobToUtf8String(f.blob, "string")));
      return new DocumentDTO(file.name, pages);
    }
  }

  /**
   * Download `doc` through the browser as a file. Returns an empty string as
   * identification.
   */
  override async save(doc: DocumentDTO): Promise<void> {
    const zipFile = new ZipFile();

    for (let i = 0; i < doc.pagesSvg.length; i++) {
      zipFile.addFile(
        String(String(i).padStart(4, '0')) + '-page.svg', doc.pagesSvg[i]
      );
    }

    FileUtils.downloadBlob(await zipFile.asBlob(), doc.identification);
  }
}

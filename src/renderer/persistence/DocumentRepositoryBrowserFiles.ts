import { FileUtils } from "../util/FileUtils";
import { DocumentRepository } from "./DocumentRepository";
import { DocumentDTO } from "./DocumentDTO";
import { blobToDoc, dtoToZip } from "./persistence-helpers";

export class DocumentRepositoryBrowserFiles extends DocumentRepository {

  override async loadPrompt() {
    const file = await FileUtils.promptReadFile(["woj", "svg"]);
    if (!file) return;
    return {
      doc: await blobToDoc(file.name, file),
      identification: file.name,
    }
  }

  override async load(_identification: string): Promise<DocumentDTO> {
    throw new Error(
      'Loading Files by Path is not Supported in the Browser'
    );
  }

  override async save(identification: string, doc: DocumentDTO): Promise<void> {
    throw new Error(
      'Saving Files by Path is not Supported in the Browser'
    );
  }

  override async savePrompt(
    doc: DocumentDTO,
    defaultIdentification: string,
  ): Promise<boolean> {
    FileUtils.downloadBlob(await dtoToZip(doc), defaultIdentification);
    return true;
  }
}

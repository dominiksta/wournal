import { DocumentDTO } from "./DocumentDTO";
import { DocumentRepository } from "./DocumentRepository";
import { ApiClient } from "electron-api-client";
import { blobToDoc, dtoToZip } from "./persistence-helpers";

export class DocumentRepositoryElectron extends DocumentRepository {

  override async save(
    identification: string, doc: DocumentDTO
  ): Promise<void> {
    await ApiClient["file:save"](
      identification,
      (await (await dtoToZip(doc)).arrayBuffer())
    );
  }

  override async savePrompt(
    doc: DocumentDTO,
    defaultIdentification?: string,
  ): Promise<boolean> {
    return await ApiClient["file:savePrompt"](
      (await (await dtoToZip(doc)).arrayBuffer()),
      defaultIdentification,
    );
  }

  override async load(identification: string): Promise<DocumentDTO> {
    const buf = await ApiClient['file:load'](identification);
    if (!buf) return;
    return blobToDoc(identification, new Blob([buf]));
  }

  override async loadPrompt() {
    const resp = await ApiClient['file:loadPrompt']();
    const buf = resp?.buf;
    const path = resp?.path;

    if (!buf) return;

    return {
      doc: await blobToDoc(path, new Blob([buf])),
      identification: path,
    }
  }

}

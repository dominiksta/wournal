import { DocumentDTO } from "./DocumentDTO";

export abstract class DocumentRepository {

  abstract load(identification: string): Promise<DocumentDTO>;
  abstract loadPrompt():
    Promise<{ doc: DocumentDTO, identification: string } | undefined>;

  abstract save(identification: string, doc: DocumentDTO): Promise<void>;
  abstract savePrompt(
    doc: DocumentDTO, defaultIdentification?: string
  ): Promise<boolean>;
}

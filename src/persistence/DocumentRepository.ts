import { DocumentDTO } from "./DocumentDTO";

export abstract class DocumentRepository {

  /**
   * Load a `WournalDocument` from the persistence implementation using
   * `identification`.
   */
  abstract load(identification: string): Promise<DocumentDTO>;

  /**
   * Save the `doc` to the persistence implementation, returning its
   * identification as a string.
   */
  abstract save(doc: DocumentDTO): Promise<void>;
}

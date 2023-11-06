import { WournalDocument } from "../document/WournalDocument";
import { DocumentRepository } from "./DocumentRepository";

/**
 * Manage access to `WournalDocument`s for the different `DocumentRepository`
 * implementations.
 */
export class DocumentService {

  /** Create a new `WournalDocument` for `display` */
  public static async createNew(
    display: HTMLDivElement
  ): Promise<WournalDocument> {
    return WournalDocument.create(display);
  }

  /**
   * Load a `WournalDocument` for `display` from `repo` with `identification`
   */
  public static async load(
    display: HTMLDivElement, repo: DocumentRepository,
    identification: string
  ): Promise<WournalDocument> {
    let dto = await repo.load(identification);

    return WournalDocument.fromDto(display, dto);
  }

  /**
   * Save a `WournalDocument` `doc` to `repo` with `identification`.
   */
  public static async save(
    doc: WournalDocument, repo: DocumentRepository
  ): Promise<void> {
    return repo.save(doc.toDto());
  }
}

import { DocumentRepository } from "../persistence/DocumentRepository";
import { DocumentService } from "../persistence/DocumentService";
import { WournalDocument } from "./WournalDocument";
import { WournalPageSize } from "./WournalPageSize";


export class Wournal {
    private _doc: WournalDocument;
    get doc() { return this._doc; }
    get display() { return this._display; }

    constructor(
        private _display: HTMLDivElement,
        private repo: DocumentRepository,
    ) {
        this.loadDocument(true);
        this.createTestPages();
    }

    public async loadDocument(empty: boolean = false) {
        let disp = this.newDisplayEl();
        this._doc = empty
            ? WournalDocument.create(disp)
            : await DocumentService.load(disp, this.repo, "");
        this.clearDisplayEl();
        this._display.appendChild(disp);
    }

    public async saveDocument() {
        DocumentService.save(this._doc, this.repo);
    }

    private clearDisplayEl() {
        let docEl = this._display.ownerDocument.getElementById(
            "wournal-document"
        ) as HTMLDivElement;
        if (docEl) this._display.removeChild(docEl);
    }

    private newDisplayEl(): HTMLDivElement {
        let docEl = this._display.ownerDocument.createElement("div");
        docEl.id = "wournal-document";
        return docEl;
    }

    private createTestPages() {
        this.doc.addNewPage(WournalPageSize.DINA4_LANDSCAPE);
        this.doc.addNewPage(WournalPageSize.DINA5_PORTRAIT);
        this.doc.addNewPage(WournalPageSize.DINA5_LANDSCAPE);
    }
}

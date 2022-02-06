import { WournalDocument } from "./WournalDocument";
import { SVGCanvasToolEraser } from "./SVGCanvasToolEraser";
import { SVGCanvasToolPen } from "./SVGCanvasToolPen";
import { SVGCanvasToolRectangle } from "./SVGCanvasToolRectangle";
import { SVGCanvasToolSelectRectangle } from "./SVGCanvasToolSelectRectangle";
import { WournalPageSize } from "./WournalPageSize";
import { DocumentService } from "../persistence/DocumentService";
import { DocumentRepositoryBrowserFiles } from "../persistence/DocumentRepositoryBrowserFiles";
import { DocumentRepository } from "../persistence/DocumentRepository";
import { SVGCanvasToolText } from "./SVGCanvasToolText";

export class Wournal {
    private _doc: WournalDocument;
    get doc() { return this._doc; }
    get display() { return this._display; }

    constructor(
        private _display: HTMLDivElement,
        private repo: DocumentRepository,
    ) {
        this.loadDocument(true);

        this.registerToolbarFunctions();
        this.registerKeyBinds();
        this.createTestPages();
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

    private async loadDocument(empty: boolean = false) {
        let disp = this.newDisplayEl();
        this._doc = empty
            ? WournalDocument.create(disp)
            : await DocumentService.load(disp, this.repo, "");
        this.clearDisplayEl();
        this._display.appendChild(disp);
    }

    private async saveDocument() {
        DocumentService.save(this._doc, this.repo);
    }

    private createTestPages() {
        this.doc.addNewPage(WournalPageSize.DINA4_LANDSCAPE);
        this.doc.addNewPage(WournalPageSize.DINA5_PORTRAIT);
        this.doc.addNewPage(WournalPageSize.DINA5_LANDSCAPE);
    }

    private registerKeyBinds() {
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            e = e || window.event as KeyboardEvent;
            if (e.key == "w") this.doc.setTool(new SVGCanvasToolPen())
            else if (e.key == "s") this.doc.setTool(new SVGCanvasToolSelectRectangle())
            else if (e.key == "r") this.doc.setTool(new SVGCanvasToolRectangle())
            else if (e.key == "e") this.doc.setTool(new SVGCanvasToolEraser(10, false))
            else if (e.key == "+") {
                e.preventDefault();
                this.doc.setZoom(this.doc.getZoom() + 0.1);
            }
            else if (e.key == "-") {
                e.preventDefault();
                this.doc.setZoom(this.doc.getZoom() - 0.1);
            }
            else if (e.ctrlKey && e.key == "0") {
                e.preventDefault();
                this.doc.setZoom(1);
            }
            else if (e.ctrlKey && e.key == "z") {
                e.preventDefault();
                this.doc.undo();
            }
            else if (e.ctrlKey && e.key == "y") {
                e.preventDefault();
                this.doc.redo();
            }
        });

        document.addEventListener("wheel", (e: WheelEvent) => {
            if (e.altKey && e.deltaY < 0) {
                e.preventDefault();
                this.doc.setZoom(this.doc.getZoom() + 0.1);
            }
            else if (e.altKey && e.deltaY > 0) {
                e.preventDefault();
                this.doc.setZoom(this.doc.getZoom() - 0.1);
            }

        });
    }

    private registerToolbarFunctions() {
        document.getElementById("btnToolPen").addEventListener("click", () => {
            this.doc.setTool(new SVGCanvasToolPen());
        });
        document.getElementById("btnToolText").addEventListener("click", () => {
            this.doc.setTool(new SVGCanvasToolText());
        });
        document.getElementById("btnToolPointEraser").addEventListener("click", () => {
            this.doc.setTool(new SVGCanvasToolEraser(10, false));
        });
        document.getElementById("btnToolStrokeEraser").addEventListener("click", () => {
            this.doc.setTool(new SVGCanvasToolEraser(10, true));
        });
        document.getElementById("btnToolRectangle").addEventListener("click", () => {
            this.doc.setTool(new SVGCanvasToolRectangle());
        });
        document.getElementById("btnToolSelectRectangle").addEventListener("click", () => {
            this.doc.setTool(new SVGCanvasToolSelectRectangle());
        });

        document.getElementById("btnToolZoomIncrease").addEventListener("click", () => {
            this.doc.setZoom(this.doc.getZoom() + 0.1);
        });
        document.getElementById("btnToolZoomDecrease").addEventListener("click", () => {
            this.doc.setZoom(this.doc.getZoom() - 0.1);
        });
        document.getElementById("btnToolZoomDefault").addEventListener("click", () => {
            this.doc.setZoom(1);
        });

        document.getElementById("btnToolLoad").addEventListener("click", () => {
            this.loadDocument();
        });
        document.getElementById("btnToolSave").addEventListener("click", () => {
            this.saveDocument();
        });
        document.getElementById("btnToolNew").addEventListener("click", () => {
            this.loadDocument(true);
        });

        document.getElementById("btnToolUndo").addEventListener("click", () => {
            this.doc.undo();
        });
        document.getElementById("btnToolRedo").addEventListener("click", () => {
            this.doc.redo();
        });
    }
}

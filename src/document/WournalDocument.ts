import { WournalPage } from "./WournalPage";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGUtils } from "../util/SVGUtils";
import { SVGCanvasToolPen } from "./SVGCanvasToolPen";
import { WournalPageSize, computeZoomFactor } from "./WournalPageSize";
import { DocumentDTO } from "../persistence/DocumentDTO";
import { UndoStack } from "./UndoStack";

export class WournalDocument {
    /** An initial zoom factor, invisible to the user. */
    private initialZoomFactor: number;

    private undoStack: UndoStack;

    private pages: WournalPage[] = [];
    private zoom: number = 1;

    private activePage: WournalPage = null;

    private currentTool: SVGCanvasTool;

    private constructor(
        public display: HTMLDivElement,
        public identification: string = "wournaldoc.svg",
    ) {
        this.display.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.display.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.display.addEventListener("mousemove", this.onMouseMove.bind(this));

        this.initialZoomFactor = computeZoomFactor();
        this.undoStack = new UndoStack(this);
        this.setTool(new SVGCanvasToolPen());
    }

    public defaultPageDimensions = WournalPageSize.DINA4_PORTRAIT;

    // ------------------------------------------------------------
    // initialization and serialization
    // ------------------------------------------------------------

    public static create(display: HTMLDivElement): WournalDocument {
        let doc = new WournalDocument(display);
        doc.addNewPage(WournalPageSize.DINA4_PORTRAIT);
        return doc;
    }

    public static fromDto(
        display: HTMLDivElement, dto: DocumentDTO
    ): WournalDocument {
        let doc = new WournalDocument(display);
        doc.identification = dto.identification;
        for (let page of dto.pagesSvg) {
            doc.addPageFromSvg(page);
        }
        return doc;
    }

    public toDto(): DocumentDTO {
        return new DocumentDTO(
            this.identification,
            this.pages.map((p) => p.asSvgString()),
        );
    }

    // ------------------------------------------------------------
    // undo
    // ------------------------------------------------------------

    public undo(): void {
        this.currentTool?.onDeselect();
        this.undoStack.undo();
    }

    public redo(): void {
        this.currentTool?.onDeselect();
        this.undoStack.redo();
    }

    // ------------------------------------------------------------
    // adding pages
    // ------------------------------------------------------------

    public addNewPage(
        init: {height: number, width: number} = this.defaultPageDimensions
    ): void {
        this.addPage(WournalPage.createNew(this, init));
    }

    public addPageFromSvg(svg: string) {
        this.addPage(WournalPage.fromSvgString(this, svg));
    }

    private addPage(page: WournalPage) {
        page.setZoom(this.zoom * this.initialZoomFactor);
        this.display.appendChild(page.display);
        this.pages.push(page);
        page.toolLayer.style.cursor = this.currentTool.idleCursor;
    }

    // ------------------------------------------------------------
    // zoom
    // ------------------------------------------------------------

    /** Set the zoom level of all pages. [0-inf[ */
    public setZoom(zoom: number) {
        this.zoom = zoom;
        for(let page of this.pages) page.setZoom(zoom * this.initialZoomFactor);
    }
    public getZoom(): number { return this.zoom; }

    // ------------------------------------------------------------
    // tools and helpers
    // ------------------------------------------------------------

    public setTool(tool: SVGCanvasTool) {
        this.currentTool?.onDeselect();
        this.currentTool = tool;
        tool.getActivePage = this.getActivePage.bind(this);
        tool.undoStack = this.undoStack;
        for(let page of this.pages)
            page.toolLayer.style.cursor = this.currentTool.idleCursor;
    }

    private pageAtPoint(pt: {x: number, y: number}) {
        // const start = performance.now();
        let result: WournalPage = null;
        for(let page of this.pages) {
            if (SVGUtils.pointInRect(
                pt, page.toolLayer.getBoundingClientRect()
            )) {
                result = page;
            }
        }
        // NOTE(dominiksta): This is actually suprisingly fast. I would not have
        // thought that over 2000 pages can be checked this way in under 1ms.
        // LOG.info(`took ${start - performance.now()}ms`);
        return result;
    }

    public getActivePage() {
        return this.activePage;
    }

    private onMouseDown(e: MouseEvent) {
        this.activePage = this.pageAtPoint(e);
        if (this.activePage) this.activePage.onMouseDown(e);
        this.currentTool.onMouseDown(e);
    }

    private onMouseUp(e: MouseEvent) {
        this.currentTool.onMouseUp(e);
    }

    private onMouseMove(e: MouseEvent) {
        this.currentTool.onMouseMove(e);
    }


}

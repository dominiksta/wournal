import { DocumentDTO } from "../persistence/DocumentDTO";
import { DSUtils } from "../util/DSUtils";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasElement } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { CanvasTool, CanvasToolSetupProps } from "./CanvasTool";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasSelection } from "./SelectionDisplay";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoStack } from "./UndoStack";
import { WournalPage } from "./WournalPage";
import { computeZoomFactor, WournalPageSize } from "./WournalPageSize";

export class WournalDocument {
    /** An initial zoom factor, invisible to the user. */
    private initialZoomFactor: number;

    private undoStack: UndoStack;
    private selection: CanvasSelection;
    private copyBuffer: CanvasElement[];

    private pages: WournalPage[] = [];
    private zoom: number = 1;

    private activePage: WournalPage = null;

    private _currentTool: CanvasTool;
    get currentTool() { return this._currentTool; }

    private constructor(
        public display: HTMLDivElement,
        public identification: string = "wournaldoc.svg",
    ) {
        this.display.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.display.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.display.addEventListener("mousemove", this.onMouseMove.bind(this));

        this.initialZoomFactor = computeZoomFactor();
        this.undoStack = new UndoStack(this);
        this.selection = new CanvasSelection(this.undoStack);
        this.setTool(new CanvasToolPen());
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
    // selection
    // ------------------------------------------------------------

    public selectionCut(): void {
        if (this.selection.selection.length === 0) return;
        this.copyBuffer = [];
        for (let el of this.selection.selection) this.copyBuffer.push(el);

        this.undoStack.push(new UndoActionCanvasElements(
            DSUtils.copyArr(this.copyBuffer.map(e => e.svgElem)), null, null
        ));

        for (let el of this.selection.selection) el.destroy();
        this.selection.clear();
    }

    public selectionCopy(): void {
        if (this.selection.selection.length === 0) return;
        this.copyBuffer = [];
        // copy array instead of assigning ref
        for (let el of this.selection.selection) {
            this.copyBuffer.push(el);
        }
    }

    public selectionOrClipboardPaste(): void {
        // TODO: Clipboard (text & images)

        const page = this.getActivePage();
        const layer = page.getActivePaintLayer();
        let newEls: CanvasElement[] = [];
        for (let el of this.copyBuffer) {
            let newEl = CanvasElementFactory.fromData(
                this.display.ownerDocument, el.getData()
            );
            layer.appendChild(newEl.svgElem);
            newEl.translate(20, 20);
            newEl.writeTransform();
            newEls.push(newEl);
        }
        this.selection.init(page);
        this.selection.setSelectionFromElements(page, newEls);

        this.undoStack.push(new UndoActionCanvasElements(
            null, null, DSUtils.copyArr(newEls.map(e => e.svgElem))
        ));
    }

    /** Called to update react state */
    public notifySelectionAvailable: (avail: boolean) => void;

    // ------------------------------------------------------------
    // undo
    // ------------------------------------------------------------

    public undo(): void {
        this._currentTool?.onDeselect();
        this.undoStack.undo();
    }

    public redo(): void {
        this._currentTool?.onDeselect();
        this.undoStack.redo();
    }

    /** Called to update react state */
    public notifyUndoAvailable: (avail: boolean) => void;
    /** Called to update react state */
    public notifyRedoAvailable: (avail: boolean) => void;

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
        page.toolLayer.style.cursor = this._currentTool.idleCursor;
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

    public setTool(tool: CanvasTool) {
        this._currentTool?.onDeselect();
        this._currentTool = tool;
        tool.setup(new CanvasToolSetupProps(
            this.getActivePage.bind(this), this.undoStack, this.selection
        ));
        for(let page of this.pages)
            page.toolLayer.style.cursor = this._currentTool.idleCursor;

        this.notifySetTool(tool.name);
    }

    /** Called to update react state */
    public notifySetTool: (name: string) => void = (name: string) => null;

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

        if (this.activePage && this.selection.selection.length !== 0) {
            const mouse = this.activePage.globalCoordsToCanvas(e);
            if (SVGUtils.pointInRect(mouse, this.selection.hitbox())) {
                this.selection.onMouseDown(e);
            } else {
                this.selection.clear();
                this._currentTool.onMouseDown(e);
            }
        } else {
            this._currentTool.onMouseDown(e);
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (this.selection.currentlyInteracting)
            this.selection.onMouseUp(e)
        else
            this._currentTool.onMouseUp(e);
    }

    private onMouseMove(e: MouseEvent) {
        if (this.selection.currentlyInteracting)
            this.selection.onMouseMove(e)
        else
            this._currentTool.onMouseMove(e);
    }


}

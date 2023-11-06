import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { DocumentDTO } from "../persistence/DocumentDTO";
import { ClipboardUtils } from "../util/ClipboardUtils";
import { DSUtils } from "../util/DSUtils";
import { FileUtils } from "../util/FileUtils";
import { Newable } from "../util/Newable";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasElement } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { CanvasImage, CanvasImageData } from "./CanvasImage";
import { CanvasText, CanvasTextData } from "./CanvasText";
import { CanvasTool, CanvasToolName, CanvasToolSetupProps } from "./CanvasTool";
import { CanvasToolFactory } from "./CanvasToolFactory";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasSelection } from "./CanvasSelection";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoStack } from "./UndoStack";
import { Wournal } from "./Wournal";
import { WournalPage } from "./WournalPage";
import { computeZoomFactor, WournalPageSize } from "./WournalPageSize";
import { rx } from "@mvui/core";

export class WournalDocument {
    /** An initial zoom factor, invisible to the user. */
    private initialZoomFactor: number;

    private undoStack: UndoStack;
    private selection: CanvasSelection;
    private copyBuffer: { content: CanvasElement[], time: Date } =
        { content: [], time: new Date() };
    /**  */
    private systemClipboard: {
        image: {content: string, time: Date}, text: {content: string, time: Date}
    } = {
        image: { content: "", time: new Date() },
        text: { content: "", time: new Date() }
    }

    private pages: WournalPage[] = [];
    private zoom: number = 1;

    private activePage: WournalPage = null;

    /** Store tool set before right click */
    private toolBeforeRightClick: CanvasToolName;

    private constructor(
        public display: HTMLDivElement,
        public identification: string = "wournaldoc.woj",
    ) {
        this.display.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.display.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.display.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.display.addEventListener("contextmenu", (e) => { e.preventDefault() });
        ClipboardUtils.setPlainTextHandler(this.onPastePlainText.bind(this));
        ClipboardUtils.setImageHandler(this.onPasteImage.bind(this));
        ClipboardUtils.enableHandlers(this.display.ownerDocument);

        this.initialZoomFactor = computeZoomFactor();
        this.undoStack = new UndoStack(this);
        this.selection = new CanvasSelection(this.undoStack);
        this.setTool(CanvasToolPen);
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
    // theme
    // ------------------------------------------------------------

    public updateTheme(): void {
        for (let page of this.pages) page.updateTheme();
    }

    // ------------------------------------------------------------
    // selection
    // ------------------------------------------------------------

    public selectionCut(noCopy: boolean = false): void {
        if (this.selection.selection.length === 0) return;
        let deleted = [];
        for (let el of this.selection.selection) deleted.push(el);

        this.undoStack.push(new UndoActionCanvasElements(
            DSUtils.copyArr(deleted.map(e => e.svgElem)), null, null
        ));

        for (let el of this.selection.selection) el.destroy();
        this.selection.clear();

        if (!noCopy) {
            this.copyBuffer.content = deleted;
            this.copyBuffer.time = new Date();
        }
    }

    public selectionCopy(): void {
        if (this.selection.selection.length === 0) return;
        this.copyBuffer.content = [];
        this.copyBuffer.time = new Date();
        // copy array instead of assigning ref
        for (let el of this.selection.selection) {
            this.copyBuffer.content.push(el);
        }
    }

    /** Paste either `copyBuffer` or `systemClipboard` by recency */
    public selectionOrClipboardPaste(first: boolean = false): void {
        if (first && this.copyBuffer.content.length !== 0) {
            this.selectionPaste();
        } else if (this.copyBuffer.time < this.systemClipboard.image.time) {
            this.pasteImage(this.systemClipboard.image.content);
        } else if (this.copyBuffer.time < this.systemClipboard.text.time) {
            this.pastePlainText(this.systemClipboard.text.content);
        } else if (this.copyBuffer.content.length !== 0) {
            this.selectionPaste();
        }
    }

    /** Paste `copyBuffer` */
    public selectionPaste(): void {
        const page = this.getActivePage();
        const layer = page.getActivePaintLayer();
        let newEls: CanvasElement[] = [];
        for (let el of this.copyBuffer.content) {
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

    public selectionAvailable = new rx.State(false);

    /** Remember pasted image and call `selectionOrClipboardPaste` */
    private async onPasteImage(dataUrl: string): Promise<void> {
        /*
         * HACK: This check will result in an unintended behaviour/bug: When the
         * user pastes an image from the clipboard and then proceeds to use the
         * internal copy function, he can then not paste the same image again by
         * putting it into the system clipboard again.
         *
         * There seem to be two possible solutions for this:
         * - Write the internal `copyBuffer` to the system clipboard with the
         *   'copy' event (and setting a custom mimetype to not interfere with
         *   the clipboard of other applications) and then always paste from the
         *   system clipboard. This is not exactly trivial because it would
         *   require (de-)serializing `copyBuffer` as a string - but it should
         *   be considered at a later point.
         * - Use some clipboard api to bind a seperate shortcut like
         *   Ctrl+Shift+V to explicitly paste from the system clipboard. However
         *   this is also not really intuitive and it is also difficult (or even
         *   impossible?) to implement cross-browser with the currently available
         *   APIs.
         */
        const first = (this.systemClipboard.image.content  === ""
                    && this.systemClipboard.text.content === "");
        if (dataUrl !== this.systemClipboard.image.content) {
            this.systemClipboard.image.content = dataUrl;
            this.systemClipboard.image.time = new Date();
        }
        this.selectionOrClipboardPaste(first);
    }

    /** Insert the given image on the current page */
    private async pasteImage(dataUrl: string): Promise<void> {
        if (!this.activePage) return;

        let imageEl = CanvasImage.fromNewElement(this.display.ownerDocument);
        const dimensions = await FileUtils.imageDimensionsForDataUrl(dataUrl);
        imageEl.setData(new CanvasImageData(dataUrl, DOMRect.fromRect({
            x: 10, y: 10, width: dimensions.width, height: dimensions.height
        })));

        this.activePage.activePaintLayer.appendChild(imageEl.svgElem);
        this.selection.setSelectionFromElements(this.activePage, [imageEl]);
        this.undoStack.push(new UndoActionCanvasElements(
            null, null, [imageEl.svgElem]
        ));
    }

    /** Remember pasted text and call `selectionOrClipboardPaste` */
    private onPastePlainText(text: string): void {
        // HACK: See `onPasteImage`
        const first = (this.systemClipboard.image.content  === ""
                    && this.systemClipboard.text.content === "");
        if (text !== this.systemClipboard.text.content) {
            this.systemClipboard.text.content = text;
            this.systemClipboard.text.time = new Date();
        }
        this.selectionOrClipboardPaste(first);
    }

    /** Insert the given text on the current page */
    private pastePlainText(text: string): void {
        if (!this.activePage) return;

        const c = Wournal.currToolConf.CanvasToolText;
        let textEl = CanvasText.fromData(
            this.display.ownerDocument,
            // TODO: find a more sane paste position then 10,10
            new CanvasTextData(
                text, { x: 10, y: 10 }, c.fontSize, c.fontStyle, c.fontWeight,
                c.fontFamily, c.color,
        ));

        this.activePage.activePaintLayer.appendChild(textEl.svgElem);
        this.selection.setSelectionFromElements(this.activePage, [textEl]);
        this.undoStack.push(new UndoActionCanvasElements(
            null, null, [textEl.svgElem]
        ));
    }


    // ------------------------------------------------------------
    // undo
    // ------------------------------------------------------------

    public undo(): void {
        this.currentTool.value.onDeselect();
        this.selection.clear();
        this.undoStack.undo();
    }

    public redo(): void {
        this.currentTool.value.onDeselect();
        this.selection.clear();
        this.undoStack.redo();
    }

    public undoAvailable = new rx.State(false);
    public redoAvailable = new rx.State(false);

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
        page.toolLayer.style.cursor = this.currentTool.value.idleCursor;
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
    // tools
    // ------------------------------------------------------------

    public setTool(tool: Newable<CanvasTool>, noDeselect: boolean = false)  {
        if (!noDeselect) this.currentTool.value.onDeselect();
        this.selection.clear();
        this.currentTool.next(new tool());
        this.currentTool.value.setup(new CanvasToolSetupProps(
            this.getActivePage.bind(this), this.undoStack, this.selection
        ));
        for(let page of this.pages)
            page.toolLayer.style.cursor = this.currentTool.value.idleCursor;
    }

    /** Reset the config of the current tool to loaded global config */
    public resetCurrentTool() {
        if (!DSUtils.hasKey(Wournal.currToolConf, this.currentTool.value.name)
            || !DSUtils.hasKey(Wournal.CONF.tools, this.currentTool.value.name))
            throw new Error(`Could not get config for tool ${this.currentTool.value}`)

        Wournal.currToolConf[this.currentTool.value.name] =
            DSUtils.copyObj(Wournal.CONF.tools[this.currentTool.value.name]) as any
    }

    /** Called to update react state */
    public currentTool = new rx.State<CanvasTool>(new CanvasToolPen());

    /** set stroke width for current tool or selection */
    public setStrokeWidth(width: CanvasToolStrokeWidth): void {
        if (this.selection.selection.length !== 0) {
            let changed = [];
            for (let el of this.selection.selection) {
                const dataBefore = el.getData();
                el.setStrokeWidth(width);
                changed.push({
                    el: el.svgElem, dataBefore: dataBefore, dataAfter: el.getData()
                });
            }
            this.undoStack.push(new UndoActionCanvasElements(
                null, changed, null
            ));
        } else {
            this.currentTool.value.setStrokeWidth(width);
        }
    }

    /** get current tool stroke width */
    public getStrokeWidth(): CanvasToolStrokeWidth {
        return this.currentTool.value.getStrokeWidth();
    }

    /** set color for current tool or selection */
    public setColor(color: string): void {
        if (this.selection.selection.length !== 0) {
            let changed = [];
            for (let el of this.selection.selection) {
                const dataBefore = el.getData();
                el.setColor(color);
                changed.push({
                    el: el.svgElem, dataBefore: dataBefore, dataAfter: el.getData()
                });
            }
            this.undoStack.push(new UndoActionCanvasElements(
                null, changed, null
            ));
        } else {
            // if the current tool does not support color, fall back to pen -
            // this mimics xournal behaviour
            if (this.currentTool.value.getColor() === "") {
                this.setTool(CanvasToolPen);
            }
            this.currentTool.value.setColor(color);
        }
    }

    /** get current tool color */
    public getColor(): string { return this.currentTool.value.getColor(); }

    // ----------------------------------------------------------------------
    // helpers
    // ----------------------------------------------------------------------

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
            if (SVGUtils.pointInRect(mouse, this.selection.selectionDisplay.hitbox())) {
                this.selection.onMouseDown(e);
            } else {
                this.selection.clear();
                this.currentTool.value.onMouseDown(e);
            }
        } else {
            if (e.button === 2) { // right click
                this.toolBeforeRightClick = this.currentTool.value.name;
                this.setTool(CanvasToolFactory.forName(Wournal.CONF.binds.rightClick));
            }
            this.currentTool.value.onMouseDown(e);
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (this.selection.currentlyInteracting) {
            this.selection.onMouseUp(e)
        } else {
            this.currentTool.value.onMouseUp(e);
            if (e.button === 2) // right click
                this.setTool(
                    CanvasToolFactory.forName(this.toolBeforeRightClick), true
                );
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (this.selection.currentlyInteracting)
            this.selection.onMouseMove(e)
        else
            this.currentTool.value.onMouseMove(e);
    }


}

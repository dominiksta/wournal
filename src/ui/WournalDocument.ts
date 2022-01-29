import { WournalPage } from "./WournalPage";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGUtils } from "../util/SVGUtils";
import { SVGCanvasToolPen } from "./SVGCanvasToolPen";
import { WournalPageSize } from "./WournalPageSize";

export class WournalDocument {
    private pages: WournalPage[] = [];
    private zoom: number = 1;

    private activePage: WournalPage = null;

    private currentTool: SVGCanvasTool;

    constructor(public display: HTMLDivElement) {
        this.display.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.display.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.display.addEventListener("mousemove", this.onMouseMove.bind(this));

        this.setTool(new SVGCanvasToolPen());
    }

    public defaultPageDimensions = WournalPageSize.DINA4_PORTRAIT;

    public newPage(
        dimensions: {height: number, width: number} = this.defaultPageDimensions
    ): void {
        let page = new WournalPage(this, dimensions);
        this.display.appendChild(page.display);
        this.pages.push(page);
        for(let page of this.pages)
            page.toolLayer.style.cursor = this.currentTool.idleCursor;
    }

    /** Set the zoom level of all pages. [0-inf[ */
    public setZoom(zoom: number) {
        this.zoom = zoom;
        for(let page of this.pages) page.setZoom(zoom);
    }
    public getZoom(): number { return this.zoom; }

    public setTool(tool: SVGCanvasTool) {
        this.currentTool?.onDeselect();
        this.currentTool = tool;
        tool.getActivePage = this.getActivePage.bind(this);
        for(let page of this.pages)
            page.toolLayer.style.cursor = this.currentTool.idleCursor;
    }

    private pageAtPoint(pt: {x: number, y: number}) {
        // const start = performance.now();
        let result: WournalPage = null;
        for(let page of this.pages) {
            if (SVGUtils.pointInRect(
                pt, page.activePaintLayer.getBoundingClientRect()
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

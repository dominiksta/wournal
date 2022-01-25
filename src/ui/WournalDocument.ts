import { Newable } from "../util/Newable";
import { WournalPage } from "./WournalPage";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGUtils } from "../util/SVGUtils";
import { LOG } from "../util/Logging";
import { SVGCanvasToolPen } from "./SVGCanvasToolPen";

export class WournalDocument {
    private pages: WournalPage[] = [];

    private activePage: WournalPage = null;

    private currentTool: SVGCanvasTool;

    constructor(public display: HTMLDivElement) {
        this.setTool(SVGCanvasToolPen);

        this.display.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.display.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.display.addEventListener("mousemove", this.onMouseMove.bind(this));
    }

    public defaultPageDimensions = {height: 600, width: 400};

    public newPage(
        width: number = this.defaultPageDimensions.width,
        height: number = this.defaultPageDimensions.height
    ): void {
        let page = new WournalPage(this, width, height);
        this.display.appendChild(page.display);
        this.pages.push(page);
    }

    public setTool(tool: Newable<SVGCanvasTool>) {
        this.currentTool = new tool(this.getActivePage.bind(this));
        for(let page of this.pages) {
            page.toolLayer.style.cursor = this.currentTool.idleCursor;
        }
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
        if (this.activePage == null) return;
        this.activePage.onMouseDown(e);
        this.currentTool.onMouseDown(e);
    }

    private onMouseUp(e: MouseEvent) {
        if (this.activePage == null) return;
        this.currentTool.onMouseUp(e);
    }

    private onMouseMove(e: MouseEvent) {
        if (this.activePage == null) return;
        this.currentTool.onMouseMove(e);
    }


}

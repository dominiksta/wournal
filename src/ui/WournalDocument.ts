import { Newable } from "../util/Newable";
import { WournalPage } from "./WournalPage";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGUtils } from "../util/SVGUtils";
import { LOG } from "../util/Logging";

export class WournalDocument {
    private pages: WournalPage[] = [];

    private toolPage: WournalPage = null;

    constructor(public display: HTMLDivElement) {
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
        this.pages.forEach((canvas) => {
            canvas.currentTool = new tool(canvas);
        })
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

    private onMouseDown(e: MouseEvent) {
        this.toolPage = this.pageAtPoint(e);
        if (this.toolPage == null) return;
        this.toolPage.onMouseDown(e);
    }

    private onMouseUp(e: MouseEvent) {
        if (this.toolPage == null) return;
        this.toolPage.onMouseUp(e);
    }

    private onMouseMove(e: MouseEvent) {
        if (this.toolPage == null) return;
        this.toolPage.onMouseMove(e);
    }


}

import { Newable } from "../util/Newable";
import { WournalPage } from "./WournalPage";
import { SVGCanvasTool } from "./SVGCanvasTool";

export class WournalDocument {
    private pages: WournalPage[] = [];

    constructor(public display: HTMLDivElement) {}

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

}

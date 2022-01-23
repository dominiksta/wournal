import { Newable } from "../util/Newable";
import { SVGCanvas } from "./SVGCanvas";
import { SVGCanvasTool } from "./SVGCanvasTool";

export class WournalDocument {
    private canvases: SVGCanvas[] = [];

    constructor(public display: HTMLDivElement) {}

    public defaultPageDimensions = {height: 600, width: 400};

    public newPage(
        width: number = this.defaultPageDimensions.width,
        height: number = this.defaultPageDimensions.height
    ): void {
        let svg = this.display.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "svg"
        );
        svg.setAttribute("width", `${width}px`);
        svg.setAttribute("height", `${height}px`);
        this.display.appendChild(svg);

        let canvas = new SVGCanvas(svg);
        this.canvases.push(canvas);
    }

    public setTool(tool: Newable<SVGCanvasTool>) {
        this.canvases.forEach((canvas) => {
            canvas.currentTool = new tool(canvas);
        })
    }

}

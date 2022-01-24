import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGCanvasToolPen } from "./SVGCanvasToolPen";
import { WournalDocument } from "./WournalDocument";

/**
 * An SVG Canvas to draw on.
 */
export class WournalPage {

    public display: HTMLDivElement;

    private width: number;
    private height: number;

    public toolLayer: SVGSVGElement;

    private paintLayers: {name: string, svg: SVGSVGElement}[] = [];
    public activePaintLayer: SVGSVGElement;

    public currentTool: SVGCanvasTool;

    /**
     * The bounding rectangle of `_svgElement`. Only updated in `onMouseDown`
     * for better performance.
     */
    private _rect: DOMRect;
    get rect() { return this._rect; }

    constructor(
        private doc: WournalDocument, width: number, height: number,
    ) {
        this.display = doc.display.ownerDocument.createElement("div");
        this.display.setAttribute("class", "wournal-page");
        this.display.style.border = "1px solid black";
        this.display.style.margin = "10px";

        this.toolLayer = this.doc.display.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "svg"
        );
        this.toolLayer.style.position = "absolute";

        this.setSize(width, height);
        this.addLayer("", true);

        this.currentTool = new SVGCanvasToolPen(this);
    }

    public addLayer(name: string = "", makeActive: boolean = false): void {
        let svg = this.doc.display.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "svg"
        );
        svg.setAttribute("width", `${this.width}px`);
        svg.setAttribute("height", `${this.height}px`);
        svg.style.position = "absolute";
        const n = name === "" ? `Layer ${this.paintLayers.length + 1}` : name;
        this.paintLayers.push({name: n, svg: svg});
        this.drawLayers();
        if (makeActive) this.setActivePaintLayer(n);
    }

    private drawLayers() {
        while (this.display.firstChild)
            this.display.removeChild(this.display.lastChild);

        this.display.appendChild(this.toolLayer);
        for (let layer of this.paintLayers) {
            this.display.insertBefore(layer.svg, this.display.firstChild);
        }
    }

    public setActivePaintLayer(name: string) {
        this.activePaintLayer = this.paintLayers.find(
            (layer) => layer.name === name
        ).svg;
    }

    public getActivePaintLayer() { return this.activePaintLayer; }

    public onMouseDown(e: MouseEvent) {
        this._rect = this.toolLayer.getBoundingClientRect();
        this.currentTool.onMouseDown(e);
    }

    public onMouseMove(e: MouseEvent) {
        this.currentTool.onMouseMove(e);
    }

    public onMouseUp(e: MouseEvent) {
        this.currentTool.onMouseUp(e);
    }

    public setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.display.style.width = `${width}px`;
        this.display.style.height = `${height}px`;
        this.toolLayer.setAttribute("width", `${width}px`);
        this.toolLayer.setAttribute("height", `${height}px`);
        for (let layer of this.paintLayers) {
            layer.svg.setAttribute("width", `${width}px`);
            layer.svg.setAttribute("height", `${height}px`);
        }
    }

    /** Translate x and y to canvas coords */
    public globalCoordsToCanvas(
        pt: {x: number, y: number}
    ): {x: number, y: number} {
        return {
            x: pt.x - this._rect.left,
            y: pt.y - this._rect.top
        };
    }

    /** Translate r to canvas coords */
    public globalDOMRectToCanvas(r: DOMRect): DOMRect {
        return DOMRect.fromRect({
            x: r.x - this._rect.left,
            y: r.y - this._rect.top,
            width: r.width,
            height: r.height,
        });
    }
}

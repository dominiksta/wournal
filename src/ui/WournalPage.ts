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

    /**
     * The bounding rectangle of `_svgElement`. Only updated in `onMouseDown`
     * for better performance.
     */
    private _rect: DOMRect;
    get rect() { return this._rect; }

    constructor(
        private doc: WournalDocument,
        dimensions: {height: number, width: number}
    ) {
        this.display = doc.display.ownerDocument.createElement("div");
        this.display.setAttribute("class", "wournal-page");

        this.display.style.border = "2px solid gray";
        this.display.style.margin = "10px auto 10px auto";

        this.toolLayer = this.doc.display.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "svg"
        );
        this.toolLayer.style.position = "absolute";

        this.setSize(dimensions.width, dimensions.height);

        let bg = this.addLayer("background", true);
        bg.style.background = "white";
        this.addLayer("", true);
    }

    public addLayer(
        name: string = "", makeActive: boolean = false
    ): SVGSVGElement {
        let svg = this.doc.display.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "svg"
        );
        svg.setAttribute("width", `${this.width}mm`);
        svg.setAttribute("height", `${this.height}mm`);
        svg.style.position = "absolute";
        const n = name === "" ? `Layer ${this.paintLayers.length + 1}` : name;
        this.paintLayers.push({name: n, svg: svg});
        this.drawLayers();
        if (makeActive) this.setActivePaintLayer(n);
        return svg;
    }

    private drawLayers() {
        while (this.display.firstChild)
            this.display.removeChild(this.display.lastChild);

        for (let layer of this.paintLayers) {
            // this.display.insertBefore(layer.svg, this.display.firstChild);
            this.display.appendChild(layer.svg);
        }
        this.display.appendChild(this.toolLayer);
    }

    public setActivePaintLayer(name: string) {
        this.activePaintLayer = this.paintLayers.find(
            (layer) => layer.name === name
        ).svg;
    }

    public getActivePaintLayer() { return this.activePaintLayer; }

    public onMouseDown(e: MouseEvent) {
        this._rect = this.toolLayer.getBoundingClientRect();
    }

    public setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.display.style.width = `${width}mm`;
        this.display.style.height = `${height}mm`;
        this.toolLayer.setAttribute("width", `${width}mm`);
        this.toolLayer.setAttribute("height", `${height}mm`);
        for (let layer of this.paintLayers) {
            layer.svg.setAttribute("width", `${width}mm`);
            layer.svg.setAttribute("height", `${height}mm`);
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

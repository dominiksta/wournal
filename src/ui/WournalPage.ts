import { DOMUtils } from "../util/DOMUtils";
import { LOG } from "../util/Logging";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { SVGCanvasToolPen } from "./SVGCanvasToolPen";
import { WournalDocument } from "./WournalDocument";
import { WournalPageSize } from "./WournalPageSize";

/**
 * An SVG Canvas to draw on.
 */
export class WournalPage {

    public display: HTMLDivElement;
    /**
     * This wrapper element is necessary for zooming to work. Since css scale
     * transform is used for zooming, which does not alter the size of the
     * scaled element, we have to alter the width/height of a surrounding
     * element (this.display);
     */
    private svgWrapperEl: HTMLDivElement;

    private width: number;
    private height: number;
    private zoom: number = 1;

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

        this.svgWrapperEl = doc.display.ownerDocument.createElement("div");
        this.svgWrapperEl.style.transformOrigin = "0 0";
        this.display.appendChild(this.svgWrapperEl);

        this.toolLayer = this.doc.display.ownerDocument.createElementNS(
            "http://www.w3.org/2000/svg", "svg"
        );
        this.toolLayer.style.position = "absolute";

        this.setPageSize(dimensions);
        this.updateDisplaySize();
        this.setZoom(1);

        let bg = this.addLayer("background", true);
        bg.style.background = "white";
        this.addLayer("", true);

        if (dimensions.height === WournalPageSize.DINA4_PORTRAIT.height &&
            dimensions.width === WournalPageSize.DINA4_PORTRAIT.width)
            this.loadFromUrl("res/testpage.svg");
    }

    public loadFromUrl(url: string) {
        LOG.info(`Loading url: ${url}...`);
        fetch(url)
            .then((response: Response) => response.text())
            .then((response: string) => {
                LOG.info(`Loaded url: ${url}...`);
                const loaded = DOMUtils.createElementFromHTML<SVGSVGElement>(
                    response
                );
                this.activePaintLayer.innerHTML = loaded.innerHTML;
                LOG.info(this.activePaintLayer);
            });
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
        while (this.svgWrapperEl.firstChild)
            this.svgWrapperEl.removeChild(this.svgWrapperEl.lastChild);

        for (let layer of this.paintLayers) {
            // this.svgWrapperEl.insertBefore(layer.svg, this.svgWrapperEl.firstChild);
            this.svgWrapperEl.appendChild(layer.svg);
        }
        this.svgWrapperEl.appendChild(this.toolLayer);
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

    /** Update the size of this page according to the set width/height */
    private updateDisplaySize() {
        this.display.style.width = `${this.width*this.zoom}mm`;
        this.display.style.height = `${this.height*this.zoom}mm`;
    }

    /**
     * Set the page size according to `d`. Note that if the page is set to a
     * smaller size then its initial size, some content at the borders might be
     * removed.
     */
    public setPageSize(d: {width: number, height: number}) {
        this.width = d.width;
        this.height = d.height;
        this.toolLayer.setAttribute("width", `${d.width}mm`);
        this.toolLayer.setAttribute("height", `${d.height}mm`);
        for (let layer of this.paintLayers) {
            layer.svg.setAttribute("width", `${d.width}mm`);
            layer.svg.setAttribute("height", `${d.height}mm`);
        }
        this.updateDisplaySize();
    }

    /**
     * Set the zoom level of this page. [0-inf[
     *
     * Note: For this to work, ALL COORDINATES ACCROSS THE ENTIRE APPLICATION
     * WILL HAVE TO BE TRANSLATED TO THE CANVAS COORDINATE SYSTEM USING
     * `this.globalCoordsToCanvas` AND `this.globalDOMRectToCanvas`.
     */
    public setZoom(zoom: number) {
        // Setting the scale transform css attribute on the entire wournal
        // document seemed not to work, but for some reason it does work on the
        // individual pages. This is why zoom level is set on a page by page
        // basis.
        this.svgWrapperEl.style.transform = `scale(${zoom})`;
        this.zoom = zoom;
        this.updateDisplaySize();
    }

    /**
     * Translate x and y to canvas coords. USE THIS FOR ALL COORDINATE
     * TRANSLATIONS, OTHERWISE ZOOM WILL NOT WORK.
     */
    public globalCoordsToCanvas(
        pt: {x: number, y: number}
    ): {x: number, y: number} {
        return {
            x: (pt.x - this._rect.left) * 1/this.zoom,
            y: (pt.y - this._rect.top) * 1/this.zoom
        };
    }

    /**
     * Translate r to canvas coords. USE THIS FOR ALL COORDINATE TRANSLATIONS,
     * OTHERWISE ZOOM WILL NOT WORK.
     */
    public globalDOMRectToCanvas(r: DOMRect): DOMRect {
        return DOMRect.fromRect({
            x: (r.x - this._rect.left) * 1/this.zoom,
            y: (r.y - this._rect.top) * 1/this.zoom,
            width: r.width * 1/this.zoom,
            height: r.height * 1/this.zoom,
        });
    }
}

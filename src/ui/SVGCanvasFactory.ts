import { SVGCanvas } from "./SVGCanvas";

/** Typescript does not allow multiple constructors */
export class SVGCanvasFactory {

    // static DEFAULT_CANVAS_HEIGHT = "400px";
    // static DEFAULT_CANVAS_WIDTH = "600px";

    public static create(
        doc: Document, width: string, height: string
    ): SVGCanvas {
        let svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);

        let canvas = new SVGCanvas(svg);
        let select = document.getElementById("cmbBufferSize") as HTMLSelectElement;
        canvas.mouseBufferSize = parseInt(select.value);
        return canvas;
    }
}

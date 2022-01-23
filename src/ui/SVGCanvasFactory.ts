import { SVGCanvas } from "./SVGCanvas";
import { HTMLSVGElement } from "./HTMLSVGElement";

export class SVGCanvasFactory {

    // static DEFAULT_CANVAS_HEIGHT = "400px";
    // static DEFAULT_CANVAS_WIDTH = "600px";

    static newDefault() {
        let canvas = new SVGCanvas(
            document.getElementById("svgElement") as HTMLSVGElement
        );
        let select = document.getElementById("cmbBufferSize") as HTMLSelectElement;
        canvas.mouseBufferSize = parseInt(select.value);
        return canvas;
    }
}

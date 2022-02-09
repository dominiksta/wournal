import { CanvasPath } from "./CanvasPath";
import { CanvasText } from "./CanvasText";
import { CanvasElement } from "./CanvasElement";

export class CanvasElementFactory {

    public static fromSvgElem(
        svg: SVGGraphicsElement
    ): CanvasElement {
        if (svg instanceof SVGTextElement) {
            return new CanvasText(svg);
        } else if (svg instanceof SVGPathElement) {
            return new CanvasPath(svg);
        } else {
            throw new Error("unsupported svg element!");
        }
    }

}

import { SVGCanvasPath } from "./SVGCanvasPath";
import { SVGCanvasText } from "./SVGCanvasText";
import { WournalCanvasElement } from "./WournalCanvasElement";

export class WournalCanvasElementFactory {

    public static fromSvgElem(
        svg: SVGGraphicsElement
    ): WournalCanvasElement {
        if (svg instanceof SVGTextElement) {
            return new SVGCanvasText(svg);
        } else if (svg instanceof SVGPathElement) {
            return new SVGCanvasPath(svg);
        } else {
            throw new Error("unsupported svg element!");
        }
    }

}

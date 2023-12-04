import { CanvasElement, CanvasElementData } from "./CanvasElement";
import { CanvasImage, CanvasImageData } from "./CanvasImage";
import { CanvasPath, CanvasPathData } from "./CanvasPath";
import { CanvasText, CanvasTextData } from "./CanvasText";

export class CanvasElementFactory {

  /** Instantiate a new `CanvasElement` from an existing `SVGGraphicselement` */
  public static fromSvgElem(
    svg: SVGGraphicsElement
  ): CanvasElement {
    if (svg instanceof SVGTextElement) {
      return new CanvasText(svg);
    } else if (svg instanceof SVGPathElement) {
      return new CanvasPath(svg);
    } else if (svg instanceof SVGImageElement) {
      return new CanvasImage(svg);
    } else {
      throw new Error("unsupported svg element!");
    }
  }

  /** Create a new `CanvasElement` from the given `data` */
  public static fromData(
    doc: Document, data: CanvasElementData
  ): CanvasElement {
    let canvasEl: CanvasElement;
    if (data instanceof CanvasTextData) {
      let svg = doc.createElementNS("http://www.w3.org/2000/svg", "text");
      canvasEl = new CanvasText(svg);
    } else if (data instanceof CanvasPathData) {
      let svg = doc.createElementNS("http://www.w3.org/2000/svg", "path");
      canvasEl = new CanvasPath(svg);
    } else if (data instanceof CanvasImageData) {
      let svg = doc.createElementNS("http://www.w3.org/2000/svg", "image");
      canvasEl = new CanvasImage(svg);
    } else {
      throw new Error("unsupported svg element!");
    }

    canvasEl.setData(data);
    return canvasEl;
  }
}

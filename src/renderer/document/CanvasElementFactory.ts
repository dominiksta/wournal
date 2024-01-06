import { CanvasElement, CanvasElementDTO } from "./CanvasElement";
import { CanvasImage } from "./CanvasImage";
import { CanvasPath } from "./CanvasPath";
import { CanvasText } from "./CanvasText";

export class CanvasElementFactory {

  /** Instantiate a new `CanvasElement` from an existing `SVGGraphicselement` */
  public static fromSvgElem(
    svg: SVGGraphicsElement
  ): CanvasElement<any> {
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
    doc: Document, dto: CanvasElementDTO
  ): CanvasElement<any> {
    let canvasEl: CanvasElement<any>;
    if (dto.name === 'Text') {
      let svg = doc.createElementNS("http://www.w3.org/2000/svg", "text");
      canvasEl = new CanvasText(svg);
    } else if (dto.name === 'Path') {
      let svg = doc.createElementNS("http://www.w3.org/2000/svg", "path");
      canvasEl = new CanvasPath(svg);
    } else if (dto.name === 'Image') {
      let svg = doc.createElementNS("http://www.w3.org/2000/svg", "image");
      canvasEl = new CanvasImage(svg);
    } else {
      throw new Error("unsupported svg element!");
    }

    canvasEl.deserialize(dto);
    return canvasEl;
  }
}

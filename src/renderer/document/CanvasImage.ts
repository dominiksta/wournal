import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { CanvasElement, CanvasElementDTO } from "./CanvasElement";
import { Rect } from "./types";

export interface CanvasImageDTO extends CanvasElementDTO {
  name: 'Image';
  dataUrl: string;
  rect: Rect;
}

export class CanvasImage extends CanvasElement<CanvasImageDTO> {

  constructor(
    /** The actual underlying svg path */
    protected _svgElem: SVGImageElement,
  ) {
    super(_svgElem);

    // we will have to handle preserving aspect ration ourselves when
    // resizing diagonally
    this._svgElem.setAttribute("preserveAspectRatio", "none");
  }

  public static fromNewElement(): CanvasImage {
    return new CanvasImage(
      document.createElementNS("http://www.w3.org/2000/svg", "image")
    );
  }

  public override setColor(color: string): void { }
  public override setStrokeWidth(width: CanvasToolStrokeWidth): void { }

  private setRect(r: Rect): void {
    this._svgElem.setAttribute("x", r.x.toString());
    this._svgElem.setAttribute("y", r.y.toString());
    this._svgElem.setAttribute("width", r.width.toString());
    this._svgElem.setAttribute("height", r.height.toString());
  }

  private getRect(): Rect {
    return {
      x: parseFloat(this._svgElem.getAttribute("x")),
      y: parseFloat(this._svgElem.getAttribute("y")),
      width: parseFloat(this._svgElem.getAttribute("width")),
      height: parseFloat(this._svgElem.getAttribute("height")),
    };
  }

  public override deserialize(dto: CanvasImageDTO): void {
    console.assert(dto.name === 'Image');
    this._svgElem.setAttribute("href", dto.dataUrl);
    this.setRect(dto.rect);
  }

  public override serialize(): CanvasImageDTO {
    return {
      name: 'Image',
      dataUrl: this._svgElem.getAttribute('href'),
      rect: this.getRect(),
    }
  }

  public override writeTransform(): void {
    const curr = this.getRect();
    const t = this.currentTransform;

    this.setRect({
      x: (curr.x * t.scaleX) + t.translateX,
      y: (curr.y * t.scaleY) + t.translateY,
      width: curr.width * t.scaleX,
      height: curr.height * t.scaleY,
    });
    this.resetTransform();
  }
}

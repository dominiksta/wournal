export abstract class BackgroundGenerator {
  /** Set from the outside after instatition */
  public width: number;
  /** Set from the outside after instatition */
  public height: number;
  /** Set from the outside after instatition */
  public layer: SVGGElement;

  /** Sets child elements of `g` that draw a background */
  public generate(
    width: number, height: number, g: SVGGElement
  ): void {
    for (let el of g.childNodes) g.removeChild(el);
  }
}

export class BackgroundGeneratorColor extends BackgroundGenerator {
  constructor(private color: string = "white") { super(); }

  public generate(width: number, height: number, g: SVGGElement): void {
    super.generate(width, height, g);
    let rect = g.ownerDocument.createElementNS(
      "http://www.w3.org/2000/svg", "rect"
    );
    rect.setAttribute("width", width.toString());
    rect.setAttribute("height", height.toString());
    rect.setAttribute("fill", this.color);
    rect.setAttribute("stroke", this.color);
    g.appendChild(rect);
  }
}

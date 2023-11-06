import { TransformableSVGElement } from "./TransformableSVGElement";

const EDGE_WIDTH = 10;
const MAIN_STROKE_WIDTH = 1;
const CORNER_SIZE = 10;

export class CanvasSelectionDisplay extends TransformableSVGElement {

  private _mainRect: SVGRectElement = null;
  get mainRect() { return this._mainRect; }

  private edges: {
    top: SVGPathElement,
    right: SVGPathElement,
    bottom: SVGPathElement,
    left: SVGPathElement,
  } = {
      top: null, right: null, bottom: null, left: null,
    }

  private corners: {
    topLeft: SVGPathElement,
    topRight: SVGPathElement,
    bottomRight: SVGPathElement,
    bottomLeft: SVGPathElement,
  } = {
      topLeft: null, topRight: null, bottomRight: null, bottomLeft: null,
    }

  /** The element that was last clicked */
  private _lastClicked: "main" | "top" | "right" | "bottom" | "left"
    | "topLeft" | "topRight" | "bottomRight" | "bottomLeft" = "main";
  get lastClicked() { return this._lastClicked };


  constructor(protected _svgElem: SVGGElement) {
    super(_svgElem);

    this._mainRect = this._svgElem.ownerDocument.createElementNS(
      "http://www.w3.org/2000/svg", "rect"
    );
    this._mainRect.setAttribute("stroke", "darkblue");
    this._mainRect.setAttribute("stroke-opacity", "0.5");
    this._mainRect.setAttribute("stroke-width", MAIN_STROKE_WIDTH.toString());
    this._mainRect.setAttribute("fill", "lightblue");
    this._mainRect.setAttribute("fill-opacity", "0.5");
    this._mainRect.addEventListener("mousedown", (e) => {
      this._lastClicked = "main";
    });
    this._mainRect.style.cursor = "move";

    const createPath = (side: "top" | "right" | "bottom" | "left") => {
      let path = this._svgElem.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg", "path"
      );
      path.setAttribute("stroke", "black");
      path.setAttribute("stroke-opacity", "0");
      path.setAttribute("stroke-width", EDGE_WIDTH.toString());

      path.addEventListener("mousedown", (e) => {
        this._lastClicked = side;
      });
      return path;
    }
    this.edges.top = createPath("top");
    this.edges.right = createPath("right");
    this.edges.bottom = createPath("bottom");
    this.edges.left = createPath("left");

    const createCorner = (
      side: "topLeft" | "topRight" | "bottomLeft" | "bottomRight"
    ) => {
      let rect = this._svgElem.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg", "rect"
      );
      rect.setAttribute("stroke", "darkblue");
      rect.setAttribute("stroke-opacity", "0");
      rect.setAttribute("fill-opacity", "0");
      // rect.setAttribute("stroke-width", "0.5");
      // rect.setAttribute("fill", "white");

      rect.addEventListener("mousedown", (e) => {
        this._lastClicked = side;
      });
      return rect;
    }

    this.corners.topLeft = createCorner("topLeft");
    this.corners.topRight = createCorner("topRight");
    this.corners.bottomLeft = createCorner("bottomLeft");
    this.corners.bottomRight = createCorner("bottomRight");

    this._svgElem.appendChild(this.mainRect);
    for (let [_, el] of Object.entries(this.edges))
      this._svgElem.appendChild(el);
    for (let [_, el] of Object.entries(this.corners))
      this._svgElem.appendChild(el);

    this.setCursorState("creating");
  }


  public setCursorState(state: "idle" | "creating") {
    switch (state) {
      case "creating":
        for (let [_, el] of Object.entries(this.corners))
          el.style.cursor = "crosshair";
        for (let [_, el] of Object.entries(this.edges))
          el.style.cursor = "crosshair";
        break;
      case "idle":
        this.edges.top.style.cursor = "n-resize";
        this.edges.right.style.cursor = "e-resize";
        this.edges.bottom.style.cursor = "n-resize";
        this.edges.left.style.cursor = "e-resize";
        this.corners.topLeft.style.cursor = "nw-resize";
        this.corners.topRight.style.cursor = "ne-resize";
        this.corners.bottomLeft.style.cursor = "sw-resize";
        this.corners.bottomRight.style.cursor = "se-resize";
        break;
    }
  }

  public getMainRect(): DOMRect {
    return DOMRect.fromRect({
      x: parseFloat(this.mainRect.getAttribute("x")),
      y: parseFloat(this.mainRect.getAttribute("y")),
      width: parseFloat(this.mainRect.getAttribute("width")),
      height: parseFloat(this.mainRect.getAttribute("height")),
    })
  }

  /** Get the "hitbox" of the entire selection display (including the edges) */
  public hitbox(): DOMRect {
    let mainRect = this.getMainRect();
    return DOMRect.fromRect({
      x: mainRect.x - EDGE_WIDTH / 2,
      y: mainRect.y - EDGE_WIDTH / 2,
      width: mainRect.width + EDGE_WIDTH,
      height: mainRect.height + EDGE_WIDTH,
    });
  }

  /** Set the dimension to DOMRect r */
  public setDimension(r: DOMRect) {
    this.mainRect.setAttribute("x", r.x.toString());
    this.mainRect.setAttribute("y", r.y.toString());
    this.mainRect.setAttribute("width", r.width.toString() + "px");
    this.mainRect.setAttribute("height", r.height.toString() + "px");

    this.edges.top.setAttribute(
      "d", `M${r.x} ${r.y} L${r.x + r.width} ${r.y}`
    );
    this.edges.right.setAttribute(
      "d", `M${r.x + r.width} ${r.y} L${r.x + r.width} ${r.y + r.height}`
    );
    this.edges.bottom.setAttribute(
      "d", `M${r.x} ${r.y + r.height} L${r.x + r.width} ${r.y + r.height}`
    );
    this.edges.left.setAttribute(
      "d", `M${r.x} ${r.y} L${r.x} ${r.y + r.height}`
    );

    this.corners.topLeft.setAttribute("x", (r.x - CORNER_SIZE / 2).toString());
    this.corners.topLeft.setAttribute("y", (r.y - CORNER_SIZE / 2).toString());
    this.corners.topLeft.setAttribute("width", CORNER_SIZE.toString());
    this.corners.topLeft.setAttribute("height", CORNER_SIZE.toString());

    this.corners.topRight.setAttribute("x", (r.x + r.width - CORNER_SIZE / 2).toString());
    this.corners.topRight.setAttribute("y", (r.y - CORNER_SIZE / 2).toString());
    this.corners.topRight.setAttribute("width", CORNER_SIZE.toString());
    this.corners.topRight.setAttribute("height", CORNER_SIZE.toString());

    this.corners.bottomLeft.setAttribute("x", (r.x - CORNER_SIZE / 2).toString());
    this.corners.bottomLeft.setAttribute("y", (r.y + r.height - CORNER_SIZE / 2).toString());
    this.corners.bottomLeft.setAttribute("width", CORNER_SIZE.toString());
    this.corners.bottomLeft.setAttribute("height", CORNER_SIZE.toString());

    this.corners.bottomRight.setAttribute("x", (r.x + r.width - CORNER_SIZE / 2).toString());
    this.corners.bottomRight.setAttribute("y", (r.y + r.height - CORNER_SIZE / 2).toString());
    this.corners.bottomRight.setAttribute("width", CORNER_SIZE.toString());
    this.corners.bottomRight.setAttribute("height", CORNER_SIZE.toString());
  }

  public override writeTransform(): void {
    const t = this.currentTransform;
    const curr = this.getMainRect();
    this.setDimension(DOMRect.fromRect({
      x: (curr.x * t.scaleX) + t.translateX,
      y: (curr.y * t.scaleY) + t.translateY,
      width: curr.width * t.scaleX,
      height: curr.height * t.scaleY,
    }));
    this.resetTransform();
  }
}

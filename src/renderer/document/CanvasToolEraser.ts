import { rx } from "@mvuijs/core";
import { CanvasToolStrokeWidth } from "../persistence/ConfigDTO";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasPath } from "./CanvasPath";
import { CanvasSelection } from "./CanvasSelection";
import { CanvasTool } from "./CanvasTool";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoStack } from "./UndoStack";
import { WournalPage } from "./WournalPage";

export class CanvasToolEraser extends CanvasTool {
  private get conf() {
    return this.activePage.value.doc.toolConfig.value.CanvasToolEraser;
  };


  private erasing: boolean = false;
  protected toolUseStartPage: WournalPage = null;
  /**
   * Build up an array of undo actions to merge into one big undo action on
   * mouse up.
   */
  private currentUndo: UndoActionCanvasElements[] = [];

  public idleCursor = "default";

  constructor(
    protected activePage: rx.State<WournalPage>,
    protected undoStack: UndoStack,
    protected selection: CanvasSelection,
  ) {
    super(activePage, undoStack, selection);

    this.computeActualStrokeWidth();
    // To actually really reflect the area to be erased, we would have to
    // somehow listen to zoom events and change the cursor size
    // accordingly. Considering that xournal, xournal++ and pdf annotator
    // all don't do that and have constant cursor sizes for their erasers,
    // this should be fine for now.
    const cursorHeight = 10;
    this.idleCursor =
      `url('data:image/svg+xml;utf8,` +
      `<svg height="${cursorHeight}" ` +
      `     width="${cursorHeight}" ` +
      `     xmlns="http://www.w3.org/2000/svg">` +
      `  <rect x="0" y="0" ` +
      `        height="${cursorHeight}" ` +
      `        width="${cursorHeight}" ` +
      `        stroke="black" stroke-width="2" fill="white"></rect>` +
      `</svg>') ${cursorHeight / 2} ` +
      `${cursorHeight / 2}, auto`;
  }

  public override canSetStrokeWidth = true;
  public override canSetColor = false;

  private actualStrokeWidth: number;
  private computeActualStrokeWidth(): void {
    const confWidth = this.conf.strokeWidth;
    if (confWidth === "fine") this.actualStrokeWidth = 5;
    if (confWidth === "medium") this.actualStrokeWidth = 10;
    if (confWidth === "thick") this.actualStrokeWidth = 40;
  }

  public onMouseDown(e: MouseEvent): void {
    this.toolUseStartPage = this.activePage.value;
    if (this.toolUseStartPage === null) return;
    this.computeActualStrokeWidth();
    this.currentUndo = [];
    this.erasing = true;
    this.eraseTouched(e);
  }

  public onMouseUp(e: MouseEvent): void {
    if (this.currentUndo.length !== 0) {
      let finalUndo = new UndoActionCanvasElements(null, null, null);
      for (let i = this.currentUndo.length - 1; i >= 0; i--)
        finalUndo.add(this.currentUndo[i]);

      this.undoStack.push(finalUndo);
    }

    this.erasing = false;
  }

  public onMouseMove(e: MouseEvent): void {
    if (this.toolUseStartPage === null || !this.erasing) return;

    this.eraseTouched(e);
  }

  private eraseTouched(e: MouseEvent) {
    const mouse = this.toolUseStartPage.viewportCoordsToCanvas(e);

    const eraserRect = DOMRect.fromRect({
      x: mouse.x - this.actualStrokeWidth / 2,
      y: mouse.y - this.actualStrokeWidth / 2,
      height: this.actualStrokeWidth,
      width: this.actualStrokeWidth,
    });
    for (let node of this.toolUseStartPage.activePaintLayer.children) {
      const elRect = this.toolUseStartPage.viewportDOMRectToCanvas(
        node.getBoundingClientRect());
      // Ignore non-path elements. When text-boxes are added in the
      // future, they should not be affected by erasers.
      if (!(node instanceof SVGPathElement)) continue;

      // pre-select elements where mouse is at least in bounding client
      // rect
      if (SVGUtils.rectIntersect(elRect, eraserRect)) {
        let path = new CanvasPath(node);
        // SVGUtils.tmpDisplayRect(
        //     eraserRect, this.toolUseStartPage.activePaintLayer,
        //     500, "blue"
        // );
        // path.pulsePoints();

        // check wether mouse is actually on path
        if (this.conf.eraseStrokes) {
          if (path.isTouchingRect(eraserRect)) {
            this.currentUndo.push(
              new UndoActionCanvasElements([node], null, null)
            );
            this.toolUseStartPage.activePaintLayer
              .removeChild(node);
          }
        } else {
          this.currentUndo.push(path.eraseRect(eraserRect));
        }
      }
    }
  }


  onDeselect(): void { }
}

import { rx } from "@mvui/core";
import { LOG } from "../util/Logging";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasElement, CanvasElementDTO } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import CanvasSelectionButtons from "./CanvasSelectionButtons";
import { CanvasSelectionDisplay } from "./CanvasSelectionDisplay";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoStack } from "./UndoStack";
import { WournalPage } from "./WournalPage";

export class CanvasSelection {
  private _page: WournalPage;
  get page() { return this._page; }

  private _available = new rx.State(false);
  public available = this._available.asReadonly();

  private mouseBeforeMove: { x: number, y: number };
  private rectBeforeResize: DOMRect;

  private _selectionDisplay: CanvasSelectionDisplay;
  get selectionDisplay() { return this._selectionDisplay };

  private state: "idle" | "resizing" | "moving" = "idle";
  get currentlyInteracting(): boolean {
    return this.state === "resizing" || this.state === "moving";
  }

  private _selection: { el: CanvasElement<any>, savedData: CanvasElementDTO }[] = [];
  get selection(): CanvasElement<any>[] { return this._selection.map(e => e.el); }

  private selectionButtons: CanvasSelectionButtons;

  constructor(
    private undoStack: UndoStack,
    private onCut: () => void,
    private onCopy: () => void,
    private onDelete: () => void,
  ) {
    this.selectionButtons = new CanvasSelectionButtons(
      this.onCut,
      () => { this.onCopy(); this.clear(); },
      this.onDelete,
    )
  }

  public init(page: WournalPage) {
    this._selection = [];
    this._page = page;
    this.clear();
    this._selectionDisplay = new CanvasSelectionDisplay(
      this._page.toolLayer.ownerDocument.createElementNS(
        "http://www.w3.org/2000/svg", "g"
      ));
    this._page.toolLayer.appendChild(this._selectionDisplay.svgElem);
  }

  public async showButtons(show: boolean) {
    if (show) {
      if (!this._page.display.contains(this.selectionButtons))
        this._page.display.appendChild(this.selectionButtons);
      this.selectionButtons.style.position = 'absolute';
      await new Promise(requestAnimationFrame);
      const pad = 10;

      const selRect        = this.selectionDisplay.mainRect.getBoundingClientRect();
      const pageRect       = this.page.display.getBoundingClientRect();
      const docWrapperRect = this.page.doc.parentElement.getBoundingClientRect();
      const buttonsRect    = this.selectionButtons.getBoundingClientRect();
      const pos = {
        y: selRect.y - pageRect.y,
        x: selRect.x - pageRect.x - 4, // 5 for page margin
      }
      pos.x += (selRect.width / 2) - (buttonsRect.width / 2);
      pos.x = Math.min(pageRect.width - buttonsRect.width - 20, Math.max(0, pos.x));
      const bottom = (selRect.y - docWrapperRect.y) < (pad * 4);
      console.log(docWrapperRect.y - selRect.y);
      if (bottom) pos.y += pad + selRect.height;
      else pos.y -= pad + buttonsRect.height;

      this.selectionButtons.style.top = `${pos.y}px`;
      this.selectionButtons.style.left = `${pos.x}px`;
    } else {
      this.selectionButtons.remove();
    }
  }

  /** Remove all elements from given `page` */
  public clear() {
    this._selection = [];
    this._available.next(false);
    this._selectionDisplay?.destroy(true);
    this.showButtons(false);
  }

  public onMouseDown(e: MouseEvent): void {
    e.stopPropagation();
    const mouse = this.page.viewportCoordsToCanvas(e);
    this.showButtons(false);

    switch (this.state) {
      case "idle":
        for (let s of this._selection) s.savedData = s.el.serialize();
        if (this._selectionDisplay.lastClicked === "main") {
          this.mouseBeforeMove = { x: mouse.x, y: mouse.y };
          this.state = "moving";
        } else {
          this.rectBeforeResize = DOMRect.fromRect(this.selectionDisplay.getMainRect());
          this.state = "resizing";
        }
        break;
      case "moving":
      case "resizing":
        throw new Error(`onMouseDown called in ${this.state} state`);
    }
  }

  public onMouseMove(e: MouseEvent): void {
    if (this.state === "idle") return;
    e.stopPropagation();
    this.page.refreshClientRect();
    const mouse = this.page.viewportCoordsToCanvas(e);

    switch (this.state) {
      case "moving":
        let to = {
          x: mouse.x - this.mouseBeforeMove.x,
          y: mouse.y - this.mouseBeforeMove.y
        }
        for (let s of this._selection) {
          s.el.resetTransform();
          s.el.translate(to.x, to.y);
        }
        this._selectionDisplay.resetTransform();
        this._selectionDisplay.translate(to.x, to.y);
        break;
      case "resizing":
        const bef = this.rectBeforeResize;
        for (let s of this._selection) s.el.resetTransform();
        this._selectionDisplay.resetTransform();

        if (this._selectionDisplay.lastClicked === "main") {
          LOG.error("lastClicked = main in resizing state");
          return;
        }

        let dirs: ("top" | "right" | "bottom" | "left")[];
        switch (this._selectionDisplay.lastClicked) {
          case "top": dirs = ["top"]; break;
          case "right": dirs = ["right"]; break;
          case "bottom": dirs = ["bottom"]; break;
          case "left": dirs = ["left"]; break;
          case "topLeft": dirs = ["top", "left"]; break;
          case "topRight": dirs = ["top", "right"]; break;
          case "bottomLeft": dirs = ["bottom", "left"]; break;
          case "bottomRight": dirs = ["bottom", "right"]; break;
        }

        let resizeDirection: "top" | "right" | "bottom" | "left";
        if (dirs.length === 1) resizeDirection = dirs[0];
        else resizeDirection = dirs.indexOf("left") !== -1 ? "left" : "right";

        let factor: number;
        switch (resizeDirection) {
          case "top": factor = (bef.bottom - mouse.y) / (bef.bottom - bef.top);
            break;
          case "right": factor = (mouse.x - bef.left) / (bef.right - bef.left);
            break;
          case "bottom": factor = (mouse.y - bef.top) / (bef.bottom - bef.top);
            break;
          case "left": factor = (bef.right - mouse.x) / (bef.right - bef.left);
            break;
        }

        for (let d of dirs) {
          this._selectionDisplay.scaleInPlace(bef, d, factor);
          for (let s of this._selection) s.el.scaleInPlace(bef, d, factor);
        }
        break;
    }
  }

  public onMouseUp(e: MouseEvent): void {
    if (this.state === "idle") return;
    this.page.doc.shortcuts.focus();
    e.stopPropagation();
    switch (this.state) {
      case "moving":
      case "resizing":
        let undo = [];
        for (let s of this._selection) {
          s.el.writeTransform();
          undo.push({
            el: s.el.svgElem, dataBefore: s.savedData,
            dataAfter: s.el.serialize()
          })
        }
        this.undoStack.push(new UndoActionCanvasElements(
          null, undo, null
        ));
        this._selectionDisplay.writeTransform();
        this.state = "idle";
        this.showButtons(true);
        break;
    }
  }

  public setSelectionFromElements(page: WournalPage, els: CanvasElement<any>[]) {
    this.init(page);
    if (els.length === 0) return;
    const boundingRect = els
      .map(el => el.svgElem.getBoundingClientRect())
      .reduce(SVGUtils.boundingRectForTwo);

    const padding = 30;
    boundingRect.x -= padding / 2;
    boundingRect.y -= padding / 2;
    boundingRect.width += padding;
    boundingRect.height += padding;

    this._selectionDisplay.setDimension(page.viewportDOMRectToCanvas(boundingRect));
    this._selection = els.map(e => { return { el: e, savedData: e.serialize() } });
    this._selectionDisplay.setCursorState("idle");
    this._available.next(true);
    this.showButtons(true);
  }

  public setSelectionFromCurrentRect() {
    this._selectionDisplay.setCursorState("idle");
    const selRect = this.selectionDisplay.getMainRect();

    const canvasEls = Array
      .from(this.page.activePaintLayer.children)
      .filter(el => {
        if (!(el instanceof SVGGraphicsElement)) return false;
        const elRect = this.page.viewportDOMRectToCanvas(el.getBoundingClientRect());
        if (selRect.width < 5 && selRect.height < 5) { // "click to select"
          return SVGUtils.rectIntersect(selRect, elRect);
        } else { // actual rectangle
          return SVGUtils.rectInRect(selRect, elRect);
        }
      })
      .map(el => CanvasElementFactory.fromSvgElem(el as SVGGraphicsElement))

    this.setSelectionFromElements(this.page, canvasEls);

    this._available.next(true);
  }
}

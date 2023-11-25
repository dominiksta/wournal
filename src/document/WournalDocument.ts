import { CanvasToolConfig, CanvasToolStrokeWidth, ConfigDTO } from "../persistence/ConfigDTO";
import { DocumentDTO } from "../persistence/DocumentDTO";
import { ClipboardUtils } from "../util/ClipboardUtils";
import { DSUtils } from "../util/DSUtils";
import { FileUtils } from "../util/FileUtils";
import { Newable } from "../util/Newable";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasElement } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { CanvasImage, CanvasImageData } from "./CanvasImage";
import { CanvasText, CanvasTextData } from "./CanvasText";
import { CanvasTool, CanvasToolName } from "./CanvasTool";
import { CanvasToolFactory } from "./CanvasToolFactory";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasSelection } from "./CanvasSelection";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoStack } from "./UndoStack";
import { PageProps, WournalPage } from "./WournalPage";
import { computeZoomFactor, WournalPageSize } from "./WournalPageSize";
import { Component, h, rx, style } from "@mvui/core";
import { theme } from "global-styles";
import { ShortcutManager } from "app/shortcuts";

@Component.register
export class WournalDocument extends Component {
  static useShadow = false;

  private _config: rx.State<ConfigDTO>;
  get config() { return this._config };
  private _shortcuts: ShortcutManager;
  get shortcuts() { return this._shortcuts };
  private _toolConfig: rx.State<CanvasToolConfig>;
  get toolConfig() { return this._toolConfig };

  /** An initial zoom factor, invisible to the user. */
  private initialZoomFactor: number;

  private copyBuffer: { content: CanvasElement[], time: Date } =
    { content: [], time: new Date() };
  /**  */
  private systemClipboard: {
    image: { content: string, time: Date }, text: { content: string, time: Date }
  } = {
      image: { content: "", time: new Date() },
      text: { content: "", time: new Date() }
    }

  public pages = new rx.State<WournalPage[]>([]);
  private zoom: number = 1;


  /** Store tool set before right click */
  private toolBeforeRightClick: CanvasToolName;

  private display = document.createElement('div');

  public identification: string = "wournaldoc.woj";

  private constructor(
    config: rx.State<ConfigDTO>,
    shortcuts: ShortcutManager,
  ) {
    super();
    this.display.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.display.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.display.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.display.addEventListener("contextmenu", (e) => { e.preventDefault() });
    this.display.style.background = theme.documentBackground;
    shortcuts.pasteImageHandler = this.onPasteImage.bind(this);
    shortcuts.pastePlainTextHandler = this.onPastePlainText.bind(this);
    this._config = config;
    this._shortcuts = shortcuts;

    this.initialZoomFactor = computeZoomFactor();
    this.setTool(CanvasToolPen);
    this.subscribe(this.activePage, p => {
      this.pages.value.forEach(p => p.display.classList.remove('active'));
      p.display.classList.add('active');
    })
  }

  public setActivePageForCurrentScroll() {
    const outer = this.parentElement.getBoundingClientRect();
    let minDiff = Infinity; let bestPage = this.pages.value[0];
    for (const page of this.pages.value) {
      const rect = page.display.getBoundingClientRect();
      const curr = Math.abs(rect.top - outer.top) + Math.abs(outer.bottom - rect.bottom);
      if (curr < minDiff) {
        minDiff = curr; bestPage = page;
      }
    }
    if (bestPage !== this.activePage.value) this.activePage.next(bestPage);
  }

  render() { return [ h.div(this.display) ] }

  static styles = style.sheet({
    '.wournal-page.active': {
      borderColor: `${theme.documentActive} !important`,
    }
  })

  // ------------------------------------------------------------
  // initialization and serialization
  // ------------------------------------------------------------

  public static create(
    config: rx.State<ConfigDTO>, shortcuts: ShortcutManager,
  ): WournalDocument {
    let doc = new WournalDocument(config, shortcuts);
    const firstPage = WournalPage.createNew(
      doc, {
        ...WournalPageSize.DINA4, backgroundColor: '#FFFFFF',
        backgroundStyle: 'graph',
      },
    );
    doc.addPage(firstPage);
    doc._toolConfig = new rx.State(DSUtils.copyObj(config.value.tools));
    doc.undoStack.clear();
    return doc;
  }

  public static fromDto(
    config: rx.State<ConfigDTO>, shortcuts: ShortcutManager, dto: DocumentDTO
  ): WournalDocument {
    let doc = new WournalDocument(config, shortcuts);
    doc.identification = dto.identification;
    doc._toolConfig = new rx.State(DSUtils.copyObj(config.value.tools));
    for (let page of dto.pagesSvg) {
      doc.addPageFromSvg(page);
    }
    doc.undoStack.clear();
    return doc;
  }

  public toDto(): DocumentDTO {
    return new DocumentDTO(
      this.identification,
      this.pages.value.map((p) => p.asSvgString()),
    );
  }

  // ------------------------------------------------------------
  // undo
  // ------------------------------------------------------------

  private _undoStack = new UndoStack(this);
  public get undoStack() { return this._undoStack; }

  public undo(): void {
    this.currentTool.value.onDeselect();
    this.selection.clear();
    this._undoStack.undo();
  }

  public redo(): void {
    this.currentTool.value.onDeselect();
    this.selection.clear();
    this._undoStack.redo();
  }

  // ------------------------------------------------------------
  // selection
  // ------------------------------------------------------------

  public selection = new CanvasSelection(this._undoStack);

  public selectionCut(noCopy: boolean = false): void {
    if (this.selection.selection.length === 0) return;
    let deleted = [];
    for (let el of this.selection.selection) deleted.push(el);

    this._undoStack.push(new UndoActionCanvasElements(
      DSUtils.copyArr(deleted.map(e => e.svgElem)), null, null
    ));

    for (let el of this.selection.selection) el.destroy();
    this.selection.clear();

    if (!noCopy) {
      this.copyBuffer.content = deleted;
      this.copyBuffer.time = new Date();
    }
  }

  public selectionCopy(): void {
    if (this.selection.selection.length === 0) return;
    this.copyBuffer.content = [];
    this.copyBuffer.time = new Date();
    // copy array instead of assigning ref
    for (let el of this.selection.selection) {
      this.copyBuffer.content.push(el);
    }
  }

  /** Paste either `copyBuffer` or `systemClipboard` by recency */
  public selectionOrClipboardPaste(first: boolean = false): void {
    if (first && this.copyBuffer.content.length !== 0) {
      this.selectionPaste();
    } else if (this.copyBuffer.time < this.systemClipboard.image.time) {
      this.pasteImage(this.systemClipboard.image.content);
    } else if (this.copyBuffer.time < this.systemClipboard.text.time) {
      this.pastePlainText(this.systemClipboard.text.content);
    } else if (this.copyBuffer.content.length !== 0) {
      this.selectionPaste();
    }
  }

  /** Paste `copyBuffer` */
  public selectionPaste(): void {
    const page = this.activePage.value;
    const layer = page.activePaintLayer;
    let newEls: CanvasElement[] = [];
    for (let el of this.copyBuffer.content) {
      let newEl = CanvasElementFactory.fromData(
        this.display.ownerDocument, el.getData()
      );
      layer.appendChild(newEl.svgElem);
      newEl.translate(20, 20);
      newEl.writeTransform();
      newEls.push(newEl);
    }
    this.selection.init(page);
    this.selection.setSelectionFromElements(page, newEls);

    this._undoStack.push(new UndoActionCanvasElements(
      null, null, DSUtils.copyArr(newEls.map(e => e.svgElem))
    ));
  }

  /** Remember pasted image and call `selectionOrClipboardPaste` */
  private async onPasteImage(dataUrl: string): Promise<void> {
    /*
     * HACK: This check will result in an unintended behaviour/bug: When the
     * user pastes an image from the clipboard and then proceeds to use the
     * internal copy function, he can then not paste the same image again by
     * putting it into the system clipboard again.
     *
     * There seem to be two possible solutions for this:
     * - Write the internal `copyBuffer` to the system clipboard with the
     *   'copy' event (and setting a custom mimetype to not interfere with
     *   the clipboard of other applications) and then always paste from the
     *   system clipboard. This is not exactly trivial because it would
     *   require (de-)serializing `copyBuffer` as a string - but it should
     *   be considered at a later point.
     * - Use some clipboard api to bind a seperate shortcut like
     *   Ctrl+Shift+V to explicitly paste from the system clipboard. However
     *   this is also not really intuitive and it is also difficult (or even
     *   impossible?) to implement cross-browser with the currently available
     *   APIs.
     */
    const first = (this.systemClipboard.image.content === ""
      && this.systemClipboard.text.content === "");
    if (dataUrl !== this.systemClipboard.image.content) {
      this.systemClipboard.image.content = dataUrl;
      this.systemClipboard.image.time = new Date();
    }
    this.selectionOrClipboardPaste(first);
  }

  /** Insert the given image on the current page */
  private async pasteImage(dataUrl: string): Promise<void> {
    if (!this.activePage.value) return;

    let imageEl = CanvasImage.fromNewElement();
    const dimensions = await FileUtils.imageDimensionsForDataUrl(dataUrl);
    imageEl.setData(new CanvasImageData(dataUrl, DOMRect.fromRect({
      x: 10, y: 10, width: dimensions.width, height: dimensions.height
    })));

    this.activePage.value.activePaintLayer.appendChild(imageEl.svgElem);
    this.selection.setSelectionFromElements(this.activePage.value, [imageEl]);
    this._undoStack.push(new UndoActionCanvasElements(
      null, null, [imageEl.svgElem]
    ));
  }

  /** Remember pasted text and call `selectionOrClipboardPaste` */
  private onPastePlainText(text: string): void {
    // HACK: See `onPasteImage`
    const first = (this.systemClipboard.image.content === ""
      && this.systemClipboard.text.content === "");
    if (text !== this.systemClipboard.text.content) {
      this.systemClipboard.text.content = text;
      this.systemClipboard.text.time = new Date();
    }
    this.selectionOrClipboardPaste(first);
  }

  /** Insert the given text on the current page */
  private pastePlainText(text: string): void {
    if (!this.activePage) return;

    const c = this.toolConfig.value.CanvasToolText;
    let textEl = CanvasText.fromData(
      this.display.ownerDocument,
      // TODO: find a more sane paste position then 10,10
      new CanvasTextData(
        text, { x: 10, y: 10 }, c.fontSize, c.fontStyle, c.fontWeight,
        c.fontFamily, c.color,
      ));

    this.activePage.value.activePaintLayer.appendChild(textEl.svgElem);
    this.selection.setSelectionFromElements(this.activePage.value, [textEl]);
    this._undoStack.push(new UndoActionCanvasElements(
      null, null, [textEl.svgElem]
    ));
  }

  // ------------------------------------------------------------
  // adding pages
  // ------------------------------------------------------------

  public activePage = new rx.State(
    // dummy page, is immediatly replaced on construction
    WournalPage.createNew(this, {
      width: 0, height: 0, backgroundColor: '#FFFFFF', backgroundStyle: 'blank'
    })
  );

  public addNewPage(init: PageProps): void {
    this.addPage(WournalPage.createNew(this, init));
  }

  public addPageFromSvg(svg: string) {
    this.addPage(WournalPage.fromSvgString(this, svg));
  }

  private addPage(page: WournalPage) {
    page.setZoom(this.zoom * this.initialZoomFactor);
    this.display.appendChild(page.display);
    this.pages.next(v => [...v, page]);
    page.toolLayer.style.cursor = this.currentTool.value.idleCursor;
    if (this.pages.value.length === 1) this.activePage.next(page);
  }

  // ------------------------------------------------------------
  // zoom
  // ------------------------------------------------------------

  /** Set the zoom level of all pages. [0-inf[ */
  public setZoom(zoom: number) {
    this.zoom = zoom;
    for (let page of this.pages.value) page.setZoom(zoom * this.initialZoomFactor);
  }
  public getZoom(): number { return this.zoom; }

  public setZoomFitWidth() {
    const page = this.activePage.value;
    const widthAvailable = this.display.getBoundingClientRect().width;
    const widthPage = page.canvasWidth;

    this.setZoom(widthAvailable / widthPage);
  }

  // ------------------------------------------------------------
  // tools
  // ------------------------------------------------------------

  public setTool(tool: Newable<CanvasTool>, noDeselect: boolean = false) {
    if (!noDeselect) this.currentTool.value.onDeselect();
    this.selection.clear();
    this.currentTool.next(new tool(
      this.activePage, this._undoStack, this.selection
    ));
    for (let page of this.pages.value)
      page.toolLayer.style.cursor = this.currentTool.value.idleCursor;
  }

  /** Reset the config of the current tool to loaded global config */
  public resetCurrentTool() {
    if (!DSUtils.hasKey(this._toolConfig.value, this.currentTool.value.name)
      || !DSUtils.hasKey(this._config.value.tools, this.currentTool.value.name))
      throw new Error(`Could not get config for tool ${this.currentTool.value}`)

    this._toolConfig.next(v => ({
      ...v,
      [this.currentTool.value.name]: DSUtils.copyObj(
        this._config.value.tools[
          this.currentTool.value.name as keyof CanvasToolConfig
        ]
      )
    }));
  }

  /** Called to update react state */
  public currentTool = new rx.State<CanvasTool>(new CanvasToolPen(
    this.activePage, this._undoStack, this.selection
  ));

  /** set stroke width for current tool or selection */
  public setStrokeWidth(width: CanvasToolStrokeWidth): void {
    if (this.selection.selection.length !== 0) {
      let changed = [];
      for (let el of this.selection.selection) {
        const dataBefore = el.getData();
        el.setStrokeWidth(width);
        changed.push({
          el: el.svgElem, dataBefore: dataBefore, dataAfter: el.getData()
        });
      }
      this._undoStack.push(new UndoActionCanvasElements(
        null, changed, null
      ));
    } else {
      if (this.currentTool.value.canSetStrokeWidth)
        this.toolConfig.next(v => {
          const n = DSUtils.copyObj(v);
          (n as any)[this.currentTool.value.name].strokeWidth = width;
          return n;
        })
    }
  }

  /** set color for current tool or selection */
  public setColor(color: string): void {
    if (this.selection.selection.length !== 0) {
      let changed = [];
      for (let el of this.selection.selection) {
        const dataBefore = el.getData();
        el.setColor(color);
        changed.push({
          el: el.svgElem, dataBefore: dataBefore, dataAfter: el.getData()
        });
      }
      this._undoStack.push(new UndoActionCanvasElements(
        null, changed, null
      ));
    } else {
      // if the current tool does not support color, fall back to pen -
      // this mimics xournal behaviour
      if (!this.currentTool.value.canSetColor) {
        this.setTool(CanvasToolPen);
      }
      this.toolConfig.next(v => {
        const n = DSUtils.copyObj(v);
        (n as any)[this.currentTool.value.name].color = color;
        return n;
      })
    }
  }

  // ----------------------------------------------------------------------
  // helpers
  // ----------------------------------------------------------------------

  private setPageAtPoint(pt: { x: number, y: number }) {
    // const start = performance.now();
    let result: WournalPage = null;
    for (let page of this.pages.value) {
      if (SVGUtils.pointInRect(
        pt, page.toolLayer.getBoundingClientRect()
      )) {
        result = page;
      }
    }
    // NOTE(dominiksta): This is actually suprisingly fast. I would not have
    // thought that over 2000 pages can be checked this way in under 1ms.
    // LOG.info(`took ${start - performance.now()}ms`);
    if (this.activePage.value !== result && result !== null) {
      this.pages.value.forEach(p => p.display.classList.remove('active'));
      result.display.classList.add('active');
      this.activePage.next(result)
    }
  }

  private onMouseDown(e: MouseEvent) {
    this.setPageAtPoint(e);
    if (this.activePage) this.activePage.value.onMouseDown(e);

    if (this.activePage && this.selection.selection.length !== 0) {
      const mouse = this.activePage.value.globalCoordsToCanvas(e);
      if (SVGUtils.pointInRect(mouse, this.selection.selectionDisplay.hitbox())) {
        this.selection.onMouseDown(e);
      } else {
        this.selection.clear();
        this.currentTool.value.onMouseDown(e);
      }
    } else {
      if (e.button === 2) { // right click
        this.toolBeforeRightClick = this.currentTool.value.name;
        this.setTool(CanvasToolFactory.forName(this._config.value.binds.rightClick));
      }
      this.currentTool.value.onMouseDown(e);
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (this.selection.currentlyInteracting) {
      this.selection.onMouseUp(e)
    } else {
      this.currentTool.value.onMouseUp(e);
      if (e.button === 2) // right click
        this.setTool(
          CanvasToolFactory.forName(this.toolBeforeRightClick), true
        );
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.selection.currentlyInteracting)
      this.selection.onMouseMove(e)
    else
      this.currentTool.value.onMouseMove(e);
  }


}

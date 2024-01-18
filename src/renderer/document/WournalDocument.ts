import { CanvasToolConfig, CanvasToolStrokeWidth, ConfigDTO } from "../persistence/ConfigDTO";
import { DocumentDTO } from "../persistence/DocumentDTO";
import { DSUtils } from "../util/DSUtils";
import { FileUtils } from "../util/FileUtils";
import { Newable } from "../util/Newable";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasElement, CanvasElementDTO } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { CanvasImage } from "./CanvasImage";
import { CanvasText } from "./CanvasText";
import { CanvasTool, CanvasToolName } from "./CanvasTool";
import { CanvasToolFactory } from "./CanvasToolFactory";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasSelection } from "./CanvasSelection";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoAction, UndoStack } from "./UndoStack";
import { PageProps, WournalPage } from "./WournalPage";
import { DEFAULT_ZOOM_FACTOR, WournalPageSize } from "./WournalPageSize";
import { Component, h, rx, style } from "@mvui/core";
import { theme } from "global-styles";
import { ShortcutManager } from "app/shortcuts";
import { DOMUtils } from "util/DOMUtils";
import { WournalApi } from "api";
import { inject } from "dependency-injection";
import { ShortcutsCtx } from "app/shortcuts-context";
import { ConfigCtx } from "app/config-context";
import { ApiCtx } from "app/api-context";
import ZipFile from "util/ZipFile";
import { FileNotFoundError, PDFCache } from "pdf/PDFCache";

@Component.register
export class WournalDocument extends Component {
  static useShadow = false;

  public pages = new rx.State<WournalPage[]>([]);
  public isSinglePage = false;

  private zoom: number = 1;

  /** Store tool set before right/middle click */
  private toolBeforeTmpTool: CanvasToolName;

  private display = document.createElement('div');

  public readonly shortcuts: ShortcutManager;
  public readonly config: rx.State<ConfigDTO>;
  public readonly toolConfig: rx.State<CanvasToolConfig>;
  public readonly api: WournalApi;
  private clipboard = inject('SystemClipboard');

  private constructor(
    getContext: Component['getContext'],
    public identification: string | undefined,
  ) {
    super();
    this.display.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.display.addEventListener("mouseleave", this.onMouseUp.bind(this));
    this.display.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.display.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.display.addEventListener("contextmenu", (e) => { e.preventDefault() });
    this.display.style.background = theme.documentBackground;

    this.shortcuts = getContext(ShortcutsCtx);
    this.config = getContext(ConfigCtx);
    this.toolConfig = new rx.State(DSUtils.copyObj(this.config.value.tools));
    this.api = getContext(ApiCtx);

    this.setTool(CanvasToolPen);
    this.subscribe(this.activePage, p => {
      this.pages.value.forEach(p => p.display.classList.remove('active'));
      p.display.classList.add('active');
    });

    this.subscribe(this.activePage, async _ => {
      // not ideal that we have to await a frame here, but it is needed for
      // `renderPDFIfNeeded` to check wether the page is currently visible
      await new Promise(requestAnimationFrame);
      for (const p of this.pages.value) p.renderPDFIfNeeded();
    });

    this.subscribe(this.pages, pages => {
      const correctPositions =
        pages.map((p, idx) => p.display === this.display.children[idx]);
      console.assert(correctPositions.indexOf(false) === -1, pages);
    });
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
    getContext: Component['getContext'], firstPageProps?: PageProps,
  ): WournalDocument {
    let doc = new WournalDocument(getContext, undefined);
    const firstPage = WournalPage.createNew(
      doc, firstPageProps ?? {
        ...WournalPageSize.DINA4, backgroundColor: '#FFFFFF',
        backgroundStyle: 'graph',
      },
   );
    doc.addPage(firstPage);
    doc.undoStack.clear();
    return doc;
  }

  public static async fromFile(
    getContext: Component['getContext'],
    fileName: string, blob: Blob,
    pdfNotFoundActions: {
      fileName: string, replaceOrRemove: string | false
    }[] = [],
  ): Promise<WournalDocument | FileNotFoundError> {
    const doc = new this(getContext, fileName);

    // woj
    // ----------------------------------------------------------------------
    if (fileName.toLowerCase().endsWith('.woj')) {
      const zipFile = await ZipFile.fromBlob(new Blob([blob]));
      const pagesSvg = await Promise.all((await zipFile.allFiles())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async f => (new TextDecoder()).decode(await f.blob.arrayBuffer())));
      for (const svg of pagesSvg) {
        const page = await WournalPage.fromSvgString(doc, svg, pdfNotFoundActions);
        if (page instanceof FileNotFoundError) return page;
        doc.addPage(page);
      }
    // pdf
    // ----------------------------------------------------------------------
    } else if (fileName.toLowerCase().endsWith('.pdf')) {
      const pdf = await PDFCache.fromBlob(blob, fileName);
      for (let i = 1; i <= pdf.numPages; i++) {
        const pdfPage = await pdf.getPage(i);
        const viewport = pdfPage.getViewport({ scale: doc.zoom});

        const wournalPage = WournalPage.createNew(doc, {
          backgroundColor: '#FFFFFF',
          backgroundStyle: 'blank',
          height: viewport.height, width: viewport.height,
          pdfMode: {
            fileName, location: 'filesystem', pageNr: i,
          }
        });

        // TODO: filename default as woj on same path
        doc.identification = undefined;
        doc.addPage(wournalPage);
      }
    // svg
    // ----------------------------------------------------------------------
    } else if (fileName.toLowerCase().endsWith('.svg')) {
      const svg = await blob.text();
      const page = await WournalPage.fromSvgString(doc, svg, pdfNotFoundActions);
      if (page instanceof FileNotFoundError) return page;
      doc.addPage(page);
      if (WournalPage.svgIsMarkedAsWournalPage(svg)) {
        doc.isSinglePage = true;
      } else { // background svg
        const page1 = doc.pages.value[0];
        page1.setPageProps({
          ...page1.getPageProps(),
          backgroundColor: '#FFFFFF', backgroundStyle: 'blank',
        });
      }
    }
    doc.undoStack.clear();
    return doc;
  }

  public async toFile(): Promise<Blob> {
    const pages = this.pages.value;
    if (this.isSinglePage) {
      return FileUtils.utf8StringToBlob(pages[0].asSvgString());
    } else {
      const zipFile = new ZipFile();
      pages.forEach((p, i) =>
        zipFile.addFile(String(i).padStart(4, '0') + '-page.svg', p.asSvgString()));
      return await zipFile.asBlob();
    }
  }

  public async free() {
    const annotatedPDFs = [];
    for (const page of this.pages.value) {
      page.pdfMode && annotatedPDFs.push(page.pdfMode.fileName);
      page.free();
    }
    for (const pdf of annotatedPDFs) await PDFCache.destroy(pdf);
  }

  // ------------------------------------------------------------
  // undo, dirty/saved
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

  private undoActionPreviousSave: UndoAction | undefined;
  public markSaved() {
    this.undoActionPreviousSave =
      this.undoStack.undoable[this.undoStack.undoable.length - 1];
  }
  public get dirty() {
    return this.undoActionPreviousSave !==
      this.undoStack.undoable[this.undoStack.undoable.length - 1];
  }

  // ------------------------------------------------------------
  // selection
  // ------------------------------------------------------------

  public selection = new CanvasSelection(this._undoStack);

  public selectionCut(noCopy: boolean = false): void {
    if (this.selection.selection.length === 0) return;
    const selection = this.selection.selection;

    this._undoStack.push(new UndoActionCanvasElements(
      DSUtils.copyArr(selection.map(e => e.svgElem)), null, null
    ));

    for (let el of selection) el.destroy();
    this.selection.clear();

    if (!noCopy) {
      this.clipboard.writeWournal(selection.map(el => el.serialize()))
    }
  }

  public selectionCopy(): void {
    const selection = this.selection.selection;
    if (selection.length === 0) return;
    this.clipboard.writeWournal(selection.map(el => el.serialize()));
  }

  public async pasteClipboard(): Promise<void> {
    const wournal = await this.clipboard.readWournal();
    if (wournal) { this.pasteWournal(wournal); return; }

    const image = await this.clipboard.readImage();
    if (image) { this.pasteImage(image); return; }

    const text = await this.clipboard.readText();
    if (text) { this.pasteText(text); return; }
  }

  private centerElementsCurrentViewPort(els: CanvasElement<any>[]) {
    const page = this.activePage.value;
    const rectDoc =
      page.globalDOMRectToCanvas(this.parentElement.getBoundingClientRect());
    const rectPage = page.globalDOMRectToCanvas(page.rect);
    const centerDoc = {
      x: rectDoc.left + rectDoc.width / 2,
      y: rectDoc.top  + rectDoc.height / 2,
    };

    const minBorderDiff = 50;
    const centerDest = {
      x: Math.min(
        rectPage.right - minBorderDiff,
        Math.max(rectPage.left + minBorderDiff, centerDoc.x)
      ),
      y: Math.min(
        rectPage.bottom - minBorderDiff,
        Math.max(rectPage.top + minBorderDiff, centerDoc.y)
      ),
    }

    const rectBounding = page.globalDOMRectToCanvas(
      els
        .map(el => el.svgElem.getBoundingClientRect())
        .reduce(SVGUtils.boundingRectForTwo)
    );
    const centerBounding = {
      x: rectBounding.left + rectBounding.width / 2,
      y: rectBounding.top  + rectBounding.height / 2,
    };

    const translate = {
      x: centerDest.x - centerBounding.x,
      y: centerDest.y - centerBounding.y,
    };

    for (let el of els) {
      el.translate(translate.x, translate.y);
      el.writeTransform();
    }
  }

  /** Paste `copyBuffer` */
  public pasteWournal(dtos: CanvasElementDTO[]): void {
    if (dtos.length === 0 || !this.activePage.value) return;
    const page = this.activePage.value;
    const layer = page.activePaintLayer;
    let newEls: CanvasElement<any>[] = [];
    for (let el of dtos) {
      const newEl =
        CanvasElementFactory.fromData(this.display.ownerDocument, el);
      layer.appendChild(newEl.svgElem);
      newEls.push(newEl);
    }

    this._undoStack.push(new UndoActionCanvasElements(
      null, null, DSUtils.copyArr(newEls.map(e => e.svgElem))
    ));

    this.selection.init(page);
    page.refreshClientRect();
    this.centerElementsCurrentViewPort(newEls);
    this.selection.setSelectionFromElements(page, newEls);
  }

  /** Insert the given image on the current page */
  private async pasteImage(dataUrl: string): Promise<void> {
    if (!this.activePage.value) return;

    const dimensions = await FileUtils.imageDimensionsForDataUrl(dataUrl);
    this.pasteWournal([{
      name: 'Image',
      dataUrl, rect: {
        x: 10, y: 10, width: dimensions.width, height: dimensions.height
      }
    }]);
  }

  /** Insert the given text on the current page */
  private pasteText(text: string): void {
    if (!this.activePage.value) return;

    const c = this.toolConfig.value.CanvasToolText;
    this.pasteWournal([{
        name: 'Text',
        text, pos: { x: 10, y: 10 },
        fontSize: c.fontSize, fontStyle: c.fontStyle,
        fontWeight: c.fontWeight, fontFamily: c.fontFamily,
        color: c.color,
    }]);
  }

  // ------------------------------------------------------------
  // pages
  // ------------------------------------------------------------

  public activePage = new rx.State(
    // dummy page, is immediatly replaced on construction
    WournalPage.createNew(this, {
      width: 0, height: 0, backgroundColor: '#FFFFFF', backgroundStyle: 'blank'
    })
  );

  private UndoActionPage = class implements UndoAction {
    constructor(
      private doc: WournalDocument,
      private pagesRemoved: { idx: number, page: WournalPage }[],
      private pagesAdded: { idx: number, page: WournalPage }[],
    ) { }

    redo() {
      for (const p of this.pagesRemoved) this.doc.deletePage(p.idx + 1, false);
      for (const p of this.pagesAdded) this.doc.addPage(p.page, p.idx, false);
    }

    undo() {
      for (const p of this.pagesAdded) this.doc.deletePage(p.idx + 1, false);
      for (const p of this.pagesRemoved) this.doc.addPage(p.page, p.idx, false);
    }
  }

  public addNewPage(
    init: PageProps, addAfterPageNr: number = -1
  ): void {
    this.addPage(WournalPage.createNew(this, init), addAfterPageNr);
  }

  private addPage(
    page: WournalPage, addAfterPageNr: number = -1,
    undoable = true
  ) {
    page.setZoom(this.zoom * DEFAULT_ZOOM_FACTOR);

    if (addAfterPageNr === -1) {
      this.display.appendChild(page.display);
      this.pages.next(v => [...v, page]);
    } else {
      const idx = addAfterPageNr;
      DOMUtils.insertNodeBeforeIndex(page.display, this.display, idx);
      this.pages.next(v => [...v.slice(0, idx), page, ...v.slice(idx)]);
    }

    if (undoable) this.undoStack.push(new this.UndoActionPage(
      this, [], [{
        page, idx: Array.from(this.display.children).indexOf(page.display)
      }]
    ))

    page.toolLayer.style.cursor = this.currentTool.value.idleCursor;
    if (this.pages.value.length === 1) this.activePage.next(page);
  }

  public deletePage(pageNr: number, undoable = true) {
    const idx = pageNr - 1;
    this.display.children[idx].remove();
    if (undoable) this.undoStack.push(new this.UndoActionPage(
      this, [{ page: this.pages.value[idx], idx }], []
    ));
    this.setActivePageForCurrentScroll();
    this.pages.next(v => [...v.slice(0, idx), ...v.slice(idx + 1)]);
  }

  public movePage(pageNr: number, direction: 'up' | 'down') {
    const idx = pageNr - 1;
    const c = this.display.children;

    if (idx === 0 && direction === 'up') return;
    if (idx === c.length - 1 && direction === 'down') return;
    console.assert(idx >= 0 && idx < c.length);

    const page = this.pages.value[idx];
    this.display.children[idx].remove();
    if (direction === 'up') {
      DOMUtils.insertNodeBeforeIndex(page.display, this.display, idx-1);
      this.pages.next(v => {
        const copy = v.slice();
        copy[idx-1] = page; copy[idx] = v[idx-1];
        return copy;
      });
      this.undoStack.push(new this.UndoActionPage(
        this, [{ page, idx: idx }], [{ page, idx: idx-1 }]
      ));
    } else {
      DOMUtils.insertNodeBeforeIndex(page.display, this.display, idx+1);
      this.pages.next(v => {
        const copy = v.slice();
        copy[idx+1] = page; copy[idx] = v[idx+1];
        return copy;
      });
      this.undoStack.push(new this.UndoActionPage(
        this, [{ page, idx: idx }], [{ page, idx: idx+1 }]
      ));
    }
    page.display.scrollIntoView();
  }

  // ------------------------------------------------------------
  // zoom
  // ------------------------------------------------------------

  /** Set the zoom level of all pages. [0-inf[ */
  public setZoom(zoom: number) {
    this.zoom = zoom;
    for (let page of this.pages.value) page.setZoom(zoom * DEFAULT_ZOOM_FACTOR);
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
    if (!DSUtils.hasKey(this.toolConfig.value, this.currentTool.value.name)
      || !DSUtils.hasKey(this.config.value.tools, this.currentTool.value.name))
      throw new Error(`Could not get config for tool ${this.currentTool.value}`)

    this.toolConfig.next(v => ({
      ...v,
      [this.currentTool.value.name]: DSUtils.copyObj(
        this.config.value.tools[
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
        const dataBefore = el.serialize();
        el.setStrokeWidth(width);
        changed.push({
          el: el.svgElem, dataBefore: dataBefore, dataAfter: el.serialize()
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
        const dataBefore = el.serialize();
        el.setColor(color);
        changed.push({
          el: el.svgElem, dataBefore: dataBefore, dataAfter: el.serialize()
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

  private onMouseDown(e: MouseEvent) {
    e.preventDefault();
    this.setPageAtPoint(e);
    if (this.activePage) this.activePage.value.refreshClientRect();

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
        this.toolBeforeTmpTool = this.currentTool.value.name;
        this.setTool(CanvasToolFactory.forName(this.config.value.binds.rightClick));
      } else if (e.button === 1) { // middle click
        this.toolBeforeTmpTool = this.currentTool.value.name;
        this.setTool(CanvasToolFactory.forName(this.config.value.binds.middleClick));
      }
      this.currentTool.value.onMouseDown(e);
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (this.selection.currentlyInteracting) {
      this.selection.onMouseUp(e)
    } else {
      this.currentTool.value.onMouseUp(e);
      if (e.button === 2 || e.button === 1 || e.buttons === 4) // right/middle click
        this.setTool(
          CanvasToolFactory.forName(this.toolBeforeTmpTool), true
        );
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.selection.currentlyInteracting)
      this.selection.onMouseMove(e)
    else
      this.currentTool.value.onMouseMove(e);
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

}

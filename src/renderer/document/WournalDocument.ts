import { CanvasToolConfig, CanvasToolStrokeWidth, ConfigDTO } from "../persistence/ConfigDTO";
import { DSUtils } from "../util/DSUtils";
import { FileUtils } from "../util/FileUtils";
import { Newable } from "../util/Newable";
import { SVGUtils } from "../util/SVGUtils";
import { CanvasElement, CanvasElementDTO } from "./CanvasElement";
import { CanvasElementFactory } from "./CanvasElementFactory";
import { CanvasTool, CanvasToolName } from "./CanvasTool";
import { CanvasToolFactory } from "./CanvasToolFactory";
import { CanvasToolPen } from "./CanvasToolPen";
import { CanvasSelection } from "./CanvasSelection";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { UndoAction, UndoStack } from "./UndoStack";
import { PageProps, WournalPage } from "./WournalPage";
import { DEFAULT_ZOOM_FACTOR, WournalPageSize } from "./WournalPageSize";
import { Component, h, rx, style } from "@mvuijs/core";
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
import { CanvasToolSelectRectangle } from "./CanvasToolSelectRectangle";
import { CanvasToolSelectText } from "./CanvasToolSelectText";
import { getPDFOutline } from "pdf/get-outline";
import {
  defaultDocumentMeta, DocumentMetaVersioner, OutlineNode
} from "persistence/DocumentMeta";
import PackageJson from 'PackageJson';
import { pairwise } from "util/rx";
import { PDF_CTX_MENU } from "pdf/WournalPDFPageView";
import { getLogger } from "util/Logging";

const LOG = getLogger(__filename);

@Component.register
export class WournalDocument extends Component {
  static useShadow = false;

  public pages = new rx.State<WournalPage[]>([]);
  public meta = new rx.State(defaultDocumentMeta());
  public isSinglePage = false;
  public readyToRenderPDF = false;

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
    public fileName: string | undefined,
  ) {
    super();
    this.setupEventListeners();
    this.display.style.background = theme.documentBackground;

    this.shortcuts = getContext(ShortcutsCtx);
    this.config = getContext(ConfigCtx);
    this.toolConfig = new rx.State(DSUtils.copyObj(this.config.value.tools));
    this.api = getContext(ApiCtx);

    this.setTool(CanvasToolSelectRectangle);
  }

  render() {
    this.subscribe(this.activePage, p => {
      this.pages.value.forEach(p => p.display.classList.remove('active'));
      p.display.classList.add('active');
    });

    this.subscribe(this.activePage, _ => {
      // LOG.debug('active page: ', this.pages.value.indexOf(p));
      this.renderPDFIfNeeded();
    });

    this.subscribe(this.pages, pages => {
      const correctPositions =
        pages.map((p, idx) => p.display === this.display.children[idx]);
      console.assert(correctPositions.indexOf(false) === -1, pages);
    });

    this.setupListenChangeOutlinePages();

    this.setupListenPDFCtxMenu();

    return [h.div(this.display)];
  }

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
      const allFiles = await zipFile.allFiles();
      const pagesSvg = await Promise.all(allFiles
        .filter(f => f.name.endsWith('.svg'))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(async f => (new TextDecoder()).decode(await f.blob.arrayBuffer())));
      for (const svg of pagesSvg) {
        const page = await WournalPage.fromSvgString(doc, svg, pdfNotFoundActions);
        if (page instanceof FileNotFoundError) return page;
        doc.addPage(page);
      }
      const metaFile = allFiles.find(f => f.name === 'meta.json');
      // the metafile should always be there since 2024-01-23, but for documents
      // older then that we have to check
      if (metaFile) doc.meta.next(DocumentMetaVersioner.updateToCurrent(
        JSON.parse((new TextDecoder()).decode(await metaFile.blob.arrayBuffer()))
      ));
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

        doc.fileName = undefined;
        doc.addPage(wournalPage);
      }
      const outline = await getPDFOutline(pdf);
      doc.meta.next(m => ({ ...m, outline }));
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
    doc.readyToRenderPDF = true;
    setTimeout(() => { doc.renderPDFIfNeeded(); }, 500); // meeeeh
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
      this.meta.next(m => ({ ...m, lastSavedWournalVersion: PackageJson.version}));
      zipFile.addFile('meta.json', JSON.stringify(this.meta.value, null, 2));
      return await zipFile.asBlob();
    }
  }

  public defaultFileName(extension: string): string {
    if (extension === 'woj') {
      const uniqPDFs = this.pages.value
        .map(p => p.pdfMode ? p.pdfMode.fileName : undefined)
        .filter(el => el !== undefined)
        .filter((maybeUniq, maybeUniqIdx, arr) => arr.indexOf(maybeUniq) === maybeUniqIdx)
      const hasUniqPDF = uniqPDFs.length === 1 ? uniqPDFs[0] : null;
      if (hasUniqPDF) return (
        hasUniqPDF.split(/\.(pdf|PDF)/).slice(0, -2).reduce((a, b) => a + '.' + b)
        + '.woj'
      );
    }

    const now = new Date();
    const pad = (s: number) => s.toString().padStart(2, '0');
    return (
      `${now.getFullYear()}` +
      `-${pad(now.getMonth() + 1)}` +
      `-${pad(now.getDate())}` +
      '-Note' +
      `-${pad(now.getHours())}` +
      `-${pad(now.getMinutes())}` +
      `.${extension}`
    );
  }

  public async free() {
    const annotatedPDFs = [];
    for (const page of this.pages.value) {
      page.pdfMode && annotatedPDFs.push(page.pdfMode.fileName);
      page.free();
    }
    for (const pdf of annotatedPDFs) await PDFCache.destroy(pdf);
  }

  private async renderPDFIfNeeded() {
    // not ideal that we have to await a frame here, but it is needed for
    // `renderPDFIfNeeded` to check wether the page is currently visible
    await new Promise(requestAnimationFrame);
    return Promise.all(this.pages.value.map(p => p.renderPDFIfNeeded()));
  }

  private readonly listeners = {
    'mouseup': this.onMouseUp.bind(this),
    'mouseleave': this.onMouseUp.bind(this),
    'mousedown': this.onMouseDown.bind(this),
    'mousemove': this.onMouseMove.bind(this),
    'contextmenu': (e: any) => e.preventDefault(),
  } as const;

  public setupEventListeners() {
    for (const evtName in this.listeners) {
      if (this.pdfSelectionPassthrough.value) {
        this.removeEventListener(evtName, (this.listeners as any)[evtName]);
      } else {
        this.addEventListener(evtName, (this.listeners as any)[evtName]);
      }
    }
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

  public selection = new CanvasSelection(
    this._undoStack,
    () => this.selectionCut(),
    () => this.selectionCopy(),
    () => this.selectionCut(true),
  );

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
    if (this.currentTool.value instanceof CanvasToolSelectText)
      this.setTool(CanvasToolSelectRectangle);

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
      page.viewportDOMRectToCanvas(this.parentElement.getBoundingClientRect());
    const rectPage = page.viewportDOMRectToCanvas(page.rect);
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

    const rectBounding = page.viewportDOMRectToCanvas(
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
    page.setZoom(
      this.zoom * DEFAULT_ZOOM_FACTOR * this.config.value.defaultZoomDocument
    );

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

  private setupListenChangeOutlinePages() {
    const getOutlineCtx = (
      head: OutlineNode[], o: OutlineNode
    ): OutlineNode[] | false => {
      if (head.indexOf(o) !== -1) return head;
      for (const el of head) {
        const attempt = getOutlineCtx(el.children, o);
        if (attempt) return attempt;
      }
      return false;
    };

    this.subscribe(this.pages.pipe(pairwise()), ([prev, curr]) => {
      if (prev === undefined || this.meta.value.outline.length === 0) return;
      const copy = DSUtils.copyObj(this.meta.value.outline);
      const traverse = (o: OutlineNode) => {
        const page = prev[o.pageNr - 1];
        const newIdx = curr.indexOf(page);
        // LOG.debug(`${o.pageNr} -> ${newIdx + 1}`)
        if (newIdx === -1) {
          const selfArr = getOutlineCtx(copy, o);
          if (selfArr) selfArr.splice(selfArr.indexOf(o), 1);
        }
        else o.pageNr = newIdx + 1;
      };
      copy.forEach(traverse);
      this.meta.next(m => ({ ...m, outline: copy }));
    });
  }

  private setupListenPDFCtxMenu() {
    this.subscribe(PDF_CTX_MENU.events, async e => {
      if (e.type === 'copy') { // ========================================

        navigator.clipboard.writeText(e.data);

      } else { // ========================================================

        const page = this.activePage.value;
        page.refreshClientRect();

        // filter weird rects
        // --------------------------------------------------

        let selRects = e.data.dim
          .map(page.viewportDOMRectToCanvas.bind(page))
          .filter(r =>
            r.width !== 0 && r.height !== 0 && r.y > 0
          );

        const combinations = selRects
          .map(r => selRects.map(r2 => [r, r2] as [DOMRect, DOMRect]))
          .reduce((a, b) => [...a, ...b])
          .filter(([a, b]) => a !== b);

        // when two rects intersect, we discard the higher rect. for some reason
        // these are often double

        for (const c of combinations) {
          if (SVGUtils.rectIntersect(c[0], c[1])) {
            const diff = Math.abs(c[0].height - c[1].height);
            if (diff < 5) continue;
            const discard = c[0].height > c[1].height ? c[0] : c[1];
            const idx = selRects.indexOf(discard);
            if (idx !== -1) selRects.splice(idx, 1);
          }
        }

        // filling horizontal gaps
        // --------------------------------------------------

        // LOG.debug(selRects);
        const yDiffPx = 5;

        const yBatched = selRects.map(r => r.y)
          // thanks https://stackoverflow.com/a/41725005
          .reduce((a, b, idx, arr) => {
            if (b - arr[idx - 1] < yDiffPx) {
              if (!Array.isArray(a[a.length - 1]))
                a[a.length - 1] = [a[a.length - 1]];
              a[a.length - 1].push(b);
              return a;
            }
            a.push(b);
            return a;
          }, [])
          .map(el => el instanceof Array ? el : [el]) as number[][];

        yBatched.forEach(batch => batch.sort());

        const rectsBatched: { [batchIdx: number]: DOMRect[] } = { };

        for (const r of selRects) {
          const yBatch = yBatched.filter(
            batch => r.y >= batch[0] && r.y <= batch[batch.length - 1]
          )[0];
          const idx = yBatched.indexOf(yBatch);
          if (!(idx in rectsBatched)) rectsBatched[idx] = [];
          rectsBatched[idx].push(r);
        }

        selRects = (Object.keys(rectsBatched) as any as number[])
          .map(k => rectsBatched[k].reduce(SVGUtils.boundingRectForTwo))

        // add paths
        // --------------------------------------------------
        const pathPointDiff = 5;

        const added: SVGPathElement[] = [];
        for (let rect of selRects) {
          const yMid = rect.top + rect.height / 2;
          const strokeWidth = {
            'fine': 1, 'medium': 3, 'thick': 10,
          }[this.toolConfig.value.CanvasToolSelectText.strokeWidth];

          const startX = rect.left;
          const endX = rect.right;
          const y = {
            'highlight': yMid , 'strikethrough': yMid + strokeWidth / 2,
            'underline': rect.bottom,
          }[e.type];

          let d = `M${startX} ${y}`;
          for (let i = startX; i < endX; i+=pathPointDiff) d += ` L${i} ${y}`;
          d += ` L${endX} ${y}`

          const path = SVGUtils.create('path', {
            'stroke': this.toolConfig.value.CanvasToolSelectText.color,
            'stroke-width': strokeWidth,
            ...{
              'highlight': { d, 'stroke-opacity': 0.4, 'stroke-width': rect.height },
              'strikethrough': { d },
              'underline': { d },
            }[e.type]
          });
          added.push(path);
          page.activePaintLayer.appendChild(path);
        }
        this.undoStack.push(new UndoActionCanvasElements([], [], added));
      }
    });
  }

  // ------------------------------------------------------------
  // zoom
  // ------------------------------------------------------------

  /** Set the zoom level of all pages. [0-inf[ */
  public async setZoom(
    zoom: number,
    keepViewportPos: { x: number, y: number } = { x: -1, y: -1 } // -1 = center
  ) {
    if (zoom < 0.01) return;
    const zoomActual =
      zoom * DEFAULT_ZOOM_FACTOR * this.config.value.defaultZoomDocument;

    if (keepViewportPos.x === -1 || keepViewportPos.y === -1) {
      const r = this.parentElement.getBoundingClientRect();
      keepViewportPos.x = r.left + r.width / 2;
      keepViewportPos.y = r.top + r.height / 2;
    }

    const activePage = this.activePage.value;
    activePage.refreshClientRect();

    const keepCanvasPoint = activePage.viewportCoordsToCanvas(keepViewportPos);
    const pointBefore = activePage.canvasCoordsToViewport(keepCanvasPoint);

    for (let page of this.pages.value) page.setZoom(zoomActual);

    await new Promise(requestAnimationFrame);
    activePage.refreshClientRect();
    const pointAfter = activePage.canvasCoordsToViewport(keepCanvasPoint);
    const pointDiff = {
      x: pointAfter.x - pointBefore.x,
      y: pointAfter.y - pointBefore.y,
    }
    // LOG.debug(pointDiff);

    const { top, left } = this.api.getScrollPos();
    this.api.scrollPos(top + pointDiff.y, left + pointDiff.x);

    this.zoom = zoom;
    if (this.selection.available.value) this.selection.showButtons(true);
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
    this.setupEventListeners();
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

  public readonly pdfSelectionPassthrough =
    this.currentTool.derive(t => t instanceof CanvasToolSelectText);

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
    LOG.debug(`Using tool ${(this.currentTool.value as any).constructor.name}`);
    (document.activeElement instanceof HTMLElement) && document.activeElement.blur();
    e.preventDefault();
    if (this.activePage) this.activePage.value.refreshClientRect();

    if (this.activePage && this.selection.selection.length !== 0) {
      const mouse = this.activePage.value.viewportCoordsToCanvas(e);
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

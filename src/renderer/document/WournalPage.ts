import { rx } from "@mvui/core";
import { theme } from "global-styles";
import { WournalPDFPageView } from "pdf/WournalPDFPageView";
import { DOMUtils } from "util/DOMUtils";
import { DSUtils } from "util/DSUtils";
import {
  BackgroundGenerator, BackgroundStyleT, BackgroundGenerators, genBackgroundRect
} from "./BackgroundGenerators";
import { UndoActionLayer } from "./UndoActionLayer";
import { UndoAction } from "./UndoStack";
import { WournalDocument } from "./WournalDocument";
import { xToPx } from "./WournalPageSize";
import { FileNotFoundError, PDFCache } from "pdf/PDFCache";
import { Rect, SearchText } from "./types";
import getTextRanges from "util/get-text-ranges";
import { Highlights } from "util/highlights";
import { SVGUtils } from "util/SVGUtils";
import { PDFDocumentProxy, RefProxy } from "pdfjs-dist/types/src/display/api";
import { debounce } from "lodash";
import { getLogger } from "util/Logging";

const LOG = getLogger(__filename);

/**
 * The attribute defining a "layer" element for wournal. Really they are just
 * svg groups ("g" elements), but they are marked with this attribute.
 */
export const WOURNAL_SVG_LAYER_NAME_ATTR = "wournal-layer-name";
export const WOURNAL_SVG_LAYER_CURRENT_ATTR = "wournal-layer-current";

export const WOURNAL_SVG_PAGE_BACKGROUND_COLOR_ATTR = 'wournal-page-background-color';
export const WOURNAL_SVG_PAGE_BACKGROUND_STYLE_ATTR = 'wournal-page-background-style';

export const WOURNAL_SVG_PAGE_PDF_ATTR = 'wournal-page-pdf';

export const WOURNAL_SVG_PAGE_MARKER_ATTR = 'wournal-page';

export type PagePDFMode = {
  location: 'filesystem', // future: attachment
  fileName: string,
  pageNr: number,
}

export type PageProps = {
  backgroundColor: string, backgroundStyle: BackgroundStyleT,
  width: number, height: number,
  pdfMode?: PagePDFMode,
};

/**
 * An SVG Canvas to draw on.
 */
export class WournalPage {

  public display: HTMLDivElement;
  /**
   * This wrapper element is necessary for zooming to work. Since css scale
   * transform is used for zooming, which does not alter the size of the
   * scaled element, we have to alter the width/height of a surrounding
   * element (this.display);
   */
  private svgWrapperEl: HTMLDivElement;
  get toolLayerWrapper() { return this.svgWrapperEl; }

  /**
   * This wrapper element is used so that saving/loading svg can be done with
   * `canvasWrapper.innerHTML`, because `canvas.outerHTML` did not work
   * properly.
   */
  private canvasWrapper: HTMLDivElement;

  private get width() { return parseFloat(this.canvas.getAttribute('width')) };
  private set width(w: number) { this.canvas.setAttribute('width', w.toString()) };
  private get height() { return parseFloat(this.canvas.getAttribute('height')) };
  private set height(w: number) { this.canvas.setAttribute('height', w.toString()) };
  private set backgroundColor(col: string) {
    this.canvas.setAttribute(WOURNAL_SVG_PAGE_BACKGROUND_COLOR_ATTR, col);
  }
  private get backgroundColor() {
    return this.canvas.getAttribute(WOURNAL_SVG_PAGE_BACKGROUND_COLOR_ATTR);
  }
  private set backgroundStyle(col: BackgroundStyleT) {
    this.canvas.setAttribute(WOURNAL_SVG_PAGE_BACKGROUND_STYLE_ATTR, col);
  }
  private get backgroundStyle() {
    return this.canvas.getAttribute(WOURNAL_SVG_PAGE_BACKGROUND_STYLE_ATTR) as
      BackgroundStyleT;
  }
  public get pdfMode(): PagePDFMode | undefined {
    return this.canvas.hasAttribute(WOURNAL_SVG_PAGE_PDF_ATTR)
      ? JSON.parse(this.canvas.getAttribute(WOURNAL_SVG_PAGE_PDF_ATTR))
      : undefined;
  }
  private set pdfMode(mode: PagePDFMode) {
    if (mode === undefined) this.canvas.removeAttribute(WOURNAL_SVG_PAGE_PDF_ATTR);
    else this.canvas.setAttribute(WOURNAL_SVG_PAGE_PDF_ATTR, JSON.stringify(mode));
  }
  public get isAnnotatingPDF() {
    return this.canvas.hasAttribute(WOURNAL_SVG_PAGE_PDF_ATTR);
  }

  private zoom: number = 1;

  public toolLayer: SVGSVGElement;
  private pdfViewer: WournalPDFPageView | false = false;

  private canvas: SVGSVGElement;
  public get canvasHeight() { return xToPx(this.canvas.getAttribute('height')) }
  public get canvasWidth() { return xToPx(this.canvas.getAttribute('width')) }
  public activePaintLayer: SVGGElement;

  /**
   * The bounding rectangle of `_svgElement`. Only updated in `onMouseDown`
   * for better performance.
   */
  private _rect: DOMRect;
  get rect() {
    if (this._rect === undefined) this._rect = this.toolLayer.getBoundingClientRect();
    return this._rect;
  }

  /**
   * - `doc`: The wournal document this page is creted as a part of.
   * - `init`: Either the svg data of a saved document as a string or
   *   dimensions for a new, blank page.
   */
  private constructor(
    public doc: WournalDocument,
  ) {
    this.display = document.createElement("div");
    this.display.setAttribute("class", WOURNAL_SVG_PAGE_MARKER_ATTR);
    this.display.addEventListener('mousedown', _ => {
      doc.activePage.next(this);
    })

    this.display.style.position = 'relative';
    this.display.style.border = "3px solid white";
    this.display.style.margin = "10px auto 10px auto";

    this.svgWrapperEl = document.createElement("div");
    this.svgWrapperEl.style.filter = theme.invert;
    this.svgWrapperEl.style.transformOrigin = "0 0";
    this.display.appendChild(this.svgWrapperEl);

    this.canvasWrapper = document.createElement("div");
    this.canvasWrapper.setAttribute("class", "wournal-canvas-wrapper");
    this.svgWrapperEl.appendChild(this.canvasWrapper);

    this.canvas = document.createElementNS(
      "http://www.w3.org/2000/svg", "svg"
    );
    this.canvas.setAttribute(WOURNAL_SVG_PAGE_MARKER_ATTR, "");
    this.canvas.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    this.canvas.style.position = "absolute";
    this.canvasWrapper.appendChild(this.canvas);

    this.toolLayer = document.createElementNS(
      "http://www.w3.org/2000/svg", "svg"
    );
    this.toolLayer.setAttribute("class", "wournal-page-toollayer");
    this.toolLayer.style.position = "absolute";
    this.svgWrapperEl.appendChild(this.toolLayer);

    doc.pdfSelectionPassthrough?.subscribe(passthrough => {
      if (!this.pdfViewer) return;
      this.pdfViewer.setAllowTextSelection(passthrough);
    });

    doc.config?.subscribe(cfg => {
      if (!this.pdfViewer) return;
      this.pdfViewer.setAnnotationVisility(!cfg.hideAnnotations);
    })
  }

  // ------------------------------------------------------------
  // initialization
  // ------------------------------------------------------------

  /** Return a new page with dimensions according to `init` */
  public static createNew(
    doc: WournalDocument,
    props: PageProps,
  ): WournalPage {
    let page = new WournalPage(doc);
    page.setPageProps(props, false)
    page.addLayer('Layer 1', false);
    page.setActivePaintLayer('Layer 1', false);

    page.updateDisplaySize();
    return page;
  }

  public newPageLikeThis(): WournalPage {
    const page = new WournalPage(this.doc);
    page.setPageProps(DSUtils.copyObj(this.getPageProps()), false);
    page.addLayer('Layer 1', false);
    page.setActivePaintLayer('Layer 1');
    page.updateDisplaySize();
    return page;
  }

  // ----------------------------------------------------------------------
  // serialization
  // ----------------------------------------------------------------------

  /** Return a page parsed from the <svg> element string `svg` */
  public static async fromSvgString(
    doc: WournalDocument, svg: string,
    pdfNotFoundActions: {
      fileName: string, replaceOrRemove: string | false
    }[] = [],
  ): Promise<WournalPage | FileNotFoundError> {
    svg = DOMUtils.sanitizeSVG(svg);

    let page = new WournalPage(doc);
    let outerSvg = document.createElementNS(
      "http://www.w3.org/2000/svg", "svg"
    );
    outerSvg.innerHTML = svg;

    let svgEl = outerSvg.children[0] as SVGSVGElement;
    let layers = WournalPage.getLayers(svgEl);

    // dimensions
    // ------------------------------------------------------------

    let dim = {
      width: xToPx(svgEl.getAttribute("width")),
      height: xToPx(svgEl.getAttribute("height")),
    };
    page.setPageSize(dim);

    // layers
    // ------------------------------------------------------------
    // page was created outside of wournal -> no wournal layers detected
    if (layers.length === 0) {
      // create a layer for wrapping the foreign svg element
      let wrappingLayer = document.createElementNS(
        "http://www.w3.org/2000/svg", "g"
      );
      wrappingLayer.setAttribute(WOURNAL_SVG_LAYER_NAME_ATTR, "Imported");
      wrappingLayer.appendChild(svgEl);
      page.canvas.appendChild(wrappingLayer);

      page.generateBackground(BackgroundGenerators.blank);
      // add a new layer to paint on instead of the foreign svg
      page.addLayer('Layer 1');
      page.setActivePaintLayer('Layer 1');

      layers = page.getLayers();
    } else {
      page.canvasWrapper.innerHTML = svg;
      page.canvas = page.canvasWrapper.children[0] as SVGSVGElement;
    }

    page.setActivePaintLayer(
      layers[layers.length - 1].getAttribute(
        WOURNAL_SVG_LAYER_NAME_ATTR
      )
    );


    const notFoundAction =
      pdfNotFoundActions.filter(a => a.fileName === page.pdfMode.fileName)[0];
    const maybePdf = await page.maybeLoadPDFPage(
      (notFoundAction ? notFoundAction.replaceOrRemove : undefined)
    );
    if (maybePdf !== true) return maybePdf;

    page.updateDisplaySize();
    return page;
  }

  public asSvgString(): string {
    return (new XMLSerializer()).serializeToString(this.canvas);
  }

  public async free() {
    const ret = this.pdfMode ? this.pdfMode.fileName : false;
    if (this.pdfViewer) this.pdfViewer.free();
    this.display.innerHTML = '';
  }

  private isVisible(): boolean {
    // very rough and generous approximation
    const canFit = Math.max(3, 2 / this.doc.getZoom())

    const activeIdx = this.doc.pages.value.indexOf(this.doc.activePage.value);
    const thisIdx = this.doc.pages.value.indexOf(this);
    return Math.abs(activeIdx - thisIdx) < canFit;
  }

  public renderPDFIfNeeded = debounce(async () => {
    if (!this.pdfViewer || !this.doc.readyToRenderPDF) return;
    return await this.pdfViewer.drawOrFree();
  }, 500);

  private async maybeLoadPDFPage(
    pdfNotFoundAction?: string | false,
  ): Promise<true | FileNotFoundError> {
    if (this.pdfMode === undefined) {
      if (this.pdfViewer) this.pdfViewer.display.remove();
      this._setLayerVisible('Background', true, false);
      return true;
    }
    let resp = await PDFCache.fromLocation(this.pdfMode.fileName);
    if (resp === false) {
      if (pdfNotFoundAction !== undefined) {
        if (pdfNotFoundAction === false) {
          this._setLayerVisible('Background', true, false);
          this.generateBackground(BackgroundGenerators.blank);
          this.pdfMode = undefined;
          return true;
        } else {
          resp = await PDFCache.fromLocation(pdfNotFoundAction);
          if (!resp) return new FileNotFoundError(pdfNotFoundAction);
          this.pdfMode = { ...this.pdfMode, fileName: pdfNotFoundAction };
        }
      } else {
        return new FileNotFoundError(this.pdfMode.fileName);
      }
    }

    this.pdfViewer = new WournalPDFPageView(
      await resp.getPage(this.pdfMode.pageNr),
      this.isVisible.bind(this),
      async dest => {
        const doc = resp as PDFDocumentProxy;
        let ref: RefProxy;
        if (typeof dest === 'string') {
          const destinations = await doc.getDestinations();
          if (!(dest in destinations)) throw new Error(
            'Destination Not Found', { cause: { dest, destinations } }
          );
          ref = destinations[dest][0];
        } else {
          ref = dest[0];
        }
        const page = await (resp as PDFDocumentProxy).getPageIndex(ref) + 1;
        LOG.info(`Scrolling to Linked Page: ${page}`);
        this.doc.api.scrollPage(page);
      },
      this.zoom,
    );
    this.pdfViewer.display.style.filter = theme.invert;
    if (this.doc.config.value.hideAnnotations) this.pdfViewer.setAnnotationVisility(false);
    if (this.doc.pdfSelectionPassthrough.value) this.pdfViewer.setAllowTextSelection(true);
    this.setPageSize(this.pdfViewer.getDimensionsPx());
    this._setLayerVisible('Background', false, false);
    this.display.insertBefore(this.pdfViewer.display, this.svgWrapperEl);
    return true;
  }

  // ------------------------------------------------------------
  // layers
  // ------------------------------------------------------------

  public layers = new rx.State<{
    name: string, visible: boolean, current: boolean
  }[]>([]);

  private updateLayerList() {
    let layers = this.getLayers().map(l => ({
      current: l.getAttribute(WOURNAL_SVG_LAYER_CURRENT_ATTR) === 'true',
      visible: l.getAttribute('visibility') !== 'hidden',
      name: l.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR),
    }));
    if (this.isAnnotatingPDF && this.pdfViewer)
      layers = [
        { current: false, visible: !this.pdfViewer.display.hidden, name: 'Background' },
        ...layers.filter(l => l.name !== 'Background'),
      ];

    this.layers.next(layers);
  }

  public addLayer(
    name: string = "", undoable = true,
    prepend = false
  ): SVGGElement {
    const getNewName = () => {
      let i = this.layers.value.length;
      const existing = this.layers.value.map(l => l.name);
      while (true) {
        const attempt = `Layer ${i}`;
        if (existing.indexOf(attempt) === -1) return attempt;
        i++;
      }
    }

    const n = name === "" ? getNewName() : name;
    if (this.getLayer(n) !== undefined)
      throw new Error(`Layer with name '${n}' already exists!`);

    let g = document.createElementNS(
      "http://www.w3.org/2000/svg", "g"
    );
    g.setAttribute(WOURNAL_SVG_LAYER_NAME_ATTR, n);

    if (prepend && this.canvas.firstChild)
      this.canvas.insertBefore(g, this.canvas.firstChild);
    else this.canvas.appendChild(g);

    const listBefore = this.layers.value;
    this.updateLayerList();
    if (undoable) this.doc.undoStack.push(new UndoActionLayer(
      this.canvas, this.updateLayerList.bind(this),
      [], [g], listBefore, this.layers.value
    ));
    return g;
  }

  public moveLayer(name: string, direction: 'up' | 'down') {
    if (name === 'Background') throw new Error('Cannot move Background layer');
    const l = this.getLayer(name);
    const parent = l.parentElement;

    const sibling = direction === 'up' ? l.nextSibling : l.previousSibling;
    if (!sibling) return;
    parent.removeChild(l);

    if (direction === 'up') sibling.after(l);
    else sibling.before(l);

    const listBefore = this.layers.value;
    this.updateLayerList();
    this.doc.undoStack.push(new UndoActionLayer(
      this.canvas, this.updateLayerList.bind(this),
      [], [], listBefore, this.layers.value
    ));
  }

  private _setLayerVisible(name: string, visible: boolean, undoable = true): void {
    this.getLayer(name).setAttribute(
      'visibility', visible ? 'visible' : 'hidden'
    );
    const listBefore = this.layers.value;
    this.updateLayerList();
    if (undoable)
      this.doc.undoStack.push(new UndoActionLayer(
        this.canvas, this.updateLayerList.bind(this),
        [], [], listBefore, this.layers.value
      ));
  }

  public setLayerVisible(name: string, visible: boolean, undoable = true) {
    LOG.info(`set layer ${name} visible = ${visible}`);
    if (this.pdfMode !== undefined && name === 'Background' && this.pdfViewer) {
      // HACK: toggling visibility of pdf layer is not undoable
      this.pdfViewer.display.hidden = !visible;
      this.updateLayerList();
    } else {
      this._setLayerVisible(name, visible, undoable);
    }
  }

  /** Get a layer by its name */
  public getLayer(name: string): SVGGElement {
    return this.getLayers().find(
      l => l.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR) === name
    );
  }

  private static getLayers(svgEl: SVGSVGElement) {
    return Array.from(svgEl.getElementsByTagName("g")).filter(
      el => el.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR) !== null
    )
  }

  private getLayers = () => WournalPage.getLayers(this.canvas);

  public setActivePaintLayer(name: string, undoable = true) {
    if (name === 'Background') throw new Error('Cannot paint on Background layer');
    const l = this.getLayer(name);
    this.activePaintLayer = l;
    this.getLayers().map(
      l => l.removeAttribute(WOURNAL_SVG_LAYER_CURRENT_ATTR)
    );
    l.setAttribute(WOURNAL_SVG_LAYER_CURRENT_ATTR, 'true');

    const listBefore = this.layers.value;
    this.updateLayerList();
    if (undoable) this.doc.undoStack.push(new UndoActionLayer(
      this.canvas, this.updateLayerList.bind(this),
      [], [], listBefore, this.layers.value
    ));
  }

  private _deleteLayer(name: string, undoable = true) {
    const l = this.getLayer(name);
    l.parentNode.removeChild(l);

    const listBefore = this.layers.value;

    const inListBefore = listBefore.findIndex(l => l.name === name);
    if (listBefore[inListBefore].current) {
      const nonBg = this.getLayers().filter(
        l => l.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR) !== 'Background'
      );
      nonBg[0].setAttribute(WOURNAL_SVG_LAYER_CURRENT_ATTR, 'true');
    }

    this.updateLayerList();
    if (undoable) this.doc.undoStack.push(new UndoActionLayer(
      this.canvas, this.updateLayerList.bind(this),
      [l], [], listBefore, this.layers.value
    ));
  }

  public deleteLayer(name: string, undoable = true) {
    if (name === 'Background') throw new Error('Cannot delete Background layer');
    return this._deleteLayer(name, undoable);
  }

  public renameLayer(name: string, newName: string) {
    if (name === 'Background') throw new Error('Cannot rename Background layer');
    this.getLayer(name).setAttribute(WOURNAL_SVG_LAYER_NAME_ATTR, newName);
    const listBefore = this.layers.value;
    this.updateLayerList();
    this.doc.undoStack.push(new UndoActionLayer(
      this.canvas, this.updateLayerList.bind(this),
      [], [], listBefore, this.layers.value
    ));
  }

  // ----------------------------------------------------------------------
  // background generators
  // ----------------------------------------------------------------------

  private generateBackground(generator: BackgroundGenerator) {
    if (this.getLayer('Background')) this._deleteLayer('Background', false);
    const newBg = this.addLayer('Background', false, true);
    const bgEls = generator({
      width: this.width, height: this.height,
      backgroundColor: this.backgroundColor
    });
    for (const el of bgEls) newBg.appendChild(el);
  }

  public getPageProps(): PageProps {
    return {
      backgroundColor: this.backgroundColor,
      backgroundStyle: this.backgroundStyle,
      height: this.height, width: this.width,
      pdfMode: this.pdfMode,
    };
  }

  public setPageProps(props: PageProps, undoable = true) {
    const propsBefore = this.getPageProps();
    this.setPageSize(props);
    this.backgroundColor = props.backgroundColor;
    this.backgroundStyle = props.backgroundStyle;
    if (props.pdfMode !== undefined) {
      this.generateBackground(() => [ genBackgroundRect({ ...props, fillOpacity: 0 }) ]);
    } else {
      this.generateBackground(BackgroundGenerators[props.backgroundStyle]);
    }
    this.pdfMode = props.pdfMode;
    this.maybeLoadPDFPage();
    if (undoable) this.doc.undoStack.push(new UndoActionPageProps(
      this, propsBefore, this.getPageProps(),
    ));
  }

  // ------------------------------------------------------------
  // dimensions
  // ------------------------------------------------------------

  /** Update the size of this page according to the set width/height */
  private updateDisplaySize() {
    this.display.style.width = `${this.width * this.zoom}px`;
    this.display.style.height = `${this.height * this.zoom}px`;
  }

  /**
   * Set the page size according to `d`. Note that if the page is set to a
   * smaller size then its initial size, some content at the borders might be
   * removed.
   */
  public setPageSize(d: { width: number, height: number }) {
    this.width = d.width;
    this.height = d.height;
    this.svgWrapperEl.style.width = `${this.width.toString()}px`;
    this.svgWrapperEl.style.height = `${this.height.toString()}px`;
    this.toolLayer.setAttribute("width", `${d.width}`);
    this.toolLayer.setAttribute("height", `${d.height}`);
    this.updateDisplaySize();
  }

  /**
   * Set the zoom level of this page. [0-inf[
   *
   * Note: For this to work, ALL COORDINATES ACCROSS THE ENTIRE APPLICATION
   * WILL HAVE TO BE TRANSLATED TO THE CANVAS COORDINATE SYSTEM USING
   * `this.globalCoordsToCanvas` AND `this.globalDOMRectToCanvas`.
   */
  public setZoom(zoom: number) {
    // Setting the scale transform css attribute on the entire wournal
    // document seemed not to work, but for some reason it does work on the
    // individual pages. This is why zoom level is set on a page by page
    // basis.
    this.svgWrapperEl.style.transform = `scale(${zoom})`;
    this.zoom = zoom;
    if (this.pdfViewer) {
      this.pdfViewer.setZoom(zoom);
      this.renderPDFIfNeeded();
    }
    this.updateDisplaySize();
  }

  // ------------------------------------------------------------
  // text search
  // ------------------------------------------------------------

  public async highlightText(
    text: string, emphasizeIdx: number | false = false,
    matchCase = true,
  ) {
    const els = this.canvas.querySelectorAll('tspan');
    const ranges = getTextRanges(text, els, matchCase);
    if (ranges.length !== 0) {
      ranges.forEach(r => Highlights.add(r, 'search'));
      if (emphasizeIdx !== false && ranges.length > emphasizeIdx) {
        Highlights.add(ranges[emphasizeIdx], 'search-current');
      }
    }

    if (this.pdfMode) {
      if (this.pdfViewer === false) await this.maybeLoadPDFPage();
      (this.pdfViewer as WournalPDFPageView).highlightText(
        text,
        (emphasizeIdx !== false && emphasizeIdx >= ranges.length)
          ? emphasizeIdx - ranges.length
          : false,
        matchCase
      );
    }
  }

  public async getText(): Promise<SearchText[]> {
    const ret: SearchText[] = [];

    const textEls = this.canvas.querySelectorAll('text');
    for (const textEl of textEls)
      ret.push({
        str: textEl.textContent,
        rect: this.viewportDOMRectToCanvas(
          SVGUtils.scaleRect(textEl.getBoundingClientRect(), 1 / this.zoom)
        ),
      });

    if (this.pdfMode) {
      if (this.pdfViewer === false) await this.maybeLoadPDFPage();
      const pdfText = await (this.pdfViewer as WournalPDFPageView).getText();
      for (const t of pdfText) ret.push(t);
    }

    return ret;
  }

  // ------------------------------------------------------------
  // tools and helpers
  // ------------------------------------------------------------

  public refreshClientRect() {
    this._rect = this.toolLayer.getBoundingClientRect();
  }

  /**
   * Translate x and y to canvas coords. USE THIS FOR ALL COORDINATE
   * TRANSLATIONS, OTHERWISE ZOOM WILL NOT WORK.
   */
  public viewportCoordsToCanvas(
    pt: { x: number, y: number }
  ): { x: number, y: number } {
    return {
      // pt.x / this.zoom - this.rect.left / this.zoom
      x: (pt.x - this.rect.left) / this.zoom,
      y: (pt.y - this.rect.top) / this.zoom
    };
  }

  public canvasCoordsToViewport(
    pt: { x: number, y: number }
  ): { x: number, y: number } {
    return {
      x: pt.x * this.zoom + this.rect.left,
      y: pt.y * this.zoom + this.rect.top,
    };
  }

  /**
   * Translate r to canvas coords. USE THIS FOR ALL COORDINATE TRANSLATIONS,
   * OTHERWISE ZOOM WILL NOT WORK.
   */
  public viewportDOMRectToCanvas(r: Rect): DOMRect {
    return DOMRect.fromRect({
      x: (r.x - this.rect.left) / this.zoom,
      y: (r.y - this.rect.top) / this.zoom,
      width: r.width / this.zoom,
      height: r.height / this.zoom,
    });
  }

  public canvasRectToViewport(r: Rect): Rect {
    return {
      x: r.x * this.zoom + this.rect.left,
      y: r.y * this.zoom + this.rect.top,
      width: r.width * this.zoom,
      height: r.height * this.zoom,
    };
  }

  public static svgIsMarkedAsWournalPage(svg: string): boolean {
    svg = DOMUtils.sanitizeSVG(svg);
    const outerSvg = document.createElementNS(
      "http://www.w3.org/2000/svg", "svg"
    );
    outerSvg.innerHTML = svg;
    return outerSvg.children[0].hasAttribute(WOURNAL_SVG_PAGE_MARKER_ATTR);
  }
}

class UndoActionPageProps implements UndoAction {
  constructor(
    private page: WournalPage,
    private propsBefore: PageProps,
    private propsAfter: PageProps,
  ) { }

  redo() {
    this.page.setPageProps(this.propsAfter, false);
  }

  undo() {
    this.page.setPageProps(this.propsBefore, false);
  }
}

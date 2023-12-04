import { rx } from "@mvui/core";
import { theme } from "global-styles";
import {
  BackgroundGenerator, BackgroundStyleT, BackgroundGenerators
} from "./BackgroundGenerators";
import { UndoActionLayer } from "./UndoActionLayer";
import { UndoAction } from "./UndoStack";
import { WournalDocument } from "./WournalDocument";
import { xToPx } from "./WournalPageSize";

/**
 * The attribute defining a "layer" element for wournal. Really they are just
 * svg groups ("g" elements), but they are marked with this attribute.
 */
export const WOURNAL_SVG_LAYER_NAME_ATTR = "wournal-layer-name";
export const WOURNAL_SVG_LAYER_CURRENT_ATTR = "wournal-layer-current";

export type PageProps = {
  backgroundColor: string, backgroundStyle: BackgroundStyleT,
  width: number, height: number,
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

  public get width() { return parseFloat(this.canvas.getAttribute('width')) };
  public set width(w: number) { this.canvas.setAttribute('width', w.toString()) };
  public get height() { return parseFloat(this.canvas.getAttribute('height')) };
  public set height(w: number) { this.canvas.setAttribute('height', w.toString()) };
  public set backgroundColor(col: string) {
    this.canvas.setAttribute('wournal-page-background-color', col);
  }
  public get backgroundColor() {
    return this.canvas.getAttribute('wournal-page-background-color');
  }
  public set backgroundStyle(col: BackgroundStyleT) {
    this.canvas.setAttribute('wournal-page-background-style', col);
  }
  public get backgroundStyle() {
    return this.canvas.getAttribute('wournal-page-background-style') as
      BackgroundStyleT;
  }

  private zoom: number = 1;

  public toolLayer: SVGSVGElement;

  private canvas: SVGSVGElement;
  public get canvasHeight() { return xToPx(this.canvas.getAttribute('height')) }
  public get canvasWidth() { return xToPx(this.canvas.getAttribute('width')) }
  public activePaintLayer: SVGGElement;

  /**
   * The bounding rectangle of `_svgElement`. Only updated in `onMouseDown`
   * for better performance.
   */
  private _rect: DOMRect;
  get rect() { return this._rect; }

  /**
   * - `doc`: The wournal document this page is creted as a part of.
   * - `init`: Either the svg data of a saved document as a string or
   *   dimensions for a new, blank page.
   */
  private constructor(
    public doc: WournalDocument,
  ) {
    this.display = document.createElement("div");
    this.display.setAttribute("class", "wournal-page");

    this.display.style.border = "3px solid white";
    this.display.style.margin = "10px auto 10px auto";
    this.display.style.userSelect = "none";
    this.display.style.filter = theme.invert;

    this.svgWrapperEl = document.createElement("div");
    this.svgWrapperEl.style.transformOrigin = "0 0";
    this.display.appendChild(this.svgWrapperEl);

    this.canvasWrapper = document.createElement("div");
    this.canvasWrapper.setAttribute("class", "wournal-canvas-wrapper");
    this.svgWrapperEl.appendChild(this.canvasWrapper);

    this.canvas = document.createElementNS(
      "http://www.w3.org/2000/svg", "svg"
    );
    this.canvas.setAttribute("wournal-page", "");
    this.canvas.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    this.canvas.style.position = "absolute";
    this.canvasWrapper.appendChild(this.canvas);

    this.toolLayer = document.createElementNS(
      "http://www.w3.org/2000/svg", "svg"
    );
    this.toolLayer.setAttribute("class", "wournal-page-toollayer");
    this.toolLayer.style.position = "absolute";
    this.svgWrapperEl.appendChild(this.toolLayer)
  }

  // ------------------------------------------------------------
  // initialization and serialization
  // ------------------------------------------------------------

  /** Return a new page with dimensions according to `init` */
  public static createNew(
    doc: WournalDocument,
    init: {
      height: number, width: number, backgroundColor: string,
      backgroundStyle: BackgroundStyleT
    },
  ): WournalPage {
    let page = new WournalPage(doc);
    page.setPageProps(init, false)
    page.addLayer('Layer 1', false);
    page.setActivePaintLayer('Layer 1', false);

    page.updateDisplaySize();
    return page;
  }

  public newPageLikeThis(): WournalPage {
    const page = new WournalPage(this.doc);
    page.setPageProps({
      width: this.width, height: this.height,
      backgroundColor: this.backgroundColor,
      backgroundStyle: this.backgroundStyle
    }, false);
    page.addLayer('Layer 1', false);
    page.setActivePaintLayer('Layer 1');

    page.updateDisplaySize();
    return page;
  }

  public static svgIsMarkedAsWournalPage(svg: string): boolean {
    const outerSvg = document.createElementNS(
      "http://www.w3.org/2000/svg", "svg"
    );
    outerSvg.innerHTML = svg;
    return outerSvg.children[0].hasAttribute('wournal-page');
  }

  /** Return a page parsed from the <svg> element string `svg` */
  public static fromSvgString(
    doc: WournalDocument, svg: string
  ): WournalPage {
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

    page.updateDisplaySize();
    return page;
  }

  public asSvgString(): string {
    return this.canvas.outerHTML;
  }

  // ------------------------------------------------------------
  // layers
  // ------------------------------------------------------------

  public layers = new rx.State<{
    name: string, visible: boolean, current: boolean
  }[]>([]);

  private updateLayerList() {
    this.layers.next(this.getLayers().map(l => ({
      current: l.getAttribute(WOURNAL_SVG_LAYER_CURRENT_ATTR) === 'true',
      visible: l.getAttribute('visibility') !== 'hidden',
      name: l.getAttribute(WOURNAL_SVG_LAYER_NAME_ATTR),
    })));
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

  public setLayerVisible(name: string, visible: boolean): void {
    this.getLayer(name).setAttribute(
      'visibility', visible ? 'visible' : 'hidden'
    );
    const listBefore = this.layers.value;
    this.updateLayerList();
    this.doc.undoStack.push(new UndoActionLayer(
      this.canvas, this.updateLayerList.bind(this),
      [], [], listBefore, this.layers.value
    ));
  }

  /** Get a layer by its name */
  private getLayer(name: string): SVGGElement {
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

  public deleteLayer(name: string, undoable = true) {
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

  public renameLayer(name: string, newName: string) {
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

  public generateBackground(generator: BackgroundGenerator) {
    if (this.getLayer('Background')) this.deleteLayer('Background', false);
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
    };
  }

  public setPageProps(props: PageProps, undoable = true) {
    const propsBefore = this.getPageProps();
    this.setPageSize(props);
    this.backgroundColor = props.backgroundColor;
    this.backgroundStyle = props.backgroundStyle;
    this.generateBackground(BackgroundGenerators[props.backgroundStyle]);
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
    this.updateDisplaySize();
  }

  // ------------------------------------------------------------
  // tools and helpers
  // ------------------------------------------------------------

  public onMouseDown(e: MouseEvent) {
    this._rect = this.toolLayer.getBoundingClientRect();
  }

  /**
   * Translate x and y to canvas coords. USE THIS FOR ALL COORDINATE
   * TRANSLATIONS, OTHERWISE ZOOM WILL NOT WORK.
   */
  public globalCoordsToCanvas(
    pt: { x: number, y: number }
  ): { x: number, y: number } {
    return {
      x: (pt.x - this._rect.left) * 1 / this.zoom,
      y: (pt.y - this._rect.top) * 1 / this.zoom
    };
  }

  /**
   * Translate r to canvas coords. USE THIS FOR ALL COORDINATE TRANSLATIONS,
   * OTHERWISE ZOOM WILL NOT WORK.
   */
  public globalDOMRectToCanvas(r: DOMRect): DOMRect {
    return DOMRect.fromRect({
      x: (r.x - this._rect.left) * 1 / this.zoom,
      y: (r.y - this._rect.top) * 1 / this.zoom,
      width: r.width * 1 / this.zoom,
      height: r.height * 1 / this.zoom,
    });
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

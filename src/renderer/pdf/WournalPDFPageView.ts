// we need to import this on startup to have pdf.js do its rendering
// asynchronously in a web worker
import 'pdfjs-dist/webpack';

import * as pdfjs from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import { css } from './pdf_viewer.css';
import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFPageView } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { DEFAULT_ZOOM_FACTOR } from 'document/WournalPageSize';

const PDF_PAGE_VIEW_CSS_SHEET = new CSSStyleSheet();
PDF_PAGE_VIEW_CSS_SHEET.replaceSync(css);

export class WournalPDFPageView {

  private static readonly DEFAULT_ZOOM_ADJUSTED =
    pdfjs.PixelsPerInch.PDF_TO_CSS_UNITS / DEFAULT_ZOOM_FACTOR;

  private viewer: { viewer: PDFPageView, container: HTMLDivElement } | false = false;
  public readonly display: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private zoom: number;
  private needsDrawing = true;

  private readonly loadingEl: SVGSVGElement;

  constructor(
    private page: PDFPageProxy,
    initialZoom?: number,
  ) {
    this.zoom = initialZoom ?? 1;

    this.display = document.createElement('div');
    this.display.setAttribute('class', 'wournal-pdf-page-view');
    this.display.style.position = 'absolute';
    this.display.style.pointerEvents = 'none';

    this.shadow = this.display.attachShadow({ mode: 'closed' });

    this.loadingEl = this.genLoadingBackground();

    if ('adoptedStyleSheets' in Document.prototype) {
      this.shadow.adoptedStyleSheets.push(PDF_PAGE_VIEW_CSS_SHEET);
    } else {
      const styles = document.createElement('style');
      styles.innerText = css;
      this.shadow.append(styles);
    }

    this.setLoading(true);
  }

  private createViewer() {
    console.debug(`Creating PDF Viewer for Page ${this.page.pageNumber}`);

    const container = document.createElement('div');
    container.id = 'container';

    const viewer = new pdfjsViewer.PDFPageView({
      container: container,
      id: 1,
      defaultViewport: this.page.getViewport({
        scale: WournalPDFPageView.DEFAULT_ZOOM_ADJUSTED
      }),
      scale: this.zoom / DEFAULT_ZOOM_FACTOR,
      eventBus: new pdfjsViewer.EventBus(),
      textLayerMode: 1,
    });

    viewer.setPdfPage(this.page);

    return { viewer, container };
  }

  public async free() {
    if (!this.viewer) return;
    console.debug(`Freeing PDF Viewer for Page ${this.page.pageNumber}`);
    this.viewer.viewer.destroy();
    this.setLoading(true);
    this.viewer = false;
    this.needsDrawing = true;
  }

  public async drawIfNeeded(): Promise<void> {
    if (!this.needsDrawing) return;
    if (!this.viewer) this.viewer = this.createViewer();
    console.debug(`Drawing PDF Viewer for Page ${this.page.pageNumber}`);
    this.setLoading(true);
    const resp = this.viewer.viewer.draw();
    this.needsDrawing = false;
    await resp;
    this.setLoading(false);
    return;
  }

  public getDimensionsPx(): { width: number, height: number } {
    const { width, height } = this.page.getViewport({
      scale: WournalPDFPageView.DEFAULT_ZOOM_ADJUSTED
    });
    return {
      width: parseFloat(width.toFixed(2)),
      height: parseFloat(height.toFixed(2))
    };
  }

  public async setZoom(zoom: number) {
    this.zoom = zoom;
    if (this.viewer) this.viewer.viewer.update({ scale: zoom / DEFAULT_ZOOM_FACTOR });
    this.needsDrawing = true;

    const dim = this.getDimensionsPx();
    this.loadingEl.setAttribute('height', `${dim.height * zoom}px`);
    this.loadingEl.setAttribute('width', `${dim.width * zoom}px`);
  }

  public getZoom(): number {
    return this.zoom;
  }

  private genLoadingBackground(): SVGSVGElement {
    const dim = this.getDimensionsPx();
    const width = dim.width * this.zoom, height = dim.height * this.zoom;
    const center = { x: width / 2, y: height / 2 };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', `${width}px`);
    svg.setAttribute('height', `${height}px`);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', width.toString());
    rect.setAttribute('height', height.toString());
    rect.setAttribute('fill', 'white');
    rect.setAttribute('stroke', 'white');
    svg.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    svg.appendChild(text);

    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttribute('x', center.x.toString());
    tspan.setAttribute('y', center.y.toString());
    tspan.setAttribute('font-family', 'Roboto Mono');
    tspan.setAttribute('font-size', '20');
    tspan.innerHTML = 'Loading PDF...';
    text.appendChild(tspan);

    return svg;
  }

  private setLoading(loading: boolean) {
    if (loading) {
      const children = Array.from(this.shadow.children);
      if (this.viewer && children.indexOf(this.viewer.container) !== -1)
        this.shadow.removeChild(this.viewer.container);
      if (children.indexOf(this.loadingEl) === -1)
        this.shadow.appendChild(this.loadingEl);
    } else {
      const children = Array.from(this.shadow.children);
      if (children.indexOf(this.loadingEl) !== -1)
        this.shadow.removeChild(this.loadingEl);
      if (this.viewer && children.indexOf(this.viewer.container) === -1)
        this.shadow.appendChild(this.viewer.container);
    }
  }


}

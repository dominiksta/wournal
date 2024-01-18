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

  private viewer: PDFPageView | false = false;
  public readonly display: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private container: HTMLDivElement;
  private zoom: number;
  private needsDrawing = true;

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

    if ('adoptedStyleSheets' in Document.prototype) {
      this.shadow.adoptedStyleSheets.push(PDF_PAGE_VIEW_CSS_SHEET);
    } else {
      const styles = document.createElement('style');
      styles.innerText = css;
      this.shadow.append(styles);
    }
  }

  private createViewer() {
    console.debug(`Creating PDF Viewer for Page ${this.page.pageNumber}`);

    this.container = document.createElement('div');
    this.container.id = 'container';
    this.shadow.appendChild(this.container);

    const viewer = new pdfjsViewer.PDFPageView({
      container: this.container,
      id: 1,
      defaultViewport: this.page.getViewport({
        scale: WournalPDFPageView.DEFAULT_ZOOM_ADJUSTED
      }),
      scale: this.zoom / DEFAULT_ZOOM_FACTOR,
      eventBus: new pdfjsViewer.EventBus(),
      textLayerMode: 1,
    });

    viewer.setPdfPage(this.page);

    return viewer;
  }

  public async free() {
    if (!this.viewer) return;
    console.debug(`Freeing PDF Viewer for Page ${this.page.pageNumber}`);
    this.viewer.destroy();
    this.shadow.removeChild(this.container);
    this.viewer = false;
    this.needsDrawing = true;
  }

  public async drawIfNeeded(): Promise<any> {
    if (!this.needsDrawing) return;
    if (!this.viewer) this.viewer = this.createViewer();
    console.debug(`Drawing PDF Viewer for Page ${this.page.pageNumber}`);
    const resp = this.viewer.draw();
    this.needsDrawing = false;
    return await resp;
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
    if (this.viewer) this.viewer.update({ scale: zoom / DEFAULT_ZOOM_FACTOR });
    this.needsDrawing = true;
  }

  public getZoom(): number {
    return this.zoom;
  }

}

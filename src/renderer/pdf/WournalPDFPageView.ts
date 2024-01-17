// we need to import this on startup to have pdf.js do its rendering
// asynchronously in a web worker
import 'pdfjs-dist/webpack';

import * as pdfjs from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import { css } from './pdf_viewer.css';
import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFPageView } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { DEFAULT_ZOOM_FACTOR } from 'document/WournalPageSize';

export class WournalPDFPageView {

  private static readonly DEFAULT_ZOOM_FACTOR = 1;
  private static readonly DEFAULT_ZOOM_ADJUSTED =
    WournalPDFPageView.DEFAULT_ZOOM_FACTOR *
    pdfjs.PixelsPerInch.PDF_TO_CSS_UNITS / DEFAULT_ZOOM_FACTOR;

  private viewer: PDFPageView;
  public readonly display: HTMLDivElement;
  private zoom = 1;
  private needsDrawing = false;

  constructor(
    private page: PDFPageProxy,
  ) {
    const s = this.setup();
    this.viewer = s.viewer;
    this.display = s.display;
  }

  private setup() {
    const scale = WournalPDFPageView.DEFAULT_ZOOM_ADJUSTED;
    const viewport = this.page.getViewport({ scale });

    const _shadow = document.createElement('div');
    _shadow.setAttribute('class', 'wournal-pdf-page-view');
    _shadow.style.position = 'absolute';
    const shadow = _shadow.attachShadow({ mode: 'closed' });

    // TODO: optimize with adoptedStyleSheets

    const styles = document.createElement('style');
    styles.innerText = css;
    shadow.appendChild(styles);

    const container = document.createElement('div');
    container.id = 'container';
    shadow.appendChild(container);

    const eventBus = new pdfjsViewer.EventBus();
    const viewer = new pdfjsViewer.PDFPageView({
      container,
      id: 1,
      defaultViewport: viewport,
      scale: 1,
      eventBus,
      textLayerMode: 1,
    });

    viewer.setPdfPage(this.page);
    this.needsDrawing = true;

    return {
      viewer,
      display: _shadow,
    };
  }

  public async drawIfNeeded(): Promise<any> {
    if (!this.needsDrawing) return;
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
    this.viewer.update({
      scale: zoom / DEFAULT_ZOOM_FACTOR
    });
    this.needsDrawing = true;
  }

  public getZoom(): number {
    return this.zoom;
  }

}

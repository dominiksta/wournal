import * as pdfjs from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/build/pdf.worker';
import { css } from './pdf_viewer.css';
import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFPageView } from 'pdfjs-dist/web/pdf_viewer.mjs';

// accessing this and importing pdf.worker sets up a default
pdfjs.GlobalWorkerOptions.workerSrc

export class WournalPDFPageView {

  private viewer: PDFPageView;
  public readonly display: HTMLDivElement;
  private zoom = 1;

  constructor(
    private page: PDFPageProxy,
  ) {
    const s = this.setup();
    this.viewer = s.viewer;
    this.display = s.display;
  }

  private setup() {
    const defaultZoom = 1;

    const viewport = this.page.getViewport({
      scale: defaultZoom / pdfjs.PixelsPerInch.PDF_TO_CSS_UNITS
    });

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
      isOffscreenCanvasSupported: true,
    });

    viewer.setPdfPage(this.page);
    viewer.draw();

    return {
      viewer,
      display: _shadow,
    };
  }

  public getDimensionsPx(): { width: number, height: number } {
    const { width, height } = this.page.getViewport({
      scale: 1 * pdfjs.PixelsPerInch.PDF_TO_CSS_UNITS
    });
    return { width, height };
  }

  public async setZoom(zoom: number) {
    this.zoom = zoom;
    this.viewer.update({ scale: zoom });
    return await this.viewer.draw();
  }

  public getZoom(): number {
    return this.zoom;
  }

}

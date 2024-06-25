// we need to import this on startup to have pdf.js do its rendering
// asynchronously in a web worker
import 'pdfjs-dist/webpack';

import * as pdfjs from 'pdfjs-dist';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import { css } from './pdf_viewer.css';
import type { PDFPageProxy, RefProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFPageView } from 'pdfjs-dist/web/pdf_viewer.mjs';
import { DEFAULT_ZOOM_FACTOR } from 'document/WournalPageSize';
import { debounce } from 'lodash';
import WournalPDFPageViewContextMenu from './WournalPDFPageViewContextMenu';
import { SearchText } from 'document/types';
import { SVGUtils } from 'util/SVGUtils';
import getTextRanges from 'util/get-text-ranges';
import { Highlights } from 'util/highlights';
import { DSUtils } from 'util/DSUtils';
import { getLogger } from 'util/Logging';

const LOG = getLogger(__filename);

export const PDF_CTX_MENU = new WournalPDFPageViewContextMenu();
document.body.append(PDF_CTX_MENU);

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
  private readonly zoomPreview = document.createElement('canvas');
  private readonly zoomPreviewCtx = this.zoomPreview.getContext('2d');
  private readonly textHighlightLayer = SVGUtils.create('svg', {
    style: 'position: absolute; pointerEvents: none; width: 100%; height: 100%',
  });

  private readonly annotations: Promise<PDFPageAnnotation[]>;

  constructor(
    private page: PDFPageProxy,
    private isVisible: () => boolean,
    private scrollToDest: (dest: PDFDestination) => void,
    initialZoom?: number,
    private defaultZoom: number = 1,
  ) {
    this.annotations = page.getAnnotations();

    this.zoom = initialZoom ?? 1;

    this.display = document.createElement('div');
    this.display.setAttribute('class', 'wournal-pdf-page-view');
    this.display.style.position = 'absolute';
    this.display.style.transform = 'none';
    this.display.style.transformOrigin = '0 0';
    this.display.addEventListener('contextmenu', e => {
      // this is so bad
      // https://stackoverflow.com/a/70523247
      const sel: Selection = ('chrome' in window)
        ? (this.shadow as any).getSelection()
        : document.getSelection();

      PDF_CTX_MENU.show(e, sel);
    });
    this.setAllowTextSelection(false);

    this.shadow = this.display.attachShadow({ mode: 'open' });

    this.loadingEl = this.genLoadingBackground();

    if ('adoptedStyleSheets' in Document.prototype) {
      this.shadow.adoptedStyleSheets.push(PDF_PAGE_VIEW_CSS_SHEET);
    } else {
      const styles = document.createElement('style');
      styles.innerText = css;
      this.shadow.append(styles);
    }

    this.zoomPreview.hidden = true;
    this.shadow.appendChild(this.zoomPreview);
    this.shadow.appendChild(this.textHighlightLayer);
    this.disableZoomPreview();
    this.setLoading(true);
  }

  private createViewer() {
    LOG.debug(`Creating PDF Viewer for Page ${this.page.pageNumber}`);

    const container = document.createElement('div');
    container.id = 'container';

    const viewer = new pdfjsViewer.PDFPageView({
      container: container,
      id: 1,
      imageResourcesPath: 'res/pdf-js-annotation-layer/',
      defaultViewport: this.page.getViewport({
        scale: WournalPDFPageView.DEFAULT_ZOOM_ADJUSTED * this.defaultZoom
      }),
      scale: this.zoom / DEFAULT_ZOOM_FACTOR * this.defaultZoom,
      eventBus: new pdfjsViewer.EventBus(),
      textLayerMode: 1,
      isOffscreenCanvasSupported: false
    });

    viewer.setPdfPage(this.page);

    return { viewer, container };
  }

  private allowTextSelection: boolean = false;
  public setAllowTextSelection(allow: boolean) {
    this.allowTextSelection = allow;
    this.display.style.pointerEvents = allow ? '' : 'none';

    if (this.viewer) {
      const annotEls =
        this.viewer.viewer.annotationLayer.div.querySelectorAll<HTMLElement>(
          'section[data-annotation-id]'
        );
      for (const el of annotEls) el.style.pointerEvents = allow ? '' : 'none';
    }
  }

  public async free() {
    if (!this.viewer) return;
    LOG.debug(`Freeing PDF Viewer for Page ${this.page.pageNumber}`);
    this.viewer.viewer.destroy();
    this.setLoading(true);
    this.viewer = false;
    this.needsDrawing = true;
  }

  public async drawOrFree(): Promise<void> {
    if (!this.isVisible()) {
      this.free();
      return;
    }
    if (!this.needsDrawing) return;
    if (!this.viewer) {
      this.viewer = this.createViewer();
      this.setLoading(false);
    }
    LOG.debug(`Drawing PDF Viewer for Page ${this.page.pageNumber}`);
    const resp = this.viewer.viewer.draw();
    this.needsDrawing = false;
    await resp;
    this.disableZoomPreview();
    this.doHighlightText();

    // the annotationlayer div is created asynchronously after the viewer is
    // already returned. this seems to be the only real way to ensure it exists
    await DSUtils.waitNotEq(
      () => (this.viewer as any).viewer.annotationLayer, undefined, 1000
    );
    await DSUtils.waitNotEq(
      () => (this.viewer as any).viewer.annotationLayer.div, null, 1000
    );
    this.setAllowTextSelection(this.allowTextSelection);
    await this.setupAnnotationEventListeners(this.viewer.viewer);
    return;
  }

  public getDimensionsPx(): { width: number, height: number } {
    const { width, height } = this.page.getViewport({
      scale: WournalPDFPageView.DEFAULT_ZOOM_ADJUSTED * this.defaultZoom
    });
    return {
      width: parseFloat(width.toFixed(2)),
      height: parseFloat(height.toFixed(2))
    };
  }

  public setZoom(zoom: number) {
    this.enableZoomPreview(this.zoom, zoom);

    const dim = this.getDimensionsPx();
    this.loadingEl.setAttribute('height', `${dim.height * zoom}px`);
    this.loadingEl.setAttribute('width', `${dim.width * zoom}px`);

    this.setZoomRenderer(zoom);
  }

  private _setZoomRerender(zoom: number) {
    if (this.viewer) this.viewer.viewer.update({
      scale: zoom / DEFAULT_ZOOM_FACTOR * this.defaultZoom
    });
    this.zoom = zoom;
    this.needsDrawing = true;
    if (this.isVisible()) this.drawOrFree();
  }
  private setZoomRenderer = debounce(this._setZoomRerender.bind(this), 500);

  public getZoom(): number { return this.zoom; }

  private highlightedText:
    { text: string, emphasizeIdx: number | false, matchCase: boolean } | false = false;

  public async highlightText(
    text: string, emphasizeIdx: number | false = false, matchCase = true,
  ) {
    this.highlightedText = { text, emphasizeIdx, matchCase };
    if (this.isVisible()) {
      await this.drawOrFree();
      this.doHighlightText();
    }
  }

  private doHighlightText() {
    if (!this.viewer) return;
    if (this.highlightedText !== false) {
      const { text, matchCase, emphasizeIdx } = this.highlightedText;
      const textLayer = this.viewer.viewer.textLayer.div;
      const textLayerContent = matchCase
        ? textLayer.textContent
        : textLayer.textContent.toLowerCase();
      if (textLayerContent.indexOf(matchCase ? text : text.toLowerCase()) === -1) return;
      const spans = Array.from(
        textLayer.querySelectorAll<HTMLSpanElement>('span:not(:has(span))')
      ).filter(el => el.innerText != '');
      const ranges = getTextRanges(text, spans, matchCase);
      if (ranges.length !== 0) {
        ranges.forEach(r => Highlights.add(r, 'search'));
        if (emphasizeIdx !== false) {
          console.assert(
            emphasizeIdx < ranges.length, { emphIdx: emphasizeIdx, ranges }
          );
          Highlights.add(
            ranges[Math.min(emphasizeIdx, ranges.length - 1)], 'search-current'
          );
        }
      }
    }
  }

  private textCache: SearchText[] | false = false;
  public async getText(): Promise<SearchText[]> {
    if (this.textCache === false) {
      this.textCache = [];
      const scale = 1;
      const { height } = this.page.getViewport({ scale: 1 });
      const textContent = await this.page.getTextContent();
      for (const item of textContent.items) {
        if ('type' in item || item.str.trim() === '') continue;
        this.textCache.push({
          str: item.str,
          rect: {
            // https://github.com/mozilla/pdf.js/issues/5643#issuecomment-239993212
            x: item.transform[4] * scale,
            y: height - ((item.transform[5] + item.height) * scale),
            width: item.width * scale,
            height: item.height* scale,
          }
        });
      }
    }
    return this.textCache;
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

  private enableZoomPreview(oldZoom: number, newZoom: number) {
    if (!this.viewer) return;
    const viewer = this.viewer.viewer.canvas;
    this.zoomPreview.height = viewer.height;
    this.zoomPreview.width = viewer.width;
    this.zoomPreview.style.height = viewer.style.height;
    this.zoomPreview.style.width = viewer.style.width;
    const factor = newZoom / oldZoom;
    this.zoomPreview.style.transform = `scale(${factor})`;
    this.zoomPreview.style.transformOrigin = '0 0';
    this.zoomPreviewCtx.drawImage(viewer, 0, 0); // copy img
    this.viewer.container.hidden = true;
    this.zoomPreview.hidden = false;
  }

  private disableZoomPreview() {
    this.zoomPreview.hidden = true;
    if (this.viewer) this.viewer.container.hidden = false;
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

  private hideAnnotations: boolean = false;
  public setAnnotationVisility(visible: boolean) {
    this.hideAnnotations = !visible;
    if (this.viewer) {
      this.viewer.viewer.annotationLayer.div.style.display = visible ? 'block' : 'none';
    }
  }

  private async setupAnnotationEventListeners(
    viewer: PDFPageView | undefined
  ) {
    if (!viewer) return;
    this.setAnnotationVisility(!this.hideAnnotations);

    const annotations = await this.annotations;

    const annotEls = viewer.annotationLayer.div.querySelectorAll<HTMLElement>(
      'section[data-annotation-id]'
    );

    const allowHoverFor = [
      AnnotationType.TEXT, AnnotationType.POPUP, AnnotationType.LINK,
    ];

    for (const annotEl of annotEls) {
      const id = annotEl.getAttribute('data-annotation-id');
      if (id.startsWith('popup_')) continue;

      const annot = annotations.find(a => a.id === id);
      if (annot === undefined) throw new Error(
        'Could not find annotation for DOM el', { cause: { id, annotations } }
      );

      if (!allowHoverFor.includes(annot.annotationType))
        annotEl.style.display = 'none';

      annotEl.addEventListener('click', e => {
        e.preventDefault();
        LOG.info('Annotation Click: ', annot)

        if (!('subtype' in annot && annot.subtype === 'Link')) return;

        if ('unsafeUrl' in annot) window.open(annot.unsafeUrl);  // external link
        else if ('dest' in annot) this.scrollToDest(annot.dest); // internal link

      }, true);
    }
  }

}

// see https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf
// page 373 aka 365
type PDFDestination =
  string | // named destination
  [ // explicit destination
    RefProxy,
    { name: string },
    number, number, number,
  ];

interface PDFPageAnnotation {
  // incomplete
  id: string;
  annotationType: AnnotationType;
  subtype?: 'Link' | string;
  dest?: PDFDestination;

  // only for external links. no idea that the difference is.
  unsafeUrl?: string;
  url?: string;
}

// copied from pdf.image_decoders.mjs
enum AnnotationType {
  TEXT = 1, LINK = 2, FREETEXT = 3, LINE = 4, SQUARE = 5, CIRCLE = 6, POLYGON = 7,
  POLYLINE = 8, HIGHLIGHT = 9, UNDERLINE = 10, SQUIGGLY = 11, STRIKEOUT = 12,
  STAMP = 13, CARET = 14, INK = 15, POPUP = 16, FILEATTACHMENT = 17, SOUND = 18,
  MOVIE = 19, WIDGET = 20, SCREEN = 21, PRINTERMARK = 22, TRAPNET = 23, WATERMARK = 24,
  THREED = 25, REDACT = 26,
};

import { inject } from 'dependency-injection';
import { CanvasPath } from 'document/CanvasPath';
import { CanvasText } from 'document/CanvasText';
import { WournalDocument } from 'document/WournalDocument';
import { PDFDocument, PDFPage, RGB, ColorTypes, LineCapStyle, PDFFont, PDFEmbeddedPage, PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { SVGUtils } from 'util/SVGUtils';
import { CanvasImage } from 'document/CanvasImage';
import { setOutline } from './set-outline';
import { OutlineNode } from 'persistence/DocumentMeta';

const AvailableFonts = ['Roboto', 'Roboto Mono'] as const;
type AvailableFont = 'Roboto' | 'Roboto Mono';

type EmbeddedFont = {
  'italic': { 'normal': PDFFont, 'bold': PDFFont, },
  'normal': { 'normal': PDFFont, 'bold': PDFFont, },
}

type FontLocation = {
  'italic': { 'normal': string, 'bold': string, },
  'normal': { 'normal': string, 'bold': string, },
}

export default class PDFExporter {

  private readonly fs = inject('FileSystem');

  constructor() {

  }

  async exportDocument(doc: WournalDocument): Promise<ArrayBuffer> {
    const pdfDocuments: { [fileName: string]: PDFEmbeddedPage[] } = {};
    const ret = await PDFDocument.create();
    ret.registerFontkit(fontkit);
    const fonts = await this.embedFonts(ret);

    for (const page of doc.pages.value) {
      console.log(`exporting page ${doc.pages.value.indexOf(page)}`);
      const pdfPage = PDFPage.create(ret);
      const pageProps = page.getPageProps();
      pdfPage.setSize(pageProps.width, pageProps.height);

      // pdf background
      // ================================================================
      if (page.pdfMode) {
        const fileName = page.pdfMode.fileName;
        if (!(fileName in pdfDocuments)) {
          const file = await this.fs.read(fileName);
          if (!file) throw new Error('File Not Found');
          const embedDoc = await PDFDocument.load(await file.arrayBuffer());
          pdfDocuments[fileName] = await ret.embedPdf(
            embedDoc,
            [...Array(embedDoc.getPageCount()).keys()],
          );
        }

        const bgPage = pdfDocuments[fileName][pageProps.pdfMode.pageNr - 1];
        pdfPage.drawPage(bgPage, {
          x: 0, y: 0,
          height: pageProps.height, width: pageProps.width,
        });
      }


      // wournal canvas elements
      // ================================================================
      layers: for (const layer of page.layers.value) {
        if (!layer.visible) continue layers;

        // non-pdf background
        // ------------------------------------------------------------
        if (layer.name === 'Background' && page.pdfMode) continue layers;
        if (layer.name === 'Background' && !page.pdfMode) {
          pdfPage.drawRectangle({
            width: pageProps.width,
            height: pageProps.height,
            color: colorFromHexString(pageProps.backgroundColor),
          });
          for (const el of page.getLayer(layer.name).children) {
            pdfPage.moveTo(0, pdfPage.getHeight());
            if (el instanceof SVGRectElement) continue;
            if (!(el instanceof SVGPathElement)) {
              console.warn(
                `Unsupported SVG Element in Background Export: ${el.constructor}`
              );
              continue;
            }
            pdfPage.drawSvgPath(el.getAttribute('d'), {
              borderColor: colorFromHexString(el.getAttribute('stroke')),
            });
          }
          continue layers;
        }

        const g = page.getLayer(layer.name);
        for (const el of (Array.from(g.children) as SVGGraphicsElement[])) {
          pdfPage.moveTo(0, pdfPage.getHeight());

          // text
          // ------------------------------------------------------------
          if (el instanceof SVGTextElement) {
            const canvasText = new CanvasText(el)
            const lineHeight = CanvasText.lineHeightForFontSize(canvasText.getFontSize());
            const font: PDFFont = (() => {
              const family = canvasText.getFontFamily();
              const style = canvasText.getFontStyle();
              const weight = canvasText.getFontWeight();
              if (AvailableFonts.indexOf(family as any) === -1) {
                console.warn(`Font Not Available: ${family}`);
                return fonts.Roboto[style][weight];
              }
              return (fonts as any)[family][style][weight];
            })();

            pdfPage.drawText(canvasText.getText(), {
              color: colorFromHexString(canvasText.getColor()),
              font,
              size: canvasText.getFontSize(),
              lineHeight,
              x: canvasText.getPos().x,
              y: pageProps.height - canvasText.getPos().y - lineHeight,
            });

          // path
          // ------------------------------------------------------------
          } else if (el instanceof SVGPathElement) {
            const canvasPath = new CanvasPath(el);
            pdfPage.drawSvgPath(el.getAttribute('d'), {
              borderColor: colorFromHexString(canvasPath.getColor()),
              borderOpacity: canvasPath.getOpacity(),
              borderLineCap: LineCapStyle.Round,
              borderWidth: canvasPath.getStrokeWidth(),
            });

          // image
          // ------------------------------------------------------------
          } else if (el instanceof SVGImageElement) {
            const canvasImg = new CanvasImage(el).serialize();
            const dataUrl = canvasImg.dataUrl;
            let img: PDFImage;
            if (dataUrl.startsWith('data:image/png')) {
              img = await ret.embedPng(dataUrl);
            } else if (
              dataUrl.startsWith('data:image/jpg') || dataUrl.startsWith('data:image/jpeg')
            ) {
              img = await ret.embedJpg(dataUrl);
            } else {
              throw new Error(`Unsupported Image: ${dataUrl.slice(0, 20)}...`);
            }
            pdfPage.drawImage(img, {
              x: canvasImg.rect.x,
              y: pageProps.height - canvasImg.rect.y - canvasImg.rect.height,
              width: canvasImg.rect.width,
              height: canvasImg.rect.height,
            });
          } else {
            console.error(el);
            throw new Error('Unsupported Svg Element!');
          }
        }

      }

      ret.addPage(pdfPage);
    }

    await setOutline(ret, doc.meta.value.outline);

    console.log('Creating PDF ArrayBuffer...');
    const uint8array = await ret.save()
    console.log('Done Creating PDF ArrayBuffer');
    return uint8array.buffer.slice(
      uint8array.byteOffset, uint8array.byteLength + uint8array.byteOffset
    );
  }

  private async embedFonts(doc: PDFDocument): Promise<Record<AvailableFont, EmbeddedFont>> {
    const ret: any = {};
    for (const family of AvailableFonts) {
      const embedded: EmbeddedFont = {
        'normal': {
          'normal' : await this.embedFont(doc, family, 'normal', 'normal'),
          'bold'   : await this.embedFont(doc, family, 'normal', 'bold'),
        },
        'italic': {
          'normal' : await this.embedFont(doc, family, 'italic', 'normal'),
          'bold'   : await this.embedFont(doc, family, 'italic', 'bold'),
        },
      }
      ret[family] = embedded;
    }
    return ret;
  }

  private async embedFont(
    doc: PDFDocument,
    family: AvailableFont,
    style: 'normal' | 'italic',
    weight: 'bold' | 'normal'
  ): Promise<PDFFont> {
    if (!(family in PDFExporter.FONT_LOCATIONS)) throw new Error('Font Not Available');
    const urls = PDFExporter.FONT_LOCATIONS[family];
    const fontBytes = await fetch(urls[style][weight]).then(res => res.arrayBuffer());
    return await doc.embedFont(fontBytes);
  }

  private static readonly FONT_LOCATIONS: Record<AvailableFont, FontLocation> = {
    'Roboto': {
      'normal': {
        'normal' : 'res/font/roboto/roboto-v29-latin-ext-regular.ttf',
        'bold'   : 'res/font/roboto/roboto-v29-latin-ext-700.ttf',
      },
      'italic': {
        'normal' : 'res/font/roboto/roboto-v29-latin-ext-italic.ttf',
        'bold'   : 'res/font/roboto/roboto-v29-latin-ext-700italic.ttf',
      },
    },
    'Roboto Mono': {
      'normal': {
        'normal' : 'res/font/roboto-mono/roboto-mono-v13-latin-ext-regular.ttf',
        'bold'   : 'res/font/roboto-mono/roboto-mono-v13-latin-ext-700.ttf',
      },
      'italic': {
        'normal' : 'res/font/roboto-mono/roboto-mono-v13-latin-ext-italic.ttf',
        'bold'   : 'res/font/roboto-mono/roboto-mono-v13-latin-ext-700italic.ttf',
      },
    }
  };

}

function colorFromHexString(hex: string): RGB {
  if (!hex.startsWith('#')) throw new Error(`Invalid Color: ${hex}`);
  return {
    type: ColorTypes.RGB,
    red: parseInt(hex.slice(1, 3), 16) / 255,
    green: parseInt(hex.slice(3, 5), 16) / 255,
    blue: parseInt(hex.slice(5, 7), 16) / 255,
  }
}

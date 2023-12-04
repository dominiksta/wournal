import { WournalPage } from "document/WournalPage";
import { FileUtils } from "util/FileUtils";
import ZipFile from "util/ZipFile";
import { DocumentDTO } from "./DocumentDTO";

export async function dtoToZip(doc: DocumentDTO): Promise<Blob> {
  const zipFile = new ZipFile();

  for (let i = 0; i < doc.length; i++) {
    zipFile.addFile(
      String(String(i).padStart(4, '0')) + '-page.svg', doc[i]
    );
  }
  return await zipFile.asBlob();
}

export async function blobToDoc(
  fileName: string, blob: Blob
): Promise<
  { dto: DocumentDTO, mode: 'multi-page' } |
  { dto: DocumentDTO, mode: 'single-page' } |
  { svg: string     , mode: 'background-svg' }
> {
  if (fileName.endsWith(".svg")) {
    const svg = await FileUtils.blobToUtf8String(blob, 'string');
    if (WournalPage.svgIsMarkedAsWournalPage(svg)) {
      return { dto: [ svg ], mode: 'single-page' };
    } else {
      return { svg, mode: 'background-svg' };
    }
  } else {
    const zipFile = await ZipFile.fromBlob(blob);
    const pages = await Promise.all((await zipFile.allFiles())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async f => await FileUtils.blobToUtf8String(f.blob, "string")));
    return { dto: pages, mode: 'multi-page' };
  }
}

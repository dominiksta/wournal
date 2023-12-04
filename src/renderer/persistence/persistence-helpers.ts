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
): Promise<DocumentDTO> {
  if (fileName.endsWith(".svg")) {
    return [ await FileUtils.blobToUtf8String(blob, "string") ];
  } else {
    const zipFile = await ZipFile.fromBlob(blob);
    const pages = await Promise.all((await zipFile.allFiles())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async f => await FileUtils.blobToUtf8String(f.blob, "string")));
    return pages;
  }
}

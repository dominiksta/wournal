import JSZip from "jszip";

export default class ZipFile {

  private jsZip: JSZip;

  constructor() {
    this.jsZip = new JSZip();
  }

  addFile(name: string, content: string | Blob) {
    this.jsZip.file(name, content);
  }

  async getFile(name: string): Promise<Blob> {
    return await this.jsZip.file(name).async('blob');
  }

  listFiles(): string[] {
    const ret: string[] = [];
    this.jsZip.forEach((relativePath: string, _zipObject: any) => {
      ret.push(relativePath);
    });
    return ret;
  }

  async allFiles(): Promise<{ name: string, blob: Blob }[]> {
    const tmp: { name: string, zipObject: any }[] = [];
    this.jsZip.forEach((relativePath: string, _zipObject: any) => {
      tmp.push({
        name: relativePath, zipObject: _zipObject
      });
    });
    const ret: { name: string, blob: Blob }[] = [];
    for (let el of tmp) {
      ret.push({
        name: el.name,
        blob: await el.zipObject.async("blob")
      })
    }
    return ret;
  }

  async asBlob(): Promise<Blob> {
    return await this.jsZip.generateAsync({ type: "blob" });
  }

  static async fromBlob(blob: Blob): Promise<ZipFile> {
    const zipFile = new ZipFile();
    await zipFile.jsZip.loadAsync(blob);
    return zipFile;
  }
}

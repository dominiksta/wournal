import { getLogger } from "./Logging";

const LOG = getLogger(__filename);

export const FileUtils = {
  /** 'Download' given `text` as a UTF-8 file with `filename`. */
  downloadStringAsUtf8File: function(filename: string, text: string) {
    let element = document.createElement('a');
    element.setAttribute(
      'href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text)
    );
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  },

  /** 'Download' a given blob object with filename `name` */
  downloadBlob: function(blob: Blob, name: string) {
    // Create a link pointing to the ObjectURL containing the blob.
    const data = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = data;
    link.download = name;

    link.click();

    setTimeout(() => {
      window.URL.revokeObjectURL(data);
      link.remove();
    }, 100);
  },

  /**
   * Prompts the user for a file with one of `extensions`. If the mimetype of
   * the chosen file is not one of `mimeTypes`, throws an Error. Otherwise
   * rerturns a Promise that resolves to the raw contents of the chosen file.
   */
  promptReadFile: async function(
    extensions: string[] | "any" = "any",
    mimeTypes: string[] | "any" = "any",
  ): Promise<File | undefined> {
    let input = document.createElement("input");
    input.hidden = true;
    input.multiple = false;
    if (extensions !== "any")
      input.accept = extensions.map(e => "." + e).join(",")
    input.setAttribute("type", "file");

    // wait for input to come in
    const files = await new Promise<FileList>((resolve, reject) => {
      input.click();

      // credits: https://github.com/GoogleChromeLabs/browser-fs-access/blob/5d8a551af106121d010c1c50ca4a15d3cb0b189d/src/legacy/file-open.mjs#L32-L45
      const cancelDetector = () => {
        window.removeEventListener('focus', cancelDetector);
        if (input.files.length === 0) {
          reject(new DOMException('The user aborted a request.', 'AbortError'));
        }
      };

      input.addEventListener('click', () => {
        window.addEventListener('focus', cancelDetector, true);
      });

      input.addEventListener('change', () => {
        resolve(input.files);
      });
    });

    const ftype = files[0].type;
    const fname = files[0].name;

    const err = () => {
      throw new Error(
        "Invalid MimeType: Type was " + ftype
        + ". Filename was " + fname + "."
      );
    }

    // Check for invalid files. The `accept` attribute is not guaranteed to
    // work on all browsers.
    if (extensions !== "any" &&
      extensions.filter(ext => fname.endsWith("." + ext)).length === 0)
      err();

    if (mimeTypes !== "any" &&
      mimeTypes.filter(t => ftype === t).length === 0)
      err();


    return files[0];
  },

  blobToUtf8String: async function(
    blob: Blob,
    ret: "string" | "dataUrl",
  ) {
    return new Promise<string>(
      async (resolve) => {
        let reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        }
        if (ret === "string")
          reader.readAsText(blob, "UTF-8");
        else if (ret === "dataUrl")
          reader.readAsDataURL(blob);
      }
    );
  },

  utf8StringToBlob: function(data: string) {
    const BOM = new Uint8Array([0xEF,0xBB,0xBF]);
    return new Blob([BOM, data]);
  },

  /**
   * Prompts the user for a file with one of `extensions`. If the mimetype of
   * the chosen file is not one of `mimeTypes`, throws an Error. Otherwise
   * rerturns a Promise that resolves to the contents of the chosen file.
   *
   * The contents of the file will be returned as either a string or dataUrl
   * depending on the value of `ret`.
   *
   * Text files will be decoded as UTF-8.
   */
  promptReadFileAsUtf8String: async function(
    ret: "string" | "dataUrl",
    extensions: string[] | "any" = "any",
    mimeTypes: string[] | "any" = "any",
  ) {
    const file = await this.promptReadFile(extensions, mimeTypes);
    return {
      name: file.name,
      content: await this.blobToUtf8String(file, ret),
    }
  },

  /** return computed with for dataUrl image in px */
  imageDimensionsForDataUrl: async function(
    dataUrl: string
  ): Promise<{ width: number, height: number }> {
    return new Promise<{ width: number, height: number }>(
      async (resolve) => {
        let i = new Image();
        i.onload = () => {
          resolve({ width: i.width, height: i.height })
        };
        i.src = dataUrl;
      }
    )
  },

  /** Return the first <svg> element from the xml file string `s` */
  firstSvgElFromXmlFileString: function(s: string): SVGSVGElement {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(s, "image/svg+xml");
    // LOG.warn(xmlDoc.firstElementChild);
    return xmlDoc.firstElementChild as SVGSVGElement;
  },

  /** Add an xml header to the file string `s` */
  addXmlHeaderToSvgString: function(s: string): string {
    if (s.startsWith("<?xml")) return s;

    let header = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<!-- Created with Wournal ` +
      `(https://github.com/dominiksta/wournal/) -->\n\n`

    return header + s;
  },

  SEP: navigator.userAgent.includes('Windows') ? '\\' : '/',

  fileNamePath: function(path: string): string {
    const split = path.split(/[/\\]/);
    return split.slice(0, split.length - 1).join(FileUtils.SEP);
  },

  fileNameNoPath: function(path: string): string {
    const split = path.split(/[/\\]/);
    return split[split.length - 1];
  },

  fileNameBase: function(path: string): string {
    return path.slice(0, path.lastIndexOf('.'));
  },

  fileExtension: function(path: string): string {
    return path.slice(path.lastIndexOf('.') + 1, path.length)
  },

  shorterReadablePath: function(path: string): string {
    const parts = path.split(FileUtils.SEP);

    try {
      for (let i = 1; i < parts.length - 1; i++) {
        parts[i] = parts[i][0];
      }
      let start = parts.slice(0, parts.length - 2).join(FileUtils.SEP);
      // LOG.info(start, start.length);
      if (start.length > 10) start =
        '...' + FileUtils.SEP + path.split(FileUtils.SEP)[parts.length - 2];

      return start + FileUtils.SEP + parts[parts.length - 1];
    } catch (e) {
      LOG.warn(`oopsie when shortening path: ${path}`, e);
      return path;
    }
  },

}

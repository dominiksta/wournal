import { LOG } from "./Logging";

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
    promptReadFile: async function(
        ret: "string" | "dataUrl",
        extensions: string[] | "any" = "any",
        mimeTypes: string[] | "any" = "any",
    ) {
        let input = document.createElement("input");
        input.hidden = true;
        input.multiple = false;
        if (extensions !== "any")
            input.accept = extensions.map(e => "." + e).join(",")
        input.setAttribute("type", "file");

        // wait for input to come in
        await new Promise<void>((resolve) => {
            input.click();
            input.onchange = () => resolve();
        });

        const ftype = input.files[0].type;
        const fname = input.files[0].name;

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

        return new Promise<{name: string, content: string}>(
            async (resolve) => {
                let reader = new FileReader();
                reader.onload = () => {
                    resolve({
                        name: input.files[0].name,
                        content: reader.result as string,
                    });
                }
                if (ret == "string")
                    reader.readAsText(input.files[0], "UTF-8");
                else if (ret === "dataUrl")
                    reader.readAsDataURL(input.files[0]);
            }
        );
    },

    /** return computed with for dataUrl image in px */
    imageDimensionsForDataUrl: async function(
        dataUrl: string
    ): Promise<{width: number, height: number}> {
        return new Promise<{width: number, height: number}>(
            async (resolve) => {
                let i = new Image();
                i.onload = () => {
                    resolve({width: i.width, height: i.height})
                };
                i.src = dataUrl;
            }
        )
    },

    /** Return the first <svg> element from the xml file string `s` */
    firstSvgElFromXmlFileString: function (s: string): SVGSVGElement {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(s, "image/svg+xml");
        LOG.debug(xmlDoc.firstElementChild);
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
}

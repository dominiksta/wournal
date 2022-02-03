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
     * Prompts the user for an .svg file. If the mimetype of the chosen file is
     * not 'image/svg+xml', throws an Error. Otherwise rerturns a Promise that
     * resolves to the contents of the chosen file.
     *
     * Only supports files encoded with UTF-8.
     */
    promptReadTextFile: async function(
    ): Promise<{name: string, content: string}> {
        let input = document.createElement("input");
        input.hidden = true;
        input.multiple = false;
        input.accept = ".svg,.txt";
        input.setAttribute("type", "file");

        // wait for input to come in
        await new Promise<void>((resolve) => {
            input.click();
            input.onchange = () => {
                resolve();
            }
        });

        // Check for invalid files. The `accept` attribute is not guaranteed to
        // work on all browsers.
        let ftype = input.files[0].type;
        if (!input.files[0].name.endsWith(".svg")
            && ftype !== "image/svg+xml") {
            throw new Error(
                "Invalid MimeType: " +
                    + " Type was " + input.files[0].type
                    + ". Filename was" + input.files[0].name + "."
            );
        }

        return new Promise<{name: string, content: string}>(
            async (resolve) => {
                let read = await new Promise<{name: string, content: string}>(
                    (resolve) => {
                        let reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                name: input.files[0].name,
                                content: reader.result as string,
                            });
                        }
                        reader.readAsText(
                            input.files[0], "UTF-8"
                        );
                    }
                );
                resolve(read);
            }
        );
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

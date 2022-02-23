let plainTextHandler = (text: string) => { console.log(text) };
let imageHandler = (dataUrl: string) => { console.log(dataUrl) };

const pasteEventHandler = (p: ClipboardEvent) => {
    // I am not sure why or how, but there could be multiple items
    // in the clipbard.
    for (let item of p.clipboardData.items) {
        // console.log(item);
        if (item.kind == 'file' && item.type.match('^image/')) {
            // Note: In my experience all pasted image data seems to
            // be of type image/png, no matter what the original source
            // file was. This could be my image viewer or the
            // browser, I don't know
            let blob = item.getAsFile();
            let reader = new FileReader();
            reader.onload = (event) =>
                imageHandler(event.target.result as string);
            reader.readAsDataURL(blob);
        } else if (item.kind == 'string'
            && item.type.match('^text/plain')) {
            // When copying with Ctrl-C in a browser, the text would
            // also be available as text/html.
            item.getAsString(plainTextHandler)
        }
    }
};

export const ClipboardUtils = {
    /** Enable `plainTextHandler` and `imageHandler` on `el` */
    enableHandlers: function(doc: Document): void {
        doc.body.addEventListener("paste", pasteEventHandler);
    },

    /** Disable `plainTextHandler` and `imageHandler` on `el` */
    disableHandlers: function(doc: Document): void {
        doc.body.removeEventListener("paste", pasteEventHandler);
    },

    /** Set a function to be called with the pasted text as string */
    setPlainTextHandler: function(fun: (text: string) => any) {
        plainTextHandler = fun;
    },

    /** Set a function to be called with the pasted image as dataUrl string */
    setImageHandler: function(fun: (dataUrl: string) => any) {
        imageHandler = fun;
    },
}

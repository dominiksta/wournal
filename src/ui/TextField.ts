import { WournalPage } from "./WournalPage";

export class TextField {

    /** The outermost element of the text field */
    private display: HTMLDivElement;
    /** A wrapping label */
    private label: HTMLLabelElement;
    /** The actual text area containing the user input */
    private textarea: HTMLTextAreaElement;

    /** See `styleText` */
    private style: HTMLStyleElement;
    /**
     * This will be filled into the innerHTML of a dynamically generated <style>
     * tag
     * NOTE(dominiksta): This is rather hacky, but I see no cleaner way of doing
     * this without a framework, because pseudo elements can not be styled from
     * javascript in any other way.
     */
    private styleText = `
.wournal-text-field-label::after, .wournal-text-field-text {
    width: auto;
    font-family: inherit;
    /* min-width: 1em; */
    grid-area: 1 / 2;
    padding: 0.1em;
    margin: 0;
    resize: none;
    background: none;
    appearance: none;
    border: none;
    overflow: hidden;
}

.wournal-text-field-label::after {
    content: attr(data-value) ' ';
    visibility: hidden;
    white-space: pre-wrap;
}

.wournal-text-field-label::focus-within {
    textarea:focus { outline: none; }
}
`;

    constructor(
        page: WournalPage,
        private _pos: {x: number, y: number},
        spellcheck: boolean = false
    ) {
        this.display = page.toolLayer.ownerDocument.createElement("div");
        this.display.setAttribute("class", "wournal-text-field-wrapper");
        this.display.style.position = "absolute";

        this.label = page.toolLayer.ownerDocument.createElement("label");
        this.label.setAttribute("class", "wournal-text-field-label");
        this.label.style.display = "inline-grid";
        this.label.style.border = "1px solid blue";
        this.label.style.borderRadius = "2px";
        this.label.style.padding = "0px";
        this.label.style.margin = "0px";
        this.display.appendChild(this.label);

        this.textarea = page.toolLayer.ownerDocument.createElement("textarea");
        this.textarea.setAttribute("class", "wournal-text-field-text");
        this.textarea.setAttribute("spellcheck", `${spellcheck}`);
        this.textarea.cols = 1;
        this.textarea.rows = 1;
        this.textarea.addEventListener("input", (e: Event) => {
            let el = e.target as HTMLInputElement;
            let parent = el.parentNode as HTMLLabelElement;
            parent.dataset.value = el.value;
        })
        this.label.appendChild(this.textarea);

        this.style = page.toolLayer.ownerDocument.createElement("style");
        this.style.innerHTML = this.styleText;
        this.display.appendChild(this.style);

        this.setPos(_pos);

        page.toolLayerWrapper.appendChild(this.display);
    }

    public get pos() { return this._pos; }

    public setText(text: string) { this.textarea.value = text; }
    public getText(): string { return this.textarea.value; }

    public focus(): void {
        requestAnimationFrame(() => {
            this.textarea.focus();
        })
    }

    public setPos(pos: {x: number, y: number}) {
        this.display.style.top = `${pos.y}px`;
        this.display.style.left = `${pos.x}px`;
    }

    public addFocusOutListener(fun: (e: FocusEvent) => any) {
        this.textarea.addEventListener("focusout", fun);
    }

    public destroy() {
        this.display.parentElement.removeChild(this.display);
    }
}

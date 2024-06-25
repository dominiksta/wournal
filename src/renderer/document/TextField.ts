import { ShortcutManager } from "app/shortcuts";
import { theme } from "global-styles";
import { CanvasText } from "./CanvasText";
import { WournalPage } from "./WournalPage";

/** The offset from the svg text element to the ui text element */
const DIFF_SVG_VS_UI = {
  x: -3,
  y: 1,
};

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
    font: inherit;
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
    private page: WournalPage,
    private _pos: { x: number, y: number },
    fontSize: number,
    fontStyle: "normal" | "italic",
    fontWeight: "normal" | "bold",
    fontFamily: string,
    fontColor: string = "black",
    spellcheck: boolean = false
  ) {
    this.display = page.toolLayer.ownerDocument.createElement("div");
    this.display.setAttribute("class", "wournal-text-field-wrapper");
    this.display.style.position = "absolute";

    this.label = page.toolLayer.ownerDocument.createElement("label");
    this.label.setAttribute("class", "wournal-text-field-label");
    this.label.style.fontFamily = fontFamily;
    this.label.style.fontWeight = fontWeight;
    this.label.style.fontStyle = fontStyle;
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
    this.textarea.style.color = fontColor;
    // this.textarea.style.filter = theme.invert;
    this.textarea.addEventListener("blur", this.onBlur.bind(this));
    this.textarea.addEventListener("keyup", this.onKeyUp.bind(this));
    this.textarea.addEventListener("input", this.updateSize.bind(this));
    this.textarea.addEventListener("paste", this.onPaste.bind(this));
    this.textarea.addEventListener("mouseup", e => e.stopPropagation());
    this.textarea.addEventListener("mousedown", e => e.stopPropagation());
    this.label.appendChild(this.textarea);

    this.style = page.toolLayer.ownerDocument.createElement("style");
    this.style.innerHTML = this.styleText;
    this.display.appendChild(this.style);

    this.setPos(_pos);
    this.setFontSize(fontSize);

    page.toolLayerWrapper.appendChild(this.display);
  }

  private onKeyUp(e: KeyboardEvent) {
    if (
      e.key === 'Escape' && !e.ctrlKey
      && !e.altKey && !e.shiftKey
    ) {
      this.onBlur();
    }
    e.stopPropagation();
  }

  private onBlur() {
    this.textarea.blur();
    // LOG.debug('focus shortcuts: blur textfield')
    this.page.doc.shortcuts.focus();
  }

  private onPaste(e: Event) {
    e.stopPropagation(); // don't trigger any global paste events
  }

  private updateSize() {
    this.label.dataset.value = this.textarea.value;
  }

  public static fromCanvasText(
    page: WournalPage, canvasTxt: CanvasText,
  ) {
    const canvasPos = canvasTxt.getPos();
    return new TextField(
      page, {
      x: canvasPos.x + DIFF_SVG_VS_UI.x,
      y: canvasPos.y + DIFF_SVG_VS_UI.y
    }, canvasTxt.getFontSize(), canvasTxt.getFontStyle(),
      canvasTxt.getFontWeight(), canvasTxt.getFontFamily(),
      canvasTxt.getColor()
    );
  }

  public get pos() { return this._pos; }

  public setText(text: string) {
    this.textarea.value = text;
    this.updateSize();
  }
  public getText(): string { return this.textarea.value; }

  public focus(): void {
    requestAnimationFrame(() => {
      // LOG.debug('focus textfield');
      this.textarea.focus();
    })
  }

  public setFontSize(size: number) {
    this.label.style.fontSize = size.toString() + "px";
    this.label.style.lineHeight =
      CanvasText.lineHeightForFontSize(size).toString() + "px";
  }

  public setPos(pos: { x: number, y: number }) {
    this.display.style.top = `${pos.y}px`;
    this.display.style.left = `${pos.x}px`;
  }

  public getPos(): { x: number, y: number } {
    return {
      x: parseFloat(this.display.style.left),
      y: parseFloat(this.display.style.top),
    }
  }

  public addFocusOutListener(fun: (e: FocusEvent) => any) {
    this.textarea.addEventListener("blur", fun);
  }

  public destroy() {
    this.display.parentElement.removeChild(this.display);
  }
}

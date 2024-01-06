import { SVGUtils } from "../util/SVGUtils";
import { CanvasText, CanvasTextData } from "./CanvasText";
import { CanvasTool } from "./CanvasTool";
import { TextField } from "./TextField";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { WournalPage } from "./WournalPage";

export class CanvasToolText extends CanvasTool {
  private get conf() {
    return this.activePage.value.doc.toolConfig.value.CanvasToolText;
  };

  public idleCursor = "text";
  protected toolUseStartPage: WournalPage;

  private state: "idle" | "writing" = "idle";

  public override canSetStrokeWidth = false;
  public override canSetColor = true;

  public onDeselect(): void { }
  public onMouseMove(e: MouseEvent): void { }
  public onMouseUp(e: MouseEvent): void { }

  public onMouseDown(e: MouseEvent): void {
    this.toolUseStartPage = this.activePage.value;
    if (this.toolUseStartPage === null) return;

    const mouse = this.toolUseStartPage.globalCoordsToCanvas(e)

    const editUnderCursosOrNew = () => {
      let underCursor: SVGTextElement;
      for (let node of this.toolUseStartPage.activePaintLayer.children) {
        // ignore non-text elements
        if (!(node instanceof SVGTextElement)) continue;
        if (SVGUtils.pointInRect(e, node.getBoundingClientRect())) {
          underCursor = node;
          break; // don't open multiple text fields at once
        }
      }

      if (underCursor !== undefined) {
        this.editTextField(underCursor);
      } else {
        this.newTextField(mouse);
      }
    }

    switch (this.state) {
      case "idle":
        editUnderCursosOrNew();
        break;
      case "writing":
        editUnderCursosOrNew();
        // waiting for the next frame is necessary here because we
        // are setting this.state in the unfocus listener for the
        // previous text field
        requestAnimationFrame(() => {
          this.state = "writing";
        })
        return;
    }
  }

  /** Edit the existing svg text element in `node` */
  private editTextField(node: SVGTextElement) {
    const canvasTxt = new CanvasText(node);
    const txt = TextField.fromCanvasText(this.toolUseStartPage, canvasTxt);
    canvasTxt.hide(true);
    txt.setText(canvasTxt.getText());
    this.activePage.value.doc.shortcuts.focus();
    txt.focus();
    this.registerTextFieldUnfocus(txt, canvasTxt);
  }

  /** create a new text field at position `pos` */
  private newTextField(pos: { x: number, y: number }) {
    // The cursor size should be 32x32 in most situations. Ideally, we could
    // get the current cursor size and set the offset based on that. It
    // seems that this information is not available from js though.
    const svg_pos = {
      x: pos.x - 2,
      y: pos.y - 12
    };

    const c = this.conf;
    let canvasText = CanvasText.fromData(
      this.toolUseStartPage.toolLayer.ownerDocument,
      {
        name: 'Text',
        text: "", pos: { x: svg_pos.x, y: svg_pos.y },
        fontSize: c.fontSize, fontStyle: c.fontStyle,
        fontWeight: c.fontWeight, fontFamily: c.fontFamily,
        color: c.color
      },
    );
    this.toolUseStartPage.activePaintLayer.appendChild(
      canvasText.svgElem
    );

    const txt = TextField.fromCanvasText(this.toolUseStartPage, canvasText);
    this.activePage.value.doc.shortcuts.focus();
    txt.focus();

    this.registerTextFieldUnfocus(txt, canvasText);
  }

  /** register the unfocus handler for `txt` */
  private registerTextFieldUnfocus(
    txt: TextField, canvasText: CanvasText
  ) {
    this.state = "writing";
    const prevText = canvasText.getText();

    txt.addFocusOutListener((e) => {
      canvasText.hide(false);
      if (txt.getText() !== "") {
        canvasText.setText(txt.getText());

        if (prevText !== txt.getText()) {
          if (prevText !== "") { // editing
            let dataBefore = canvasText.serialize();
            dataBefore.text = prevText;
            this.undoStack.push(
              new UndoActionCanvasElements(
                null, [{
                  el: canvasText.svgElem,
                  dataAfter: canvasText.serialize(),
                  dataBefore: dataBefore
                }], null
              )
            )
          } else { // new text
            this.undoStack.push(new UndoActionCanvasElements(
              null, null, [canvasText.svgElem]
            ));
          }
        }
      } else {
        if (prevText !== "")
          this.undoStack.push(new UndoActionCanvasElements(
            [canvasText.svgElem], null, null,
          ));
        canvasText.destroy();
      }
      txt.destroy();
      this.state = "idle";
    });
  }

}

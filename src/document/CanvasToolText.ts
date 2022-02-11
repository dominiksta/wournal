import { SVGUtils } from "../util/SVGUtils";
import { CanvasText, CanvasTextData } from "./CanvasText";
import { CanvasTool } from "./CanvasTool";
import { TextField } from "./TextField";
import { UndoActionCanvasElements } from "./UndoActionCanvasElements";
import { WournalPage } from "./WournalPage";

/** The offset from the svg text element to the ui text element */
const diff_svg_vs_ui = {
    x: -3,
    y: 1,
};

export class CanvasToolText extends CanvasTool {

    public idleCursor = "text";
    protected toolUseStartPage: WournalPage;

    private state: "idle" | "writing" = "idle";

    constructor(
        private fontSize: number = 17,
        private fontFamily: string = "sans-serif",
        private color: string = "#000000",
    ) { super(); }

    public onDeselect(): void { }
    public onMouseMove(e: MouseEvent): void { }
    public onMouseUp(e: MouseEvent): void { }

    public onMouseDown(e: MouseEvent): void {
        this.toolUseStartPage = this.getActivePage();
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

        switch(this.state) {
            case "idle":
                editUnderCursosOrNew();
                break;
            case "writing":
                if (!(e.target instanceof HTMLTextAreaElement)) {
                    editUnderCursosOrNew();
                    // waiting for the next frame is necessary here because we
                    // are setting this.state in the unfocus listener for the
                    // previous text field
                    requestAnimationFrame(() => {
                        this.state = "writing";
                    })
                }
                return;
        }
    }

    /** Edit the existing svg text element in `node` */
    private editTextField(node: SVGTextElement) {
        let canvasTxt = new CanvasText(node);
        let txt = TextField.fromCanvasText(
            this.toolUseStartPage, canvasTxt, diff_svg_vs_ui
        );
        canvasTxt.hide(true);
        txt.setText(canvasTxt.getText());
        txt.focus();
        this.registerTextFieldUnfocus(txt, canvasTxt);
    }

    /** create a new text field at position `pos` */
    private newTextField(pos: {x: number, y: number}) {
        // The cursor size should be 32x32 in most situations. Ideally, we could
        // get the current cursor size and set the offset based on that. It
        // seems that this information is not available from js though.
        const svg_pos = {
            x: pos.x - 2,
            y: pos.y - 12
        };

        let canvasText = CanvasText.fromData(
            this.toolUseStartPage.toolLayer.ownerDocument,
            new CanvasTextData(
                "", {
                    x: svg_pos.x,
                    y: svg_pos.y
                },
                this.fontSize, this.fontFamily, this.color
            ),
        );
        this.toolUseStartPage.activePaintLayer.appendChild(
            canvasText.svgElem
        );

        let txt = TextField.fromCanvasText(
            this.toolUseStartPage, canvasText, diff_svg_vs_ui
        );
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
                        let dataBefore = canvasText.getData();
                        dataBefore.text = prevText;
                        this.undoStack.push(
                            new UndoActionCanvasElements(
                                null, [{
                                    el: canvasText.svgElem,
                                    dataAfter: canvasText.getData(),
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

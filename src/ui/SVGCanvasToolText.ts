import { SVGUtils } from "../util/SVGUtils";
import { SVGCanvasText } from "./SVGCanvasText";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { TextField } from "./TextField";
import { WournalPage } from "./WournalPage";

/** The offset from the svg text element to the ui text element */
const diff_svg_vs_ui = {
    x: -3,
    y: 1,
};

export class SVGCanvasToolText extends SVGCanvasTool {

    public idleCursor = "text";
    protected toolUseStartPage: WournalPage;

    private state: "idle" | "writing" = "idle";

    constructor(
        private fontSize: number = 17
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
        let canvasTxt = new SVGCanvasText(node);
        const pos = canvasTxt.getPos();
        let txt = TextField.fromCanvasText(
            this.toolUseStartPage, canvasTxt, diff_svg_vs_ui
        );
        canvasTxt.destroy();
        txt.setText(canvasTxt.getText());
        txt.focus();
        this.registerTextFieldUnfocus(txt);
    }

    /** create a new text field at position `pos` */
    private newTextField(pos: {x: number, y: number}) {
        // The cursor size should be 32x32 in most situations. Ideally, we could
        // get the current cursor size and set the offset based on that. It
        // seems that this information is not available from js though.
        const ui_pos = {
            x: pos.x - 2,
            y: pos.y - 12
        };

        let txt = new TextField(
            this.toolUseStartPage, ui_pos, this.fontSize, "sans-serif"
        );
        txt.focus();

        this.registerTextFieldUnfocus(txt);
    }

    /** register the unfocus handler for `txt` */
    private registerTextFieldUnfocus(txt: TextField) {
        this.state = "writing";
        const pos = txt.getPos();
        txt.addFocusOutListener((e) => {
            if (txt.getText() !== "") {
                let textField = SVGCanvasText.fromText(
                    this.toolUseStartPage.toolLayer.ownerDocument,
                    txt.getText(), {
                        x: pos.x - diff_svg_vs_ui.x,
                        y: pos.y - diff_svg_vs_ui.y
                    },
                    this.fontSize
                );
                this.toolUseStartPage.activePaintLayer.appendChild(
                    textField.svgText
                );
            }
            txt.destroy();
            this.state = "idle";
        });
    }

}

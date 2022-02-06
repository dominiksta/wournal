import { LOG } from "../util/Logging";
import { SVGCanvasTool } from "./SVGCanvasTool";
import { TextField } from "./TextField";
import { WournalPage } from "./WournalPage";

export class SVGCanvasToolText extends SVGCanvasTool {

    public idleCursor = "text";
    protected toolUseStartPage: WournalPage;

    public onDeselect(): void {

    }
    public onMouseDown(e: MouseEvent): void {
        this.toolUseStartPage = this.getActivePage();
        if (this.toolUseStartPage === null) return;

        const mouse = this.toolUseStartPage.globalCoordsToCanvas(e);

        // The cursor size should be 32x32 in most situations. Ideally, we could
        // get the current cursor size and set the offset based on that. It
        // seems that this information is not available from js though.
        let txt = new TextField(this.toolUseStartPage, {
            x: mouse.x - 2,
            y: mouse.y - 12
        });
        txt.focus();
        txt.addFocusOutListener((e) => {
            LOG.debug(`Text: ${txt.getText()}`)
            txt.destroy();
        });
    }
    public onMouseMove(e: MouseEvent): void {

    }
    public onMouseUp(e: MouseEvent): void {

    }
}

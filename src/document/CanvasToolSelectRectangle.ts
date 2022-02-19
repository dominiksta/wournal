import { LOG } from "../util/Logging";
import { CanvasTool } from "./CanvasTool";
import { WournalPage } from "./WournalPage";

export class CanvasToolSelectRectangle extends CanvasTool {
    public idleCursor = "default";
    protected toolUseStartPage: WournalPage;

    private state: "idle" | "selecting" = "idle";

    /** Stores some mouse canvas coordinates needed for calculations */
    private savedMouse: {
        beforeSelect: {x: number, y: number},
        beforeMove: {x: number, y: number}
    } = {
        beforeSelect: null, beforeMove: null
    }

    public onMouseDown(e: MouseEvent): void {
        if (this.getActivePage() === null) {
            this.selection?.clear();
            this.state = "idle";
            return;
        }
        const mouse = this.getActivePage().globalCoordsToCanvas({x: e.x, y: e.y});
        switch(this.state) {
            case "idle":
                this.toolUseStartPage = this.getActivePage();
                this.state = "selecting";
                this.savedMouse.beforeSelect = {x: mouse.x, y: mouse.y}
                this.selection.init(this.toolUseStartPage);
                this.toolUseStartPage.toolLayer.style.cursor = "crosshair";
                break;
            case "selecting":
                LOG.error("onMouseDown called in selecting state - " +
                    "state set incorrectly?")
                break;
        }
    }

    public onMouseUp(e: MouseEvent): void {
        if (this.getActivePage() === null) return;
        this.getActivePage().toolLayer.style.cursor = this.idleCursor;
        switch(this.state) {
            case "idle":
                break;
            case "selecting":
                this.selection.setSelectionFromCurrentRect();
                let selElems = this.selection.selection;

                if (selElems.length === 0) this.selection.clear();
                this.state = "idle";
                break;
        }
    }

    public onMouseMove(e: MouseEvent): void {
        if (this.state === "idle") return;
        if (this.getActivePage() === null) return;

        const mouse = this.toolUseStartPage.globalCoordsToCanvas({x: e.x, y: e.y});

        switch(this.state) {
            case "selecting":
                let s = DOMRect.fromRect({
                    x: Math.min(mouse.x, this.savedMouse.beforeSelect.x),
                    y: Math.min(mouse.y, this.savedMouse.beforeSelect.y),
                    width: Math.abs(mouse.x - this.savedMouse.beforeSelect.x),
                    height: Math.abs(mouse.y - this.savedMouse.beforeSelect.y),
                });
                this.selection.setDimension(s);
                break;
        }
    }

    onDeselect(): void {
        if (this.selection)
            this.selection.clear();
    }
}
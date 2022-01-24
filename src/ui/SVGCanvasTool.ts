import { WournalPage } from "./WournalPage";

export abstract class SVGCanvasTool {

    protected abstract cursor: string;

    constructor(
        protected page: WournalPage
    ) {}

    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
}

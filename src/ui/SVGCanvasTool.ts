import { WournalPage } from "./WournalPage";

export abstract class SVGCanvasTool {

    public abstract idleCursor: string;
    protected abstract toolUseStartPage: WournalPage;

    constructor(
        protected getActivePage: () => WournalPage
    ) {}

    abstract onMouseDown(e: MouseEvent): void;
    abstract onMouseMove(e: MouseEvent): void;
    abstract onMouseUp(e: MouseEvent): void;
}

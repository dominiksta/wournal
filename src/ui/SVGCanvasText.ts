import { LOG } from "../util/Logging";
import { WournalCanvasElement, WournalCanvasElementData } from "./WournalCanvasElement";

export class SVGCanvasText extends WournalCanvasElement {

    /** in px */
    private _lineHeight: number;
    /** in px */
    private _fontSize: number;

    constructor(
        /** The actual underlying svg path */
        protected _svgElem: SVGTextElement
    ) {
        super(_svgElem);
        this._fontSize = parseFloat(_svgElem.getAttribute("font-size"));
        this._lineHeight = _svgElem.children.length > 0
            ? parseFloat(_svgElem.children[0].getAttribute("dy"))
            : 15;
    }

    public static fromData(
        doc: Document, data: SVGCanvasTextData,
    ): SVGCanvasText {
        let ret = new SVGCanvasText(
            doc.createElementNS("http://www.w3.org/2000/svg", "text")
        );
        ret.setData(data);
        return ret;
    }

    public static lineHeightForFontSize(fontSize: number) {
        // according to the internet [citation needed], the default in most
        // browsers and environments is between 110% und 120%
        return fontSize * 1.1;
    }

    public getText(): string {
        let result = "";
        for (let tspan of this._svgElem.children) {
            if (!(tspan instanceof SVGTSpanElement))
                throw new Error("non-tspan element in text field!");

            // see `setText()`
            result += tspan.innerHTML === " "
                ? "\n"
                : tspan.innerHTML + "\n";
        }
        return result.slice(0, -1);
    }

    public setText(text: string) {
        this._svgElem.innerHTML = "";
        for (let line of text.split("\n")) {
            let tspan = this._svgElem.ownerDocument.createElementNS(
                "http://www.w3.org/2000/svg", "tspan"
            );
            // A tspan without any content will not be rendered, so we just
            // insert some whitespace into blank lines here. It would be
            // possible to play around with variable dy attributes, but for now
            // this is good enough.
            tspan.innerHTML = line !== "" ? line : " ";
            this._svgElem.appendChild(tspan);
        }
        this.setLineHeight(this._lineHeight);
        this.writeTransform();
    }

    public override setColor(color: string): void {
        this._svgElem.setAttribute("fill", color);
    }

    public getColor(): string {
        return this._svgElem.getAttribute("fill");
    }

    public override destroy() {
        this._svgElem.parentNode.removeChild(this._svgElem);
    }

    public override getData(): SVGCanvasTextData {
        return new SVGCanvasTextData(
            this.getText(), this.getPos(), this.getFontSize(),
            this.getFontFamily(), this.getColor()
        );
    }

    public override setData(dto: SVGCanvasTextData) {
        this.setPos(dto.pos);
        this.setText(dto.text);
        this.setFontFamily(dto.fontFamily);
        this.setFontSize(dto.fontSize);
        this.setColor(dto.color);
    }

    public setFontFamily(fontFamily: string) {
        this._svgElem.setAttribute("font-family", fontFamily);
    }

    public getFontFamily(): string {
        return this._svgElem.getAttribute("font-family");
    }

    public setFontSize(size: number) {
        this._fontSize = size;
        this.setLineHeight(SVGCanvasText.lineHeightForFontSize(size));
        this._svgElem.setAttribute("font-size", size.toString());
    }

    public getFontSize(): number {
        return this._fontSize;
    }

    public setLineHeight(lineHeight: number) {
        this._lineHeight = lineHeight;
        for (let el of this._svgElem.children) {
            if (!(el instanceof SVGTSpanElement))
                throw new Error("non-tspan element in text field!");
            el.setAttribute("dy", lineHeight.toString());
        }
    }

    public override writeTransform(): void {
        const curr = this.getPos();
        const t = this.currentTransform;
        this.setFontSize(this._fontSize * t.scaleX * t.scaleY);

        const newT = {
            x: (curr.x * t.scaleX) + t.translateX,
            y: (curr.y * t.scaleY) + t.translateY,
        }
        this.setPos(newT);
        this.resetTransform();
    }

    public getPos(): {x: number, y: number} {
        return {
            x: parseFloat(this._svgElem.getAttribute("x")),
            y: parseFloat(this._svgElem.getAttribute("y"))
        };
    }

    public setPos(pos: {x: number, y: number}) {
        this._svgElem.setAttribute("x", pos.x.toString());
        this._svgElem.setAttribute("y", pos.y.toString());

        for (let el of this._svgElem.children) {
            if (!(el instanceof SVGTSpanElement))
                throw new Error("non-tspan element in text field!");
            el.setAttribute("x", pos.x.toString());
        }
    }

    public hide(hide: boolean) {
        this._svgElem.style.display = hide ? "none" : "";
    }
}

export class SVGCanvasTextData extends WournalCanvasElementData {
    constructor(
        public text: string,
        public pos: {x: number, y: number},
        public fontSize: number,
        public fontFamily: string,
        public color: string,
    ) { super(); }
}
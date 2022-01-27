import { LOG } from "../util/Logging";
import { WournalCanvasElement } from "./WournalCanvasElement";

/**
 * This is a _less_ powerful version of a full SVGPathElement which abstracts
 * away the actual path data into a handful of methods.
 *
 * In order to be able to implement a pixel based eraser that can split lines
 * effectively, it was decided to limit svg path commands to just "M" (starting
 * point), "L" (draw line to give position) and "Z" (to smoothly close forms
 * like rectangles).
 */
export class SVGCanvasPath extends WournalCanvasElement {

    /** Stores the actual svg stroke data to draw */
    private stroke: string;
    /** The temporary tip stroke. See `setTipStroke`*/
    private tipStroke: string;

    get svgPath() { return this._svgElem };

    constructor(
        /** The actual underlying svg path */
        protected _svgElem: SVGPathElement
    ) {
        super(_svgElem);
        // Filling will have to be implemented by drawing thick paths
        // instead. This is again with a pixel based eraser in mind.
        this._svgElem.setAttribute("fill", "none");
    }

    /** Create a new SVGCanvasPath in the given doc and return it */
    public static fromNewPath(doc: Document): SVGCanvasPath {
        let ret = new SVGCanvasPath(
            doc.createElementNS('http://www.w3.org/2000/svg', 'path')
        );
        ret.setColor("#000000");
        ret.setStrokeWidth(2);
        return ret;
    }

    private render() {
        this._svgElem.setAttribute("d", this.stroke + this.tipStroke);
    }

    /** Clear the entire stroke */
    public clear(): void {
        this.stroke = "";
        this.tipStroke = "";
        this.render();
    }

    /** Start the stroke at given position */
    public startAt(pt: {x: number, y: number}): void {
        this.stroke = `M${pt.x} ${pt.y}`;
        this.tipStroke = "";
        this.render();
    }

    /** Add a line from current last position to given position */
    public addLineToPoint(pt: {x: number, y: number}): void {
        this.stroke += ` L${pt.x} ${pt.y}`;
        this.render();
    }

    public close(): void {
        this.stroke += " Z";
        this.render();
    }

    /**
     * With the current algorithm for smoothing lines, it is necessary to draw
     * an unsmoothed bit of the stroke at the tip aka the mouse. Otherwise, the
     * stroke would visibly lag behind the mouse when drawing.
     *
     * NOTE(dominiksta): This is an implementation detail that I am not entirely
     * happy about including here (since it is so specific to the pen tool), but
     * I see no other option right now.
     */
    public setTipStroke(pts: {x: number, y: number}[]): void {
        this.tipStroke = "";
        for(let pt of pts)
            this.tipStroke += ` L${pt.x} ${pt.y}`;
        this.render();
    }

    public setColor(color: string): void {
        this._svgElem.setAttribute("stroke", color);
    }

    public setStrokeWidth(width: number): void {
        this._svgElem.setAttribute("stroke-width", width.toString());
    }

    public override writeTransform() {
        let pathData = SVGCanvasPath.parseSvgPathData(
            this._svgElem.getAttribute("d"));
        const t = this.currentTransform;
        for(let el of pathData) {
            // scaling *has* to come first here
            el.x *= t.scaleX; el.y *= t.scaleY;
            el.x += t.translateX; el.y += t.translateY;
        }
        this._svgElem.setAttribute(
            "d", SVGCanvasPath.svgPathDataToString(pathData)
        );

        this.setStrokeWidth(
            parseFloat(this._svgElem.getAttribute("stroke-width")) *
                t.scaleX * t.scaleY
        )
        this.resetTransform();
    }

    /**
     * Take an svg path like those from from `parseSvgPathData` and turn it back
     * into a string that can be set as the 'd' attribute of an svg path.
     */
    private static svgPathDataToString(
        pathData: {t: string, x: number, y: number}[]
    ): string {
        let res = "";
        for (let el of pathData) {
            if (el.x && el.y)
                res += `${el.t} ${el.x} ${el.y}`;
            else
                res += `${el.t}`; // for Z
        }
        return res;
    }

    /**
     * Parse an svg path data string into a more digestible data structure.
     */
    public static parseSvgPathData(
        path: string
    ): {t: string, x: number, y: number}[] {
        if (!path.startsWith("M"))
            throw new Error(`Could not parse path: ${path}`)

        let result: {t: string, x: number, y: number}[] = [];

        // NOTE(dominiksta): This could have been written (much) more concisely
        // *at the expense of speed*. I decided to implement it like this so
        // that we would only have to loop through the string once.

        let currX: number; // hold currently parsed X
        let currY: number; // hold currently parsed Y
        let currT: string; // hold current type (T)
        let i = 0; // position in path string
        let count = 0; // only used for error heuristics

        while(i !== path.length) {
            count++;
            if (count > 5000)
                throw new Error(
                    `parsing point with more then 5000 points, assuming error`
                )

            currT = path[i];
            // LOG.debug(`i: ${i}`);
            if (path[i] === "M" || path[i] === "L") {
                // skip initial spaces after letter
                while(path[i+1] === " ") i++;

                // --- X ---
                let jx = i+1;
                while(path[jx] !== " ") jx++;
                // LOG.debug(`i: ${i}, jx: ${jx}`)
                currX = parseFloat(path.substring(i + 1, jx));

                // --- Y ---
                let jy = jx + 1;
                while(
                    path[jy] !== "M" && path[jy] !== "L" && path[jy] !== "Z"
                    && jy !== path.length
                ) jy++;
                // LOG.debug(`jx: ${jx}, jy: ${jy}`)
                currY = parseFloat(path.substring(jx + 1, jy));

                // check wether any parseFloat has failed
                if (isNaN(currX) || isNaN(currY))
                    throw new Error(`Could not parse path: ${path}`)

                i = jy;
                result.push({t: currT, x: currX, y: currY});
                // LOG.debug(result);
            } else if (path[i] === "Z") {
                result.push({t: "Z", x: null, y: null});
                i++;
            } else {
                throw new Error(`Could not parse path: ${path}`)
            }
        }

        return result;
    }
}

/**
 * This is a _less_ powerful version of a full SVGPathElement which abstracts
 * away the actual path data into a handful of methods.
 *
 * In order to be able to implement a pixel based eraser that can split lines
 * effectively, it was decided to limit svg path commands to just "M" (starting
 * point) and "L" (draw line to give position).
 */
export class SVGCanvasPath {

    /** Stores the actual svg stroke data to draw */
    private stroke: string;
    /** The temporary tip stroke. See `setTipStroke`*/
    private tipStroke: string;

    get svgPath() { return this._svgPath };

    constructor(
        /** The actual underlying svg path */
        private _svgPath: SVGPathElement,
        color: string = "#000000",
        width: number = 2,
    ) {
        // Filling will have to be implemented by drawing thick paths
        // instead. This is again with a pixel based eraser in mind.
        this._svgPath.setAttribute("fill", "none");

        this.setColor(color);
        this.setStrokeWidth(width);
    }

    /** Create a new SVGCanvasPath in the given doc and return it */
    public static fromNewPath(doc: Document): SVGCanvasPath {
        return new SVGCanvasPath(
            doc.createElementNS('http://www.w3.org/2000/svg', 'path')
        );
    }

    private render() {
        this._svgPath.setAttribute("d", this.stroke + this.tipStroke);
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

    /**
     * Color can be in multiple formats, including hex with a prefixed # ("HTML
     * Style Colors").
     */
    public setColor(color: string): void {
        this._svgPath.setAttribute("stroke", color);
    }

    public setStrokeWidth(width: number): void {
        this._svgPath.setAttribute("stroke-width", width.toString());
    }

}

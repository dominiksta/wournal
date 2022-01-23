class SVGCanvas {

    /** The Canvas Element that will be drawn on */
    _svgElement = null;
    /** The bounding rectangle of `_svgElement` */
    _rect = null;

    /** The width of a stroke */
    _strokeWidth = 2;
    /** Buffer size for line smoothing */
    mouseBufferSize = 4;
    /** Buffer for smoothing. Contains the last positions of the mouse cursor */
    _mouseBuffer = [];

    /** The svg path for the current line */
    _path = null;
    /** The stroke path for the current line */
    _pathStroke = "";

    constructor(svgElement) {
        this._svgElement = svgElement;
        this._rect = svgElement.getBoundingClientRect();

        this._svgElement.addEventListener("mousedown", this._onMouseDown.bind(this));
        this._svgElement.addEventListener("mousemove", this._onMouseMove.bind(this));
        this._svgElement.addEventListener("mouseup", this._onMouseUp.bind(this));
    }

    _onMouseDown(e) {
        this._path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._path.setAttribute("fill", "none");
        this._path.setAttribute("stroke", "#000");
        this._path.setAttribute("stroke-width", this._strokeWidth);
        this._mouseBuffer = [];
        var pt = this._getMousePosition(e);
        this._appendToBuffer(pt);
        this._pathStroke = "M" + pt.x + " " + pt.y;
        this._path.setAttribute("d", this._pathStroke);
        this._svgElement.appendChild(this._path);
    }

    _onMouseMove(e) {
        console.log("onMouseMove");
        if (this._path) {
            this._appendToBuffer(this._getMousePosition(e));
            this._updateSvgPath();
        }
    }

    _onMouseUp(e) {
        console.log("onMouseUp");
        if (this._path) this._path = null;
    }

    _getMousePosition(e) {
        return {
            x: e.pageX - this._rect.left,
            y: e.pageY - this._rect.top
        };
    }

    _appendToBuffer(pt) {
        this._mouseBuffer.push(pt);
        while (this._mouseBuffer.length > this.mouseBufferSize) {
            this._mouseBuffer.shift();
        }
    }

    /** Calculate the average point, starting at offset in the buffer */
    _getAveragePoint(offset) {
        var len = this._mouseBuffer.length;
        if (len % 2 === 1 || len >= this.mouseBufferSize) {
            var totalX = 0;
            var totalY = 0;
            var pt, i;
            var count = 0;
            for (i = offset; i < len; i++) {
                count++;
                pt = this._mouseBuffer[i];
                totalX += pt.x;
                totalY += pt.y;
            }
            return {
                x: totalX / count,
                y: totalY / count
            };
        }
        return null;
    }

    _updateSvgPath() {
        var pt = this._getAveragePoint(0);

        if (pt) {
            // Get the smoothed part of the path that will not change
            this._pathStroke += " L" + pt.x + " " + pt.y;

            // Get the last part of the path (close to the current mouse position)
            // This part will change if the mouse moves again
            var tmpPath = "";
            for (var offset = 2; offset < this._mouseBuffer.length; offset += 2) {
                pt = this._getAveragePoint(offset);
                tmpPath += " L" + pt.x + " " + pt.y;
            }

            // Set the complete current path coordinates
            this._path.setAttribute("d", this._pathStroke + tmpPath);
        }
    }

}

class SVGCanvasFactory {

    // static DEFAULT_CANVAS_HEIGHT = "400px";
    // static DEFAULT_CANVAS_WIDTH = "600px";

    static newDefault() {
        let canvas = new SVGCanvas(document.getElementById("svgElement"));
        canvas.mouseBufferSize = document.getElementById("cmbBufferSize").value;
        console.log(canvas.mouseBufferSize);
        return canvas;
    }
}

window.myCanvas = SVGCanvasFactory.newDefault();
import { SVGCanvasFactory } from "./ui/SVGCanvasFactory";
import { CONF } from "./util/Config";

// create canvases
// ----------------------------------------------------------------------

let myCanvas1 = SVGCanvasFactory.create(document, "600px", "400px");
let myCanvas2 = SVGCanvasFactory.create(document, "600px", "400px");

let doc = document.getElementById("wournal-document");

doc.insertBefore(myCanvas1.svgElement, doc.firstChild);
doc.insertBefore(myCanvas2.svgElement, doc.firstChild);

(<any>window).myCanvas1 = myCanvas1;
(<any>window).myCanvas2 = myCanvas2;

// register update function for smoothing
// ----------------------------------------------------------------------

let select = document.getElementById("cmbBufferSize") as HTMLSelectElement;
select.addEventListener("change", () => {
    CONF.pen.mouseBufferSize = parseInt(select.value);
})

import { SVGCanvasToolPen } from "./ui/SVGCanvasToolPen";
import { SVGCanvasToolRectangle } from "./ui/SVGCanvasToolRectangle";
import { SVGCanvasToolSelectRectangle } from "./ui/SVGCanvasToolSelectRectangle";
import { WournalDocument } from "./ui/WournalDocument";
import { CONF } from "./util/Config";

// create canvases
// ----------------------------------------------------------------------

let wournalDoc = new WournalDocument(
    document.getElementById("wournal-document") as HTMLDivElement
);

wournalDoc.newPage(600, 400);
wournalDoc.newPage(600, 400);

let doc = document.getElementById("wournal-document");

(<any>window).wournalDoc = wournalDoc;

// register toolbar functions
// ----------------------------------------------------------------------

let select = document.getElementById("cmbBufferSize") as HTMLSelectElement;
select.addEventListener("change", () => {
    CONF.pen.mouseBufferSize = parseInt(select.value);
});

document.getElementById("btnToolPen").addEventListener("click", () => {
    wournalDoc.setTool(SVGCanvasToolPen);
});
document.getElementById("btnToolRectangle").addEventListener("click", () => {
    wournalDoc.setTool(SVGCanvasToolRectangle);
});
document.getElementById("btnToolSelectRectangle").addEventListener("click", () => {
    wournalDoc.setTool(SVGCanvasToolSelectRectangle);
});

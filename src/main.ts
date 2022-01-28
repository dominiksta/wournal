import { SVGCanvasToolEraser } from "./ui/SVGCanvasToolEraser";
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

for(let i = 0; i < 100; i++) {
    wournalDoc.newPage(600, 400);
}

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
document.getElementById("btnToolEraser").addEventListener("click", () => {
    wournalDoc.setTool(SVGCanvasToolEraser);
});
document.getElementById("btnToolRectangle").addEventListener("click", () => {
    wournalDoc.setTool(SVGCanvasToolRectangle);
});
document.getElementById("btnToolSelectRectangle").addEventListener("click", () => {
    wournalDoc.setTool(SVGCanvasToolSelectRectangle);
});

document.addEventListener("keypress", (e: KeyboardEvent) => {
    e = e || window.event as KeyboardEvent;
    if (e.key == "w") wournalDoc.setTool(SVGCanvasToolPen)
    else if (e.key == "s") wournalDoc.setTool(SVGCanvasToolSelectRectangle)
    else if (e.key == "r") wournalDoc.setTool(SVGCanvasToolRectangle)
});

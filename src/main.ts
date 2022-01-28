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
    wournalDoc.setTool(new SVGCanvasToolPen());
});
document.getElementById("btnToolEraser").addEventListener("click", () => {
    wournalDoc.setTool(new SVGCanvasToolEraser());
});
document.getElementById("btnToolRectangle").addEventListener("click", () => {
    wournalDoc.setTool(new SVGCanvasToolRectangle());
});
document.getElementById("btnToolSelectRectangle").addEventListener("click", () => {
    wournalDoc.setTool(new SVGCanvasToolSelectRectangle());
});

document.addEventListener("keypress", (e: KeyboardEvent) => {
    e = e || window.event as KeyboardEvent;
    if (e.key == "w") wournalDoc.setTool(new SVGCanvasToolPen())
    else if (e.key == "s") wournalDoc.setTool(new SVGCanvasToolSelectRectangle())
    else if (e.key == "r") wournalDoc.setTool(new SVGCanvasToolRectangle())
});

import { SVGCanvasToolEraser } from "./ui/SVGCanvasToolEraser";
import { SVGCanvasToolPen } from "./ui/SVGCanvasToolPen";
import { SVGCanvasToolRectangle } from "./ui/SVGCanvasToolRectangle";
import { SVGCanvasToolSelectRectangle } from "./ui/SVGCanvasToolSelectRectangle";
import { WournalDocument } from "./ui/WournalDocument";
import { WournalPageSize } from "./ui/WournalPageSize";
import { CONF } from "./util/Config";

// create canvases
// ----------------------------------------------------------------------

let wournalDoc = new WournalDocument(
    document.getElementById("wournal-document") as HTMLDivElement
);

wournalDoc.newPage(WournalPageSize.DINA4_PORTRAIT);
wournalDoc.newPage(WournalPageSize.DINA4_LANDSCAPE);
wournalDoc.newPage(WournalPageSize.DINA5_PORTRAIT);
wournalDoc.newPage(WournalPageSize.DINA5_LANDSCAPE);

for(let i = 0; i < 100; i++) {
    wournalDoc.newPage();
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
document.getElementById("btnToolPointEraser").addEventListener("click", () => {
    wournalDoc.setTool(new SVGCanvasToolEraser(10, false));
});
document.getElementById("btnToolStrokeEraser").addEventListener("click", () => {
    wournalDoc.setTool(new SVGCanvasToolEraser(10, true));
});
document.getElementById("btnToolRectangle").addEventListener("click", () => {
    wournalDoc.setTool(new SVGCanvasToolRectangle());
});
document.getElementById("btnToolSelectRectangle").addEventListener("click", () => {
    wournalDoc.setTool(new SVGCanvasToolSelectRectangle());
});

document.getElementById("btnToolZoomIncrease").addEventListener("click", () => {
    wournalDoc.setZoom(wournalDoc.getZoom() + 0.1);
});
document.getElementById("btnToolZoomDecrease").addEventListener("click", () => {
    wournalDoc.setZoom(wournalDoc.getZoom() - 0.1);
});

document.addEventListener("keypress", (e: KeyboardEvent) => {
    e = e || window.event as KeyboardEvent;
    if (e.key == "w") wournalDoc.setTool(new SVGCanvasToolPen())
    else if (e.key == "s") wournalDoc.setTool(new SVGCanvasToolSelectRectangle())
    else if (e.key == "r") wournalDoc.setTool(new SVGCanvasToolRectangle())
    else if (e.key == "e") wournalDoc.setTool(new SVGCanvasToolEraser(10, false))
    else if (e.key == "+") wournalDoc.setZoom(wournalDoc.getZoom() + 0.1)
    else if (e.key == "-") wournalDoc.setZoom(wournalDoc.getZoom() - 0.1)
});

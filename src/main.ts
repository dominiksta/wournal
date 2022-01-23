import { SVGCanvasFactory } from "./ui/SVGCanvasFactory";

let myCanvas1 = SVGCanvasFactory.create(document, "600px", "400px");
let myCanvas2 = SVGCanvasFactory.create(document, "600px", "400px");

let doc = document.getElementById("wournal-document");

doc.insertBefore(myCanvas1.svgElement, doc.firstChild);
doc.insertBefore(myCanvas2.svgElement, doc.firstChild);

(<any>window).myCanvas1 = myCanvas1;
(<any>window).myCanvas2 = myCanvas2;

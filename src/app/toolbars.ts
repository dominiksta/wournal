import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { CanvasToolEraser } from "document/CanvasToolEraser";
import { CanvasToolPen } from "document/CanvasToolPen";
import { CanvasToolText } from "document/CanvasToolText";
import { Wournal } from "../document/Wournal";
import { Newable } from "util/Newable";
import { CanvasTool } from "document/CanvasTool";
import Toolbar, { ToolbarSeperator } from "common/toolbar";
import { ToolbarButton } from "common/toolbar";
import { CanvasToolRectangle } from "document/CanvasToolRectangle";
import { CanvasToolSelectRectangle } from "document/CanvasToolSelectRectangle";

@Component.register
export default class Toolbars extends Component {
  props = {
    wournal: rx.prop<Wournal>(),
  }

  static styles = style.sheet({
    '#size-modifier-medium::part(button)': {
      width: '10px',
      background: 'red !important',
    },
    '#size-modifier-medium::part(icon)': {
      width: '10px',
      background: 'red !important',
    },
    '#size-modifier-medium': {
      width: '10px !important',
      background: 'red !important',
    },
  })

  pierceShadow = style.sheet({
    // 'ui5-icon': {
    //   width: '10px',
    // }
  })


  render() {
    const w = this.props.wournal.value;

    const noSelection = w.doc.pipe(
      rx.switchMap(doc => doc === undefined ? rx.of(false) : doc.selectionAvailable),
      rx.startWith(false),
      rx.map(v => !v)
    );

    const currentTool: rx.Stream<CanvasTool> = w.doc.pipe(
      rx.switchMap(
        doc => doc === undefined ? rx.of(new CanvasToolPen()) : doc.currentTool
      ),
    );

    const canvasToolButtonStyle = (tool: Newable<CanvasTool>) =>
      currentTool.map(t => t instanceof tool);

    return [
      h.div({ fields: { className: 'topbar' } }, [

        // upper
        // ----------------------------------------------------------------------
        Toolbar.t({}, [
          ToolbarButton.t({
            props: {
              img: 'icon:menu2', alt: 'Menu',
            },
            events: { click: e => { console.log(e); } }
          }),
          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:save', alt: 'Save',
            },
            events: { click: _ => w.saveDocument() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:document', alt: 'New',
            },
            events: { click: _ => w.loadDocument(true) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:open-folder', alt: 'Load',
            },
            events: { click: _ => w.loadDocument(false) }
          }),
          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:undo', alt: 'Undo',
              disabled: w.doc.pipe(
                rx.switchMap(doc => doc === undefined ? rx.of(false) : doc.undoAvailable),
                rx.map(v => !v),
                rx.startWith(true),
              ),
            },
            events: { click: _ => w.doc.value.undo() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:redo', alt: 'Redo',
              disabled: w.doc.pipe(
                rx.switchMap(doc => doc === undefined ? rx.of(false) : doc.redoAvailable),
                rx.map(v => !v),
                rx.startWith(true),
              ),
            },
            events: { click: _ => w.doc.value.redo() }
          }),
          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:scissors', alt: 'Cut Selection',
              disabled: noSelection,
            },
            events: { click: _ => w.doc.value.selectionCut() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:copy', alt: 'Copy Selection',
              disabled: noSelection,
            },
            events: { click: _ => w.doc.value.selectionCopy() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:paste', alt: 'Paste Selection/Clipboard',
            },
            events: { click: _ => w.doc.value.selectionOrClipboardPaste() }
          }),

          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:zoom-in', alt: 'Zoom In',
            },
            events: { click: _ => w.doc.value.setZoom(w.doc.value.getZoom() + 0.1) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:reset', alt: 'Reset Zoom',
            },
            events: { click: _ => w.doc.value.setZoom(1) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:zoom-out', alt: 'Zoom Out',
            },
            events: { click: _ => w.doc.value.setZoom(w.doc.value.getZoom() - 0.1) }
          }),
        ]),


        // lower
        // ----------------------------------------------------------------------
        Toolbar.t([
          ToolbarButton.t({
            props: {
              img: 'icon:edit', alt: 'Pen',
              current: canvasToolButtonStyle(CanvasToolPen),
            },
            events: { click: _ => w.doc.value.setTool(CanvasToolPen) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:eraser', alt: 'Eraser',
              current: canvasToolButtonStyle(CanvasToolEraser),
            },
            events: { click: _ => w.doc.value.setTool(CanvasToolEraser) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:text', alt: 'Text',
              current: canvasToolButtonStyle(CanvasToolText),
            },
            events: { click: _ => w.doc.value.setTool(CanvasToolText) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:draw-rectangle', alt: 'Rectangle',
              current: canvasToolButtonStyle(CanvasToolRectangle),
            },
            events: { click: _ => w.doc.value.setTool(CanvasToolRectangle) }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'icon:cursor-arrow', alt: 'Select Rectangle',
              current: canvasToolButtonStyle(CanvasToolSelectRectangle),
            },
            events: { click: _ => w.doc.value.setTool(CanvasToolSelectRectangle) }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-large', alt: 'Thick Size',
            },
            events: { click: _ => w.doc.value.setStrokeWidth('thick') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-medium', alt: 'Medium Size',
            },
            events: { click: _ => w.doc.value.setStrokeWidth('medium') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-small', alt: 'Fine Size',
            },
            events: { click: _ => w.doc.value.setStrokeWidth('fine') }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'color:black', alt: 'Black',
            },
            events: { click: _ => w.doc.value.setColor('black') }
          }),
          ToolbarButton.t({
            props: {
              img: 'color:blue', alt: 'Blue',
            },
            events: { click: _ => w.doc.value.setColor('blue') }
          }),
          ToolbarButton.t({
            props: {
              img: 'color:red', alt: 'Red',
            },
            events: { click: _ => w.doc.value.setColor('red') }
          })

        ]),

      ])
    ]
  }
}

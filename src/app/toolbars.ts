import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { CanvasToolEraser } from "document/CanvasToolEraser";
import { CanvasToolPen } from "document/CanvasToolPen";
import { CanvasToolText } from "document/CanvasToolText";
import { Newable } from "util/Newable";
import { CanvasTool } from "document/CanvasTool";
import Toolbar, { ToolbarSeperator } from "common/toolbar";
import { ToolbarButton } from "common/toolbar";
import { CanvasToolRectangle } from "document/CanvasToolRectangle";
import { CanvasToolSelectRectangle } from "document/CanvasToolSelectRectangle";
import { WournalDocument } from "document/WournalDocument";
import { CanvasToolConfigData, CanvasToolStrokeWidth } from "persistence/ConfigDTO";
import { DSUtils } from "util/DSUtils";
import { Settings } from "./settings";

@Component.register
export default class Toolbars extends Component<{
  events: {
    'settings-open': CustomEvent,
  }
}> {
  props = {
    doc: rx.prop<WournalDocument>(),
  }

  render() {
    const d = this.props.doc;

    const noSelection = d.pipe(
      rx.switchMap(doc => doc.selection.available),
      rx.map(v => !v)
    );

    const currentTool = d.pipe(rx.switchMap(doc => doc.currentTool));
    const toolConfig = d.pipe(rx.switchMap(doc => doc.toolConfig));
    const currentToolConfig: rx.Stream<CanvasToolConfigData | undefined> =
      rx.combineLatest(currentTool, toolConfig).pipe(
        rx.map(([tool, config]) =>
          DSUtils.hasKey(config, tool.name) ? config[tool.name] : undefined)
      );

    const canvasToolButtonStyle = (tool: Newable<CanvasTool>) =>
      currentTool.map(t => t instanceof tool);

    const strokeWidth: rx.Stream<CanvasToolStrokeWidth | undefined> =
      currentToolConfig.map(
        config => (config && 'strokeWidth' in config)
                ? config.strokeWidth : undefined
      );

    const strokeColor: rx.Stream<string | undefined> =
      currentToolConfig.map(
        config => (config && 'color' in config) ? config.color : undefined
      );

    return [
      h.div({ fields: { className: 'topbar' } }, [
        // menu
        // ----------------------------------------------------------------------
        ui5.menu({
          fields: { id: 'menu' },
          events: {
            'item-click': e => {
              const item = e.detail.item;
              ({
                'Preferences': () => {
                  this.dispatch('settings-open', undefined);
                }
              } as any)[item.text]();
            }
          }
        }, [
          ui5.menuItem({ fields: { text: 'File' } }, [
            ui5.menuItem({ fields: { icon: 'save', text: 'Save' }}),
            ui5.menuItem({ fields: { icon: 'document', text: 'New' }}),
            ui5.menuItem({ fields: { icon: 'open-folder', text: 'Load' }}),
          ]),

          ui5.menuItem({ fields: { text: 'Edit' } }, [
            ui5.menuItem({ fields: { icon: 'undo', text: 'Undo' }}),
            ui5.menuItem({ fields: { icon: 'redo', text: 'Redo' }}),
            ui5.menuItem({ fields: {
              icon: 'scissors', text: 'Cut Selection',
              startsSection: true,
            }}),
            ui5.menuItem({ fields: { icon: 'copy', text: 'Copy Selection' }}),
            ui5.menuItem({ fields: { icon: 'paste', text: 'Paste Selection/Clipboard' }}),
            ui5.menuItem({
              fields: { icon: 'settings', text: 'Preferences' },
            }),
          ]),

          ui5.menuItem({ fields: { text: 'File' } }),
          ui5.menuItem({ fields: { text: 'File' } }),
          ui5.menuItem({ fields: { text: 'File' } }),
          ui5.menuItem({ fields: { text: 'File' } }),
          ui5.menuItem({ fields: { text: 'File' } }),
          ui5.menuItem({ fields: { text: 'File' } }),
          ui5.menuItem({ fields: { text: 'File' } }),
        ]),


        // upper
        // ----------------------------------------------------------------------
        Toolbar.t({}, [
          ToolbarButton.t({
            props: {
              img: 'icon:settings', alt: 'Settings',
            },
            events: { click: e => {
              this.dispatch('settings-open', undefined);
            }}
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:menu2', alt: 'Menu',
            },
            events: { click: async e => {
              const menu = await this.query<ui5.types.Menu>('#menu');
              if (menu.open) menu.close();
              else menu.showAt(e.target as HTMLElement);
            }}
          }),
          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:save', alt: 'Save',
            },
            // events: { click: _ => w.saveDocument() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:document', alt: 'New',
            },
            // events: { click: _ => w.loadDocument(true) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:open-folder', alt: 'Load',
            },
            // events: { click: _ => w.loadDocument(false) }
          }),
          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:undo', alt: 'Undo',
              disabled: d.pipe(
                rx.switchMap(doc => doc.undoStack.undoAvailable),
                rx.map(v => !v),
              ),
            },
            events: { click: _ => d.value.undo() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:redo', alt: 'Redo',
              disabled: d.pipe(
                rx.switchMap(doc => doc.undoStack.redoAvailable),
                rx.map(v => !v),
              ),
            },
            events: { click: _ => d.value.redo() }
          }),
          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:scissors', alt: 'Cut Selection',
              disabled: noSelection,
            },
            events: { click: _ => d.value.selectionCut() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:copy', alt: 'Copy Selection',
              disabled: noSelection,
            },
            events: { click: _ => d.value.selectionCopy() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:paste', alt: 'Paste Selection/Clipboard',
            },
            events: { click: _ => d.value.selectionOrClipboardPaste() }
          }),

          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:zoom-in', alt: 'Zoom In',
            },
            events: { click: _ => d.value.setZoom(d.value.getZoom() + 0.1) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:reset', alt: 'Reset Zoom',
            },
            events: { click: _ => d.value.setZoom(1) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:zoom-out', alt: 'Zoom Out',
            },
            events: { click: _ => d.value.setZoom(d.value.getZoom() - 0.1) }
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
            events: { click: _ => d.value.setTool(CanvasToolPen) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:eraser', alt: 'Eraser',
              current: canvasToolButtonStyle(CanvasToolEraser),
            },
            events: { click: _ => d.value.setTool(CanvasToolEraser) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:text', alt: 'Text',
              current: canvasToolButtonStyle(CanvasToolText),
            },
            events: { click: _ => d.value.setTool(CanvasToolText) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:draw-rectangle', alt: 'Rectangle',
              current: canvasToolButtonStyle(CanvasToolRectangle),
            },
            events: { click: _ => d.value.setTool(CanvasToolRectangle) }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'icon:cursor-arrow', alt: 'Select Rectangle',
              current: canvasToolButtonStyle(CanvasToolSelectRectangle),
            },
            events: { click: _ => d.value.setTool(CanvasToolSelectRectangle) }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-large', alt: 'Thick Size',
              current: strokeWidth.map(w => w === 'thick'),
            },
            events: { click: _ => d.value.setStrokeWidth('thick') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-medium', alt: 'Medium Size',
              current: strokeWidth.map(w => w === 'medium'),
            },
            events: { click: _ => d.value.setStrokeWidth('medium') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-small', alt: 'Fine Size',
              current: strokeWidth.map(w => w === 'fine'),
            },
            events: { click: _ => d.value.setStrokeWidth('fine') }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'color:#000000', alt: 'Black',
              current: strokeColor.map(c => c === '#000000'),
            },
            events: { click: _ => d.value.setColor('#000000') }
          }),
          ToolbarButton.t({
            props: {
              img: 'color:#2F2FE7', alt: 'Blue',
              current: strokeColor.map(c => c === '#2F2FE7'),
            },
            events: { click: _ => d.value.setColor('#2F2FE7') }
          }),
          ToolbarButton.t({
            props: {
              img: 'color:#FF0000', alt: 'Red',
              current: strokeColor.map(c => c === '#FF0000'),
            },
            events: { click: _ => d.value.setColor('#FF0000') }
          })

        ]),

      ])
    ]
  }
}

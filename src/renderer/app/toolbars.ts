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
import { ConfigCtx } from "./config-context";
import { ApiCtx } from "./api-context";
import { GlobalCommandId, GlobalCommandIdT, GlobalCommandsCtx } from "./global-commands";
import { FontPickerToolbarButton } from "common/font-picker";
import { CanvasToolHighlighter } from "document/CanvasToolHighlighter";
import { CanvasToolRuler } from "document/CanvasToolRuler";
import { CanvasToolEllipse } from "document/CanvasToolEllipse";
import { CanvasToolHand } from "document/CanvasToolHand";
import { CanvasToolImage } from "document/CanvasToolImage";

@Component.register
export default class Toolbars extends Component {
  props = {
    doc: rx.prop<WournalDocument>(),
  }

  render() {
    const d = this.props.doc;
    const configCtx = this.getContext(ConfigCtx);

    const noSelection = d.pipe(
      rx.switchMap(doc => doc.selection.available),
      rx.map(v => !v)
    );

    const isSinglePage = d.derive(d => d.isSinglePage);

    const currentTool = d.pipe(rx.switchMap(doc => doc.currentTool));
    const toolConfig = d.pipe(rx.switchMap(doc => doc.toolConfig));
    const currentToolConfig: rx.Stream<CanvasToolConfigData | undefined> =
      rx.combineLatest(currentTool, toolConfig).pipe(
        rx.map(([tool, config]) =>
          DSUtils.hasKey(config, tool.name) ? config[tool.name] : undefined)
      );

    const isCurrentTool = (tool: Newable<CanvasTool>) =>
      currentTool.map(t => t.name === tool.name);

    const currentToolMenuIcon = (tool: Newable<CanvasTool>) =>
      currentTool.map(t => t.name === tool.name ? 'wournal/menu-selected' : '');

    const strokeWidth: rx.Stream<CanvasToolStrokeWidth | undefined> =
      currentToolConfig.map(
        config => (config && 'strokeWidth' in config)
                ? config.strokeWidth : undefined
      );

    const strokeColor: rx.Stream<string | undefined> =
      currentToolConfig.map(
        config => (config && 'color' in config) ? config.color : undefined
      );

    const api = this.getContext(ApiCtx);
    const globalCmnds = this.getContext(GlobalCommandsCtx);

    const globalCmdMenuItem = (id: GlobalCommandIdT) => ({
      id,
      text: globalCmnds[id].human_name,
      additionalText: globalCmnds[id].shortcut ?? '',
    });

    return [
      h.div({ fields: { className: 'topbar' } }, [
        // menu
        // ----------------------------------------------------------------------
        ui5.menu({
          fields: { id: 'menu' },
          events: {
            'item-click': e => {
              const id = e.detail.item.id as GlobalCommandIdT | '';
              if (id.startsWith('color:')) {
                api.setColorByHex(id.split('color:')[1]);
                return;
              }
              if (id === '') return;
              console.assert(GlobalCommandId.indexOf(id) !== -1);
              globalCmnds[id].func();
            }
          }
        }, [
          ui5.menuItem({ fields: { text: 'File' } }, [
            ui5.menuItem({
              fields: {
                icon: 'save', ...globalCmdMenuItem('file_save'),
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'save', ...globalCmdMenuItem('file_save_as'),
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'save', ...globalCmdMenuItem('file_save_as_single_page'),
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'document', ...globalCmdMenuItem('file_new'),
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'open-folder', ...globalCmdMenuItem('file_load'),
              }
            }),
          ]),

          ui5.menuItem({ fields: { text: 'Edit' } }, [
            ui5.menuItem({
              fields: {
                icon: 'undo', ...globalCmdMenuItem('history_undo')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'redo', ...globalCmdMenuItem('history_redo')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'scissors', startsSection: true,
                ...globalCmdMenuItem('selection_cut')
              },
              events: {
                click: console.log,
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'copy', ...globalCmdMenuItem('selection_copy')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'paste',
                ...globalCmdMenuItem('clipboard_paste')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'delete',
                ...globalCmdMenuItem('selection_delete')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'settings', ...globalCmdMenuItem('preferences_open'),
                startsSection: true
              },
            }),
          ]),

          ui5.menuItem({ fields: { text: 'View' } }, [
            ui5.menuItem({
              fields: {
                icon: 'zoom-in', ...globalCmdMenuItem('zoom_in')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'reset', ...globalCmdMenuItem('zoom_reset')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'border', ...globalCmdMenuItem('zoom_fit_width')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'zoom-out', ...globalCmdMenuItem('zoom_out')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'full-screen', ...globalCmdMenuItem('fullscreen_toggle')
              }
            }),
          ]),

          ui5.menuItem({ fields: { text: 'Page' } }, [
            ui5.menuItem({
              fields: {
                icon: 'request', ...globalCmdMenuItem('page_set_style')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'add-document', ...globalCmdMenuItem('page_new_after'),
                disabled: isSinglePage,
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'arrow-top', ...globalCmdMenuItem('page_move_up'),
                disabled: isSinglePage,
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'arrow-bottom', ...globalCmdMenuItem('page_move_down'),
                disabled: isSinglePage,
              }
            }),
            ui5.menuItem({
              fields: {
                icon: 'delete', ...globalCmdMenuItem('page_delete'),
                disabled: isSinglePage,
              }
            }),
          ]),

          ui5.menuItem({ fields: { text: 'Tool' } }, [
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolPen),
                ...globalCmdMenuItem('tool_pen')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolHighlighter),
                ...globalCmdMenuItem('tool_highlighter')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolEraser),
                ...globalCmdMenuItem('tool_eraser')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolText),
                ...globalCmdMenuItem('tool_text')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolRectangle),
                ...globalCmdMenuItem('tool_rectangle')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolRuler),
                ...globalCmdMenuItem('tool_ruler')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolRuler),
                ...globalCmdMenuItem('tool_ellipse')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolHand),
                ...globalCmdMenuItem('tool_hand')
              }
            }),
            ui5.menuItem({
              fields: {
                icon: currentToolMenuIcon(CanvasToolSelectRectangle),
                ...globalCmdMenuItem('tool_select_rectangle'),
                startsSection: true
              }
            }),
            ui5.menuItem({
              fields: {text: 'Color', icon: 'palette', startsSection: true }
            }, [
              h.fragment(configCtx, config => config.colorPalette.map(col =>
                ui5.menuItem({
                  fields: {
                    text: col.name,
                    id: `color:${col.color}`,
                    icon: strokeColor.map(
                      c => c === col.color ? 'wournal/menu-selected' : ''
                    ),
                  }
                })
              ))
            ]),
            ui5.menuItem({ fields: { text: 'Stroke Width' } }, [
              ui5.menuItem({
                fields: {
                  icon: strokeWidth.map(
                    s => s === 'fine' ? 'wournal/menu-selected' : ''
                  ),
                  ...globalCmdMenuItem('tool_stroke_width_fine'),
                }
              }),
              ui5.menuItem({
                fields: {
                  icon: strokeWidth.map(
                    s => s === 'medium' ? 'wournal/menu-selected' : ''
                  ),
                  ...globalCmdMenuItem('tool_stroke_width_medium'),
                }
              }),
              ui5.menuItem({
                fields: {
                  icon: strokeWidth.map(
                    s => s === 'thick' ? 'wournal/menu-selected' : ''
                  ),
                  ...globalCmdMenuItem('tool_stroke_width_thick'),
                }
              }),
            ]),
            ui5.menuItem({
              fields: {
                ...globalCmdMenuItem('tool_current_default'),
                startsSection: true
              }
            }),
            ui5.menuItem({
              fields: {
                ...globalCmdMenuItem('tool_default_pen'),
              }
            }),
          ]),
        ]),


        // upper
        // ----------------------------------------------------------------------
        Toolbar.t({}, [
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
            events: { click: globalCmnds.file_save.func }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:document', alt: 'New',
            },
            events: { click: () => api.newDocument() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:open-folder', alt: 'Load',
            },
            events: { click: api.loadDocumentPrompt }
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
            events: { click: api.undo }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:redo', alt: 'Redo',
              disabled: d.pipe(
                rx.switchMap(doc => doc.undoStack.redoAvailable),
                rx.map(v => !v),
              ),
            },
            events: { click: api.redo }
          }),
          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:scissors', alt: 'Cut Selection',
              disabled: noSelection,
            },
            events: { click: api.cutSelection }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:copy', alt: 'Copy Selection',
              disabled: noSelection,
            },
            events: { click: api.copySelection }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:paste', alt: 'Paste Selection/Clipboard',
            },
            events: { click: api.pasteClipboard }
          }),

          ToolbarSeperator.t(),
          ToolbarButton.t({
            props: {
              img: 'icon:zoom-in', alt: 'Zoom In',
            },
            events: { click: _ => api.setZoom(api.getZoom() + 0.1) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:reset', alt: 'Reset Zoom',
            },
            events: { click: _ => api.setZoom(1) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:border', alt: 'Zoom to Fit to Width',
            },
            events: { click: _ => api.setZoomFitWidth() }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:zoom-out', alt: 'Zoom Out',
            },
            events: { click: _ => api.setZoom(api.getZoom() - 0.1) }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:full-screen', alt: 'Toggle Fullscreen',
            },
            events: {
              click: _ => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else if (document.exitFullscreen) {
                  document.exitFullscreen();
                }
              }
            }
          }),
          ToolbarSeperator.t(),
          FontPickerToolbarButton.t({
            props: {
              family: toolConfig.map(t => t.CanvasToolText.fontFamily),
              size: toolConfig.map(t => t.CanvasToolText.fontSize),
            }
          }),
        ]),


        // lower
        // ----------------------------------------------------------------------
        Toolbar.t([
          ToolbarButton.t({
            props: {
              img: 'icon:edit', alt: 'Pen',
              current: isCurrentTool(CanvasToolPen),
            },
            events: { click: _ => api.setTool('CanvasToolPen') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:wournal/highlighter', alt: 'Highlighter',
              current: isCurrentTool(CanvasToolHighlighter),
            },
            events: { click: _ => api.setTool('CanvasToolHighlighter') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:eraser', alt: 'Eraser',
              current: isCurrentTool(CanvasToolEraser),
            },
            events: { click: _ => api.setTool('CanvasToolEraser') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:text', alt: 'Text',
              current: isCurrentTool(CanvasToolText),
            },
            events: { click: _ => api.setTool('CanvasToolText') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:picture', alt: 'Image',
              current: isCurrentTool(CanvasToolImage),
            },
            events: { click: _ => api.setTool('CanvasToolImage') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:draw-rectangle', alt: 'Rectangle',
              current: isCurrentTool(CanvasToolRectangle),
            },
            events: { click: _ => api.setTool('CanvasToolRectangle') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:tnt/unit', alt: 'Ruler',
              current: isCurrentTool(CanvasToolRuler),
            },
            events: { click: _ => api.setTool('CanvasToolRuler') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:circle-task', alt: 'Ellipse',
              current: isCurrentTool(CanvasToolEllipse),
            },
            events: { click: _ => api.setTool('CanvasToolEllipse') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:touch', alt: 'Toggle Hand',
              current: isCurrentTool(CanvasToolHand),
            },
            events: { click: _ => globalCmnds.tool_hand.func() }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'icon:cursor-arrow', alt: 'Select Rectangle',
              current: isCurrentTool(CanvasToolSelectRectangle),
            },
            events: { click: _ => api.setTool('CanvasToolSelectRectangle') }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'img:res/icon/material/autorenew.svg',
              alt: globalCmnds.tool_current_default.human_name,
            },
            events: {
              click: _ => globalCmnds.tool_current_default.func()
            }
          }),
          ToolbarButton.t({
            props: {
              img: 'img:res/icon/custom/default-pen.svg',
              alt: globalCmnds.tool_default_pen.human_name,
            },
            events: {
              click: _ => globalCmnds.tool_default_pen.func()
            }
          }),

          ToolbarSeperator.t(),

          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-large', alt: 'Thick Size',
              current: strokeWidth.map(w => w === 'thick'),
            },
            events: { click: _ => api.setStrokeWidth('thick') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-medium', alt: 'Medium Size',
              current: strokeWidth.map(w => w === 'medium'),
            },
            events: { click: _ => api.setStrokeWidth('medium') }
          }),
          ToolbarButton.t({
            props: {
              img: 'icon:wournal/size-modifier-small', alt: 'Fine Size',
              current: strokeWidth.map(w => w === 'fine'),
            },
            events: { click: _ => api.setStrokeWidth('fine') }
          }),
          ToolbarSeperator.t(),

          h.fragment(configCtx, config => config.colorPalette.map(col =>
            ToolbarButton.t({
              props: {
                img: `color:${col.color}`, alt: col.name,
                current: strokeColor.map(c => c === col.color),
              },
              events: { click: _ => api.setColorByHex(col.color) }
            })
          )),
        ]),

      ])
    ]
  }

  static styles = style.sheet({
    ':host': {
      position: 'fixed',
      top: '0',
      width: '100%',
      zIndex: '2',
      outline: 'none',
    }
  })
}

import { Component, h, rx, style } from "@mvuijs/core";
import * as ui5 from "@mvuijs/ui5";
import { ConfigCtx } from "app/config-context";
import { FontPicker } from "common/font-picker";
import { SimpleSelect } from "common/simple-select";
import { CanvasToolName, CanvasToolNames } from "document/CanvasTool";
import { ApiClient } from "electron-api-client";
import {
    AutosaveConfig,
  CanvasToolConfig, CanvasToolStrokeWidth, ConfigDTO, defaultConfig
} from "persistence/ConfigDTO";
import { AUTOSAVE_DIR } from "Shared/const";
import { DSUtils } from "util/DSUtils";
import ColorPaletteEditor, { ColorPicker } from "./color-palette-editor";
import { GlobalCommandsCtx } from "./global-commands";
import { ToastCtx } from "./toast-context";

@Component.register
export class Settings extends Component {
  props = {
    open: rx.prop({ defaultValue: false }),
  }

  render() {
    const configCtx = this.getContext(ConfigCtx, true);
    const toast = this.getContext(ToastCtx, true).open;

    // local while editing
    const conf = new rx.State(defaultConfig());

    this.subscribe(this.props.open, async (open) => {
      const dialog = await this.query<ui5.types.Dialog>('ui5-dialog');
      if (open) {
        conf.next(DSUtils.copyObj(configCtx.value));
        dialog.show();
      }
      else if (dialog.open) dialog.close();
    });

    return [
      ui5.dialog({
        fields: {
          headerText: 'Settings',
        },
        style: { width: '100%', height: '100%' },
        slots: {
          footer: [
            h.div({ fields: { id: 'footer' }}, [
              ui5.button({
                events: { click: _ => { this.props.open.next(false); }}
              }, 'Cancel'),
              ui5.button({
                fields: { design: 'Emphasized' },
                events: { click: _ => {
                  configCtx.next(conf.value);
                  this.props.open.next(false);
                  toast('Configuration Saved');
                }}
              }, 'Save'),
            ]),
          ]
        }
      }, [
        ui5.panel({ fields: { headerText: 'User Interface', collapsed: true }}, [
          UserInterfaceSettings.t({ props: {
            invert: rx.bind(conf.partial('invertDocument')),
            theme: rx.bind(conf.partial('theme')),
            zoomUi: rx.bind(conf.partial('zoomUI')),
            defaultZoomDocument: rx.bind(conf.partial('defaultZoomDocument')),
            checkUpdatesOnStartup: rx.bind(conf.partial('checkUpdatesOnStartup')),
          }})
        ]),
        ui5.panel({ fields: { headerText: 'Default Tool Settings', collapsed: true }}, [
          ToolDefaultSettings.t({
            props: { cfg: rx.bind(conf.partial('tools')) }
          }),
        ]),
        ui5.panel({ fields: { headerText: 'Mouse Bindings', collapsed: true }}, [
          MouseBindingsConfig.t({ props: {
            rightClick: rx.bind(conf.partial('binds', 'rightClick')),
            middleClick: rx.bind(conf.partial('binds', 'middleClick')),
          }}),
        ]),
        ui5.panel({ fields: { headerText: 'Color Palette', collapsed: true }}, [
          ColorPaletteEditor.t({
            props: { palette: rx.bind(conf.partial('colorPalette')) }
          }),
        ]),
        ui5.panel({ fields: { headerText: 'PDF Annotation', collapsed: true }}, [
          h.div(ui5.checkbox({ fields: {
            checked: rx.bind(conf.partial('autoOpenWojWithSameNameAsPDF')),
            wrappingType: 'Normal',
            text: 'Auto open WOJ file for PDF if found',
          }})),
          h.div(ui5.checkbox({ fields: {
            checked: rx.bind(conf.partial('hideAnnotations')),
            wrappingType: 'Normal',
            text: 'Hide PDF annotations made with other programs (including links)',
          }})),
        ]),
        ui5.panel({ fields: { headerText: 'Autosaving', collapsed: true }}, [
          AutosaveSettings.t({ props: {
            intervalSeconds: rx.bind(conf.partial('autosave', 'intervalSeconds')),
            enable: rx.bind(conf.partial('autosave', 'enable')),
            keepFiles: rx.bind(conf.partial('autosave', 'keepFiles')),
          } }),
        ]),
      ])
    ]
  }

  static styles = style.sheet({
    'ui5-dialog': {
      background: ui5.Theme.BackgroundColor,
    },
    'ui5-panel': {
      marginBottom: '10px',
    },
    '#footer': {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    '#footer > ui5-button': {
      margin: '3px',
    }
  })

}

@Component.register
class MouseBindingsConfig extends Component {
  props = {
    rightClick: rx.prop<CanvasToolName>(),
    middleClick: rx.prop<CanvasToolName>(),
  }

  render() {
    return [
      h.table([
        h.tr([
          h.td(ui5.label({ fields: { for: 'cfg-right-click' }}, 'Right Click')),
          h.td(ToolSelect.t({
            fields: { id: 'cfg-right-click' },
            props: { tool: rx.bind(this.props.rightClick) },
          })),
        ]),
        h.tr([
          h.td(ui5.label({ fields: { for: 'cfg-middle-click' }}, 'Middle Click')),
          h.td(ToolSelect.t({
            fields: { id: 'cfg-middle-click' },
            props: { tool: rx.bind(this.props.middleClick) },
          })),
        ]),
      ])
    ]
  }
}


@Component.register
class ToolSelect extends Component {
  props = {
    tool: rx.prop<CanvasToolName>(),
    allowed: rx.prop<CanvasToolName[]>({
      defaultValue: CanvasToolNames as unknown as CanvasToolName[]
    })
  }

  #humanNames: { [K in CanvasToolName]: string } = {
    'CanvasToolEraser': 'Eraser',
    'CanvasToolPen': 'Pen',
    'CanvasToolRectangle': 'Rectangle',
    'CanvasToolEllipse': 'Ellipse',
    'CanvasToolRuler': 'Ruler',
    'CanvasToolSelectRectangle': 'Select Rectangle',
    'CanvasToolText': 'Text',
    'CanvasToolHighlighter': 'Highlighter',
    'CanvasToolHand': 'Hand',
    'CanvasToolImage': 'Image',
    'CanvasToolSelectText': 'Select Text in PDF',
  }

  render() {
    const { allowed, tool } = this.props;

    return [
      ui5.select(
        {
          events: {
            'change': o => {
              tool.next(o.detail.selectedOption.value as any);
            }
          }
        },
        [
          h.fragment(allowed, a => a.map(a => ui5.option(
            {
              fields: {
                value: a,
                selected: tool.derive(t => t === a),
              },
            },
            this.#humanNames[a]
          )))
        ])
    ]
  }
}

@Component.register
class UserInterfaceSettings extends Component {
  props = {
    invert: rx.prop<boolean>(),
    theme: rx.prop<ConfigDTO['theme']>(),
    zoomUi: rx.prop<number>(),
    defaultZoomDocument: rx.prop<number>(),
    checkUpdatesOnStartup: rx.prop<boolean>(),
  }

  render() {
    const themeNames: { [K in ConfigDTO['theme']]: string } = {
      dark                : 'Dark',
      light               : 'Light',
      auto                : 'Auto',
      dark_high_contrast  : 'Dark (High Contrast)',
      light_high_contrast : 'Light (High Contrast)',
      auto_high_contrast  : 'Auto (High Contrast)',
    }
    const globalCmds = this.getContext(GlobalCommandsCtx);

    return [
      ui5.title({ fields: { level: 'H5' }}, 'Theme'),
      h.hr(),
      h.p([
        ui5.select({
          events: {
            change: e => {
              const t = e.detail.selectedOption.value as ConfigDTO['theme'];
              this.props.theme.next(t);
            }
          }
        }, [
          ...DSUtils.objKeys(themeNames).map(k => ui5.option({
            fields: {
              value: k,
              selected: this.props.theme.derive(t => t === k),
            }
          }, themeNames[k]))
        ]),
        h.div(ui5.checkbox({
          fields: {
            checked: rx.bind(this.props.invert),
            wrappingType: 'Normal',
            text: 'Invert Document Colors for Dark Themes',
          }
        })),
        h.p([
          'Note that you can temporarily toggle dark mode using ',
          h.i(globalCmds.toggle_dark_mode_temp.shortcut), '.'
        ]),

      ]),

      ui5.title({ fields: { level: 'H5' }}, 'Zoom'),
      h.hr(),
      h.p([
        h.table([
          h.tr([
            h.td(ui5.label('Default Document Zoom*')),
            h.td(ui5.stepInput({
              fields: {
                value: rx.bind(this.props.defaultZoomDocument),
                step: 0.1, min: 0, max: 10, valuePrecision: 2,
              }
            })),
          ]),
          h.tr([
            h.td(ui5.label('User Interface Zoom*')),
            h.td(ui5.stepInput({
              fields: {
                value: rx.bind(this.props.zoomUi),
                step: 0.1, min: 0, max: 10, valuePrecision: 2,
              }
            })),
          ]),
        ]),
      ]),

      ui5.title({ fields: { level: 'H5' }}, 'Updates'),
      h.hr(),
      h.div(ui5.checkbox({
        fields: {
          checked: rx.bind(this.props.checkUpdatesOnStartup),
          wrappingType: 'Normal',
          text: 'Periodically Check for Updates on Startup',
        }
      })),

      h.p(h.i('*: Restart Required')),
    ]
  }
}

@Component.register
class ToolDefaultSettings extends Component {
  props = {
    cfg: rx.prop<CanvasToolConfig>(),
  }

  render() {
    const { cfg } = this.props;

    const selectWidth = (value: rx.State<CanvasToolStrokeWidth>) => SimpleSelect(
      value, [
        { value: 'fine', name: 'Fine' },
        { value: 'medium', name: 'Medium' },
        { value: 'thick', name: 'Thick' },
      ]
    );

    const mainSection = [
      h.fieldset([
        h.legend('Pen'),
        h.table([
          h.tr([
            h.td(ui5.label('Color')),
            h.td(ColorPicker.t({
              props: { color: rx.bind(cfg.partial('CanvasToolPen', 'color')) },
            }))
          ]),
          h.tr([
            h.td(ui5.label('Stroke Width')),
            h.td(selectWidth(cfg.partial('CanvasToolPen', 'strokeWidth'))),
          ]),
          h.tr([
            h.td(ui5.label('Smoothing Factor*')),
            h.td(ui5.stepInput({
              fields: {
                value: rx.bind(cfg.partial('CanvasToolPen', 'mouseBufferSize')),
                step: 1, min: 0, max: 10
              }
            })),
          ]),
        ]),
      ]),
      h.fieldset([
        h.legend('Highlighter'),
        h.table([
          h.tr([
            h.td(ui5.label('Color')),
            h.td(ColorPicker.t({
              props: { color: rx.bind(cfg.partial('CanvasToolHighlighter', 'color')) },
            }))
          ]),
          h.tr([
            h.td(ui5.label('Stroke Width')),
            h.td(selectWidth(cfg.partial('CanvasToolHighlighter', 'strokeWidth'))),
          ]),
        ]),
      ]),
      h.fieldset([
        h.legend('Eraser'),
        h.table([
          h.tr([
            h.td(ui5.label('Stroke Width')),
            h.td(selectWidth(cfg.partial('CanvasToolEraser', 'strokeWidth'))),
          ]),
          h.tr([
            h.td(ui5.checkbox({
              fields: {
                checked: rx.bind(cfg.partial('CanvasToolEraser', 'eraseStrokes')),
                text: 'Erase Strokes',
              },
            }))
          ]),
        ]),
      ]),
      h.fieldset([
        h.legend('Text'),
        h.table([
          h.tr([
            h.td(ui5.label('Color')),
            h.td(ColorPicker.t({
              props: { color: rx.bind(cfg.partial('CanvasToolText', 'color')) },
            }))
          ]),
        ]),
        FontPicker.t({
          props: {
            family: rx.bind(cfg.partial('CanvasToolText', 'fontFamily')),
            style: rx.bind(cfg.partial('CanvasToolText', 'fontStyle')),
            weight: rx.bind(cfg.partial('CanvasToolText', 'fontWeight')),
            size: rx.bind(cfg.partial('CanvasToolText', 'fontSize')),
          }
        })
      ]),
      h.fieldset([
        h.legend('Rectangle'),
        h.table([
          h.tr([
            h.td(ui5.label('Color')),
            h.td(ColorPicker.t({
              props: { color: rx.bind(cfg.partial('CanvasToolRectangle', 'color')) },
            }))
          ]),
          h.tr([
            h.td(ui5.label('Stroke Width')),
            h.td(selectWidth(cfg.partial('CanvasToolRectangle', 'strokeWidth')))
          ]),
        ]),
      ]),
      h.fieldset([
        h.legend('Ruler'),
        h.table([
          h.tr([
            h.td(ui5.label('Color')),
            h.td(ColorPicker.t({
              props: { color: rx.bind(cfg.partial('CanvasToolRuler', 'color')) },
            }))
          ]),
          h.tr([
            h.td(ui5.label('Stroke Width')),
            h.td(selectWidth(cfg.partial('CanvasToolRuler', 'strokeWidth')))
          ]),
        ]),
      ]),
      h.fieldset([
        h.legend('Ellipse'),
        h.table([
          h.tr([
            h.td(ui5.label('Color')),
            h.td(ColorPicker.t({
              props: { color: rx.bind(cfg.partial('CanvasToolEllipse', 'color')) },
            }))
          ]),
          h.tr([
            h.td(ui5.label('Stroke Width')),
            h.td(selectWidth(cfg.partial('CanvasToolEllipse', 'strokeWidth')))
          ]),
        ]),
      ]),
      h.fieldset([
        h.legend('Select Text in PDF'),
        h.table([
          h.tr([
            h.td(ui5.label('Color')),
            h.td(ColorPicker.t({
              props: { color: rx.bind(cfg.partial('CanvasToolSelectText', 'color')) },
            }))
          ]),
          h.tr([
            h.td(ui5.label('Stroke Width')),
            h.td(selectWidth(cfg.partial('CanvasToolSelectText', 'strokeWidth')))
          ]),
        ]),
      ]),
    ]

    return [
      h.section(
        { fields: { id: 'main' } },
        mainSection
      ),
      h.section([
        h.span('*: Restart Required')
      ])
    ]
  }

  static styles = style.sheet({
    '#main': {
      display: 'flex',
      flexWrap: 'wrap',
      marginBottom: '10px',
    },
    'fieldset': {
      margin: '10px 20px 0px 0px',
      borderRadius: '4px',
      border: `1px solid ${ui5.Theme.Button_BorderColor}`,
    },
    'fieldset > legend': {
      fontWeight: 'bold',
    },
  });
}

@Component.register
class AutosaveSettings extends Component {
  props = {
    intervalSeconds: rx.prop<number>(),
    keepFiles: rx.prop<number>(),
    enable: rx.prop<boolean>(),
  }

  render() {
    const { intervalSeconds, keepFiles, enable } = this.props;

    return [
      h.p([
        'Wournal can automatically save versions of your documents ',
        'to avoid data loss.'
      ]),
      h.section({ style: { textAlign: 'right' }}, [
        ui5.button({
          fields: {icon: 'folder'},
          events: {
            click: _ => {
              ApiClient['shell:open'](AUTOSAVE_DIR);
            }
          }
        }, 'Open Autosave Folder')
      ]),
      h.table([
        h.tr([
          h.td(ui5.label({ fields: { for: 'enable' }}, 'Enable Autosave: ')),
          h.td(ui5.switchToggle(
            { fields: { id: 'enable', checked: rx.bind(enable) } },
          ))
        ]),
        h.tr([
          h.td(ui5.label({ fields: { for: 'interval' }}, 'Save every *n* minutes: ')),
          h.td(ui5.stepInput({
            fields: {
              value: rx.bind(intervalSeconds.createLinked(
                (val) => val / 60,
                (val, next) => next(val * 60),
              )),
              step: 1, min: 0, max: 10 * 60,
            },
            style: { width: '8em' },
          }))
        ]),
        h.tr([
          h.td(ui5.label({ fields: { for: 'keep' }}, 'Keep *n* files: ')),
          h.td(ui5.stepInput({
            fields: {
              value: rx.bind(keepFiles),
              step: 10, min: 0, max: 500,
            },
            style: { width: '8em' },
          }))
        ]),
      ]),
    ];
  }

  static styles = style.sheet({
    'table > tr': {
      height: '3em',
    }
  })
}

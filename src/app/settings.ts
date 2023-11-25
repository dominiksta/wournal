import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { ConfigCtx } from "app/config-context";
import { CanvasToolName, CanvasToolNames } from "document/CanvasTool";
import { ConfigDTO, defaultConfig } from "persistence/ConfigDTO";
import { DSUtils } from "util/DSUtils";
import ColorPaletteEditor from "./color-palette-editor";
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
        ui5.panel({ fields: { headerText: 'Theme', fixed: true }}, [
          ThemeSettings.t({ props: {
            invert: rx.bind(conf.partial('invertDocument')),
            theme: rx.bind(conf.partial('theme')),
          }})
        ]),
        ui5.panel({ fields: { headerText: 'Right Click Binding', fixed: true }}, [
          ToolSelect.t({ props: { tool: rx.bind(conf.partial('binds', 'rightClick')) } }),
        ]),
        ui5.panel({ fields: { headerText: 'Color Palette', fixed: true }}, [
          ColorPaletteEditor.t({
            props: { palette: rx.bind(conf.partial('colorPalette')) }
          }),
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
    'CanvasToolSelectRectangle': 'Select Rectangle',
    'CanvasToolText': 'Text',
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
class ThemeSettings extends Component {
  props = {
    invert: rx.prop<boolean>(),
    theme: rx.prop<ConfigDTO['theme']>(),
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

    return [
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
          text: 'Invert Document Colors for Dark Themes',
        }
      })),
    ]
  }
}

import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { ConfigCtx } from "app/config-context";
import { defaultConfig } from "persistence/ConfigDTO";
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
        ui5.panel({ fields: { headerText: 'Color Palette', fixed: true }}, [
          ColorPaletteEditor.t({
            props: { palette: rx.bind(conf.partial('colorPalette')) }
          }),
        ])
      ])
    ]
  }

  static styles = style.sheet({
    'ui5-dialog': {
      background: ui5.Theme.BackgroundColor,
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

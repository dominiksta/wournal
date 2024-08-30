import { Component, h, rx, style } from "@mvuijs/core";
import * as ui5 from "@mvuijs/ui5";
import { ConfigCtx } from "./config-context";

@Component.register
export default class ColorPaletteEditor extends Component {
  props = {
    palette: rx.prop<{name: string, color: string}[]>(),
  }

  render() {
    const { palette } = this.props;
    const cfg = this.getContext(ConfigCtx);
    const darkInverts = rx.derive(cfg, style.currentTheme, (cfg, curr) =>
      cfg.invertDocument && (
        (
          cfg.theme.startsWith('auto') &&
          curr === 'dark'
        )
        || cfg.theme.startsWith('dark')
      )
    );

    function arrayPatch<T>(arr: T[], idx: int, val: T): T[] {
      const ret = [...arr];
      ret[idx] = val;
      return ret;
    }

    return [
      ui5.messageStrip({
        style: {
          display: darkInverts.ifelse({
            if: 'inline-block',
            else: 'none',
          })
        },
        fields: {
          hideCloseButton: true,
        }
      }, 'Colors are inverted because dark mode is enabled'),
      h.table(
        h.foreach(palette.asReadonly(), 'pos', (color, i) => h.tr([
          h.td(
            ui5.input({
              fields: { value: color.derive(c => c.name) },
              events: {
                keyup: e => {
                  palette.next(v => arrayPatch(v, i, {
                    ...color.value, name: (e.target as ui5.types.Input).value,
                  }));
                }
              }
            })
          ),
          h.td(
            ColorPicker.t({
              props: { color: color.derive(c => c.color) },
              events: {
                change: e => {
                  palette.next(v => arrayPatch(v, i, {
                    ...color.value, color: e.detail,
                  }));
                }
              }
            })
          ),
          h.td(
            ui5.button({
              fields: { icon: 'delete' },
              events: { click: () => palette.next(v => [
                ...v.slice(0, i), ...v.slice(i+1)
              ])}
            })
          )
        ]))
      ),
      ui5.button({
        fields: { icon: 'add' },
        events: {
          click: _ => {
            palette.next(v => [...v, { name: 'New Color', color: '#000000' }])
          }
        }
      }, 'New Color')
    ]
  }

  static styles = style.sheet({
    ':host': {
      display: 'inline-block',
    }
  });
}

@Component.register
export class ColorPicker extends Component<{
  events: {
    change: CustomEvent<string>,
  }
}> {

  props = {
    color: rx.prop<string>({ reflect: true }),
  }

  render() {
    const { color } = this.props;

    const changeColor = (e: Event) => {
      const newCol = (e.target as ui5.types.Input).value.toUpperCase();
      if (!newCol.match("^#[A-F0-9]*$")) return;
      color.next(newCol);
      this.dispatch('change', newCol);
    }

    return [
      ui5.input({
        fields: { value: color },
        events: { change: changeColor }
      }),
      h.input({
        fields: {
          type: 'color',
          value: color,
        },
        events: { change: changeColor }
      })
    ]
  }

  static styles = style.sheet({
    ':host': {
      display: 'flex',
      alignItems: 'center',
    },
    'ui5-input': {
      width: '6em',
    },
    'input[type=color]': {
      marginLeft: '4px',
      background: ui5.Theme.Button_Background,
      borderColor: ui5.Theme.Button_BorderColor,
      borderWidth: ui5.Theme.Button_BorderWidth,
      borderRadius: ui5.Theme.Field_BorderCornerRadius,
    },
    'input[type=color]:hover': {
      background: ui5.Theme.Button_Hover_Background,
    }
  })
}

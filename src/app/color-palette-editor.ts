import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";

@Component.register
export default class ColorPaletteEditor extends Component {
  props = {
    palette: rx.prop<{name: string, color: string}[]>(),
  }

  render() {
    const { palette } = this.props;


    function arrayPatch<T>(arr: T[], idx: int, val: T): T[] {
      const ret = [...arr];
      ret[idx] = val;
      return ret;
    }

    return [
      ui5.messageStrip({
        style: {
          display: style.currentTheme$.derive(
            t => t === 'dark' ? 'inline-block' : 'none'
          )
        },
        fields: {
          hideCloseButton: true,
        }
      }, 'Colors are inverted because dark mode is enabled'),
      h.table(
        // palette.derive(p => p.map(c => h.tr(JSON.stringify(c)))),
        palette.derive(p => p.map((color, idx) => h.tr([
          h.td(
            ui5.input({
              fields: { value: color.name },
              events: {
                change: e => {
                  palette.next(v => arrayPatch(v, idx, {
                    ...color,
                    name: (e.target as ui5.types.Input).value,
                  }));
                }
              }
            })
          ),
          h.td(
            ColorPicker.t({
              props: { color: color.color },
              events: {
                change: e => {
                  palette.next(v => arrayPatch(v, idx, {
                    ...color,
                    color: e.detail,
                  }));
                }
              }
            })
          ),
          h.td(
            ui5.button({
              fields: { icon: 'delete' },
              events: { click: () => palette.next(v => [
                ...v.slice(0, idx), ...v.slice(idx+1)
              ])}
            })
          )
        ])))
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

}

@Component.register
export class ColorPicker extends Component<{
  events: {
    change: CustomEvent<string>,
  }
}> {

  props = {
    color: rx.prop<string>(),
  }

  render() {
    const { color } = this.props;
    this.subscribe(color.pipe(rx.skip(1)), col => this.dispatch('change', col));

    const changeColor = (e: Event) => {
      const newCol = (e.target as ui5.types.Input).value;
      if (!newCol.match("^#[A-Fa-f0-9]*$")) return;
      color.next(newCol);
    }

    return [
      ui5.input({
        fields: { value: color },
        events: { input: changeColor }
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

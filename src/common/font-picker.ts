import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { ApiCtx } from "app/api-context";
import { DSUtils } from "util/DSUtils";
import { BasicDialogManagerContext } from "./dialog-manager";
import { toolbarButtonStyle } from "./toolbar";

@Component.register
export class FontPicker extends Component {

  props = {
    style: rx.prop<'normal' | 'italic'>(),
    weight: rx.prop<'normal' | 'bold'>(),
    family: rx.prop<string>(),
    size: rx.prop<number>(),
  }

  private static bundledFonts = ["Roboto", "Roboto Mono"];

  render() {

    const { style, weight, family, size } = this.props;
    const styleWeight =
      rx.derive(style, weight, (style, weight) => ({style, weight}));

    return [
      h.section([
        ui5.title({ fields: { level: 'H6' }}, 'Family:'),
        ...FontPicker.bundledFonts.map(font =>
          ui5.radioButton({
            fields: {
              text: font, checked: family.derive(f => f === font),
            },
            events: { change: _ => { family.next(font) } },
          })
        ),
      ]),

      h.section([
        ui5.title({ fields: { level: 'H6' } }, 'Style:'),
        ui5.radioButton({
          fields: {
            text: 'Normal',
            checked: styleWeight.derive(
              v => v.style === 'normal' && v.weight === 'normal'
            ),
            name: 'radio-group-style',
          },
          events: { change: _ => { style.next('normal'); weight.next('normal') } }
        }),
        ui5.radioButton({
          fields: {
            text: 'Italic',
            checked: styleWeight.derive(
              v => v.style === 'italic' && v.weight === 'normal'
            ),
            name: 'radio-group-style',
          },
          events: { change: _ => { style.next('italic'); weight.next('normal') } }
        }),
        ui5.radioButton({
          fields: {
            text: 'Bold',
            checked: styleWeight.derive(
              v => v.style === 'normal' && v.weight === 'bold'
            ),
            name: 'radio-group-style',
          },
          events: { change: _ => { style.next('normal'); weight.next('bold') } }
        }),
        ui5.radioButton({
          fields: {
            text: 'Bold Italic',
            checked: styleWeight.derive(
              v => v.style === 'italic' && v.weight === 'bold'
            ),
            name: 'radio-group-style',
          },
          events: { change: _ => { style.next('italic'); weight.next('bold') } }
        }),
      ]),

      h.section([
        ui5.title({ fields: { level: 'H6' }}, 'Size'),
        ui5.stepInput({ fields: {
          value: rx.bind(size),
          max: 100,
          min: 1,
        }}),
      ])

    ]
  }

  static styles = style.sheet({
    ':host': {
      display: 'flex',
      flexWrap: 'wrap',
    },
    'section': {
      margin: '10px',
    },
    'section > ui5-title': {
      marginBottom: '10px',
    },
    'section > ui5-radio-button': {
      display: 'block',
    }
  });

}

@Component.register
export class FontPickerToolbarButton extends Component {

  props = {
    family: rx.prop<string>(),
    size: rx.prop<number>(),
  }

  render() {
    const api = this.getContext(ApiCtx);

    // local while editing
    const localCfg = new rx.State(api.getFont());

    const dialog = this.getContext(BasicDialogManagerContext);

    const openDialog = () => dialog.openDialog(close => ({
      heading: 'Pick a Font',
      content: [
        FontPicker.t({
          props: {
            family: rx.bind(localCfg.partial('family')),
            size: rx.bind(localCfg.partial('size')),
            style: rx.bind(localCfg.partial('style')),
            weight: rx.bind(localCfg.partial('weight')),
          }
        })
      ],
      buttons: [
        {
          name: 'Save', design: 'Emphasized', action: () => {
            api.setFont(DSUtils.copyObj(localCfg.value));
            close();
          }
        },
        {
          name: 'Cancel', design: 'Default', action: () => {
            close();
          }
        },
      ],
    }));

    return [
      h.button({
        fields: { title: 'Pick Font' },
        events: {
          click: _ => {
            localCfg.next(api.getFont());
            openDialog();
          }
        },
        style: {
          fontFamily: this.props.family,
        }
      }, [
        h.span(this.props.family),
        h.span(' '),
        h.span(this.props.size),
      ]),
    ]
  }

  static styles = [
    ...style.sheet(toolbarButtonStyle),
    ...style.sheet({
      'button': {
        width: 'auto',
      }
    })
  ];
}

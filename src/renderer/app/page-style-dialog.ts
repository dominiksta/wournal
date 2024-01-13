import { Component, h, rx, style } from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { OpenDialog } from "common/dialog-manager";
import { BackgroundStyle, BackgroundStyleT } from "document/BackgroundGenerators";
import { PagePDFMode, PageProps } from "document/WournalPage";
import { MM_TO_PIXEL, WournalPageSize, WournalPageSizeName, WournalPageSizes } from "document/WournalPageSize";
import { DSUtils } from "util/DSUtils";

export function pageStyleDialog(
  openDialog: OpenDialog,
  current: PageProps,
): Promise<PageProps | undefined> {
  const state = new rx.State(DSUtils.copyObj(current));

  return new Promise(resolve => {
    openDialog(_close => ({
      heading: 'Set Page Properties',
      content: [
        PageStyleDialog.t({
          props: {
            style: rx.bind(state.partial('backgroundStyle')),
            color: rx.bind(state.partial('backgroundColor')),
            width: rx.bind(state.partial('width')),
            height: rx.bind(state.partial('height')),
            pdfMode: rx.bind(state.partial('pdfMode')),
          }
        })
      ],
      buttons: [
        {
          name: 'OK', design: 'Emphasized', action: () => {
            resolve(state.value);
          }
        },
        {
          name: 'Cancel', design: 'Default', action: () => {
            resolve(undefined);
          }
        },
      ],
    }))
  });
}

@Component.register
export class PageStyleDialog extends Component {
  props = {
    style: rx.prop<BackgroundStyleT>(),
    color: rx.prop<string>(),
    width: rx.prop<number>(),
    height: rx.prop<number>(),
    pdfMode: rx.prop<PagePDFMode>(),
  }

  render() {
    const { style, color, width, height, pdfMode } = this.props;

    const defaultColors = [ // stolen from xournal++
      '#FFFFFF', // white
      '#000000', // black
      '#DADCDA', // gray
      '#F8EAD3', // brown
      '#E6D8E4', // purple
      '#D4E2F0', // blue
      '#DCF6C1', // green
      '#FEF8C9', // yellow
      '#FEE7C4', // orange
      '#FABEBE', // red
    ];

    const backgroundStyles = [ 'blank', 'graph', 'ruled', 'pdf' ] as const;

    const styleNames = {
      blank: 'Blank', graph: 'Graph', ruled: 'Ruled', pdf: 'PDF',
    }

    const dimensionNames: { [K in WournalPageSizeName]: string } = {
      DINA4: 'DIN A4',
      DINA5: 'DIN A5',
    }

    const dimension = rx.derive(
      width, height, (width, height) => ({ width, height })
    );
    const orientation = rx.derive(
      width, height,
      (width, height) => height > width ? 'vertical' : 'horizontal'
    );
    const isAnnotatingPDF = pdfMode.derive(m => m !== undefined);

    const styleOrPDF = rx.derive(style, isAnnotatingPDF, (s, p) => p ? 'pdf' : s);

    const setOrientation = (o: 'vertical' | 'horizontal') => {
      if (orientation.value !== o) {
        const oldWidth = width.value, oldHeight = height.value;
        width.next(oldHeight);
        height.next(oldWidth);
      }
    };
    const dimensionMatchesPreset = (preset: { width: number, height: number }) => {
      const or = orientation.value;
      const dim = dimension.value;
      return (
        or === 'vertical' &&
        dim.height === preset.height && dim.width === preset.width
      )
        ||
        (
          or === 'horizontal' &&
          dim.height === preset.width && dim.width === preset.height
        )
    }

    const dimensionMatchingPreset: rx.DerivedState<WournalPageSizeName | 'user'>
      = rx.derive(dimension, orientation, () => {
        const found =
          WournalPageSizes.find(p => dimensionMatchesPreset(WournalPageSize[p]));
        return found ?? 'user';
      });

    return [
      h.section([
        ui5.title({ fields: { level: 'H6' } }, 'Style'),
        ...backgroundStyles.map(name => ui5.radioButton({
          fields: {
            name: 'radio-group-style',
            checked: styleOrPDF.derive(s => s === name),
            text: styleNames[name],
          },
          style: {
            display: styleOrPDF.derive(
              s => (name === 'pdf' && s !== 'pdf') ? 'none' : 'block'
            ),
          },
          events: {
            change: _ => {
              if (name !== 'pdf') {
                pdfMode.next(undefined);
                style.next(name);
              }
            }
          }
        }))
      ]),
      h.section({ fields: { hidden: isAnnotatingPDF }}, [
        ui5.title({ fields: { level: 'H6' } }, 'Color'),
        ui5.colorPalette({
          events: {
            'item-click': c => {
              color.next(c.detail.color);
            },
          },
        }, [
          ...defaultColors.map(defaultColor => ui5.colorPaletteItem({
            fields: { value: defaultColor },
            style: {
              outline: color.derive(
                c => c === defaultColor
                  ? `2px solid ${ui5.Theme.Button_Active_BorderColor}`
                  : ''
              ),
            }
          }))
        ]),
      ]),
      h.section([
        ui5.title({ fields: { level: 'H6' } }, 'Dimensions'),
        h.table([
          h.tr([
            h.td(ui5.label({ fields: { for: 'select-preset' }, }, 'Preset')),
            h.td(ui5.select(
              {
                fields: {
                  disabled: isAnnotatingPDF,
                },
                events: {
                  change: e => {
                    const n = e.detail.selectedOption.value as
                      WournalPageSizeName | 'user';
                    if (n === 'user') return;
                    if (orientation.value === 'vertical') {
                      height.next(WournalPageSize[n].height);
                      width.next(WournalPageSize[n].width);
                    } else {
                      height.next(WournalPageSize[n].width);
                      width.next(WournalPageSize[n].height);
                    }
                  }
                }
              },
              [
                ui5.option({
                  fields: {
                    disabled: isAnnotatingPDF,
                    value: 'user',
                    selected: dimensionMatchingPreset.derive(p => p === 'user'),
                  }
                }, 'Custom'),
                ...WournalPageSizes.map(name => ui5.option({
                  fields: {
                    value: name,
                    selected: dimensionMatchingPreset.derive(p => p === name),
                  }
                }, dimensionNames[name])),
              ]))
          ]),
          h.tr([
            h.td(ui5.label({ fields: { for: 'input-width' }, }, 'Width')),
            h.td(ui5.stepInput({
              fields: {
                id: 'input-width', min: 0, valuePrecision: 2,
                disabled: isAnnotatingPDF,
                value: rx.bind(width.createLinked(
                  (val) => val / MM_TO_PIXEL / 10,
                  (val, next) => next(val * MM_TO_PIXEL * 10)
                )),
              },
              style: { width: '130px' },
            }))
          ]),
          h.tr([
            h.td(ui5.label({ fields: { for: 'input-height' }, }, 'Height')),
            h.td(ui5.stepInput({
              fields: {
                id: 'input-height', min: 0, valuePrecision: 2,
                disabled: isAnnotatingPDF,
                value: rx.bind(height.createLinked(
                  (val) => val / MM_TO_PIXEL / 10,
                  (val, next) => next(val * MM_TO_PIXEL * 10)
                )),
              },
              style: { width: '130px' },
            }))
          ]),
        ]),
        h.div([
          ui5.radioButton({
            fields: {
              text: 'Vertical',
              checked: orientation.derive(o => o === 'vertical'),
              disabled: isAnnotatingPDF,
            },
            events: { change: _ => { setOrientation('vertical') } },
          }),
          ui5.radioButton({
            fields: {
              text: 'Horizontal',
              checked: orientation.derive(o => o === 'horizontal'),
              disabled: isAnnotatingPDF,
            },
            events: { change: _ => { setOrientation('horizontal') } },
          }),
        ])
      ]),
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

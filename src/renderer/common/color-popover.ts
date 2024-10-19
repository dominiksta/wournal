import { Component, style, rx, h, TemplateElementChild } from '@mvuijs/core';
import * as ui5 from '@mvuijs/ui5';
import { theme } from 'global-styles';
import { BasicDialogManagerContext, DialogButtons } from './dialog-manager';

export type ColorDef = { name: string, color: string };
export type ColorPalette = ColorDef[];

export type PopoverPlacementType = 'Left' | 'Right' | 'Top' | 'Bottom';

const colorHtmlId = (color: string) => `color-${color.slice(1)}`;

@Component.register
export default class ColorPopover extends Component<{
  events: {
    'color-selected': CustomEvent<ColorDef>,
    'after-close': CustomEvent<void>,
  },
}> {
  props = {
    placementType: rx.prop<PopoverPlacementType>({ defaultValue: 'Bottom' }),
    palette: rx.prop<ColorPalette>(),
    currentColor: rx.prop<string | undefined>(),
  }

  showAt(el: HTMLElement) { this.popoverRef.current.showAt(el); }
  get open() { return this.popoverRef.current.open }
  close() { return this.popoverRef.current.close() }

  private popoverRef = this.ref<ui5.types.Popover>();
  private editing = new rx.State(false);

  render() {
    const { palette, placementType, currentColor } = this.props;
    const dlg = this.getContext(BasicDialogManagerContext);

    const openColorPickerDialog = async (
      color: ColorDef, showDeleteBtn: boolean,
    ): Promise<'delete' | 'cancel' | ColorDef> => {
      const colorPickerColor = new rx.State<ColorDef>({...color});
      return new Promise(resolve => {
        dlg.openDialog(close => {
          const dlgButtons: DialogButtons = [
            {
              name: 'Cancel',
              action: () => { resolve('cancel'); close(); },
            },
            {
              name: 'Ok',
              design: 'Emphasized',
              action: () => {
                resolve({ ...colorPickerColor.value });
                close();
              },
            },
          ];
          if (showDeleteBtn) dlgButtons.unshift({
            name: 'Delete Color',
            design: 'Negative',
            action: () => { resolve('delete'); close(); },
            icon: 'delete',
          });
          return {
            heading: '',
            buttons: dlgButtons,
            onCloseNoBtn: () => resolve('cancel'),
            content: [
              h.section(
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }
                },
                [
                  ui5.input({
                    fields: {
                      value: rx.bind(colorPickerColor.partial('name')),
                      placeholder: 'Name Color',
                    }
                  }),
                  ui5.colorPicker({
                    fields: {
                      color: rx.bind(colorPickerColor.partial('color')),
                    }
                  }),
                ])
            ]

          }
        })
      })
    };

    const colorButton = (
      color: ColorDef, isCurrent: rx.Stream<boolean>,
    ): TemplateElementChild => {
      return h.div([
        ui5.button(
          {
            fields: {
              className: 'btn-color',
              title: color.name,
              id: colorHtmlId(color.color),
              design: isCurrent.ifelse({ if: 'Default', else: 'Transparent' }),
            },
            events: {
              click: async _ => {
                if (this.editing.value) {
                  const resp = await openColorPickerDialog(color, true);
                  const i = palette.value.indexOf(color);
                  if (resp === 'cancel') return;
                  if (resp === 'delete') {
                    palette.next(p => [...p.slice(0, i), ...p.slice(i+1)])
                    return;
                  }
                  palette.next(p => [...p.slice(0, i), resp, ...p.slice(i+1)]);
                } else {
                  this.dispatch('color-selected', color);
                  this.popoverRef.current.open = false;
                }
              }
            }
          }, [
          h.span(
            {
              fields: { className: 'btn-color-color' },
              style: {
                color: color.color,
                backgroundColor: color.color,
              },
            },
          ),
          h.span(
            {
              fields: { className: 'btn-color-name' },
              style: {
                color: this.editing.ifelse({
                  if: ui5.Theme.Button_Attention_TextColor,
                  else: ui5.Theme.Button_TextColor,
                })
              },
            },
            color.name
          ),
        ],
        ),
      ]);
    }

    return [
      ui5.popover(
        {
          ref: this.popoverRef,
          fields: {
            headerText: 'Color', placementType,
            id: 'popover',
            initialFocus:
              currentColor.derive(cc => cc === undefined ? '' : colorHtmlId(cc)),
          },
          events: {
            'after-close': e => {
              this.editing.next(false);
              this.reDispatch('after-close', e);
            }
          }
        },
        [
          h.section(
            { fields: { id: 'palette' } },
            palette.derive(p => p.map(col => colorButton(
              col, currentColor.derive(cc => cc === col.color)
            ))),
          ),
          h.section(
            { slot: 'footer', fields: { id: 'footer-buttons' } },
            [
              ui5.button({
                fields: { icon: 'edit', design: this.editing.ifelse({
                  if: 'Attention', else: 'Default'
                })},
                style: { marginRight: '.3em' },
                events: {
                  click: _ => this.editing.next(e => !e),
                }
              }, this.editing.ifelse({if: 'Finish Edits', else: 'Edit'})),
              ui5.button({
                fields: { icon: 'add' },
                events: {
                  click: async _ => {
                    this.editing.next(false);
                    const resp =
                      await openColorPickerDialog({ name: '', color: '#000000' }, false);
                    if (resp === 'cancel' || resp === 'delete') return;
                    palette.next(p => [...p, resp]);
                  },
                }
              }, 'Add Color'),
            ]
          )
        ]
      ),

    ];
  }

  static styles = style.sheet({
    '#popover': {
      width: '18em !important',
    },
    '#palette': {
      display: 'grid',
      gridTemplateColumns: '8em 8em',
      justifyContent: 'center',
    },
    '#footer-buttons': {
      display: 'flex',
      justifyContent: 'flex-end',
      width: '100%',
      alignItems: 'center',
      padding: '0.5rem 0',
    },
    '.btn-color': {
      height: '3em',
    },
    '.btn-color-color': {
      margin: '.3em',
      height: '2em',
      width: '2em',
      borderRadius: '50%',
      border: `1px solid ${ui5.Theme.Button_BorderColor}`,
      background: 'transparent',
      filter: theme.invert,
      display: 'inline-block',
      verticalAlign: 'middle',
    },
    '.btn-color-name': {
      display: 'inline-block',
      verticalAlign: 'middle',
      marginLeft: '.3em',
    },
  });

}

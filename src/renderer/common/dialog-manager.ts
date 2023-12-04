import {
  Component, ComponentTemplateElement, h, rx, style, TemplateElementChild
} from "@mvui/core";
import * as ui5 from "@mvui/ui5";

type ButtonDesign =
  'Default' | 'Positive' | 'Negative' | 'Transparent' | 'Emphasized' | 'Attention';

type DialogButtons = {
  name: string, action: () => void,
  design?: ButtonDesign
}[];

export type OpenDialog = (decl: (close: () => void) => {
  content: TemplateElementChild,
  heading: TemplateElementChild,
  buttons: DialogButtons,
}) => void;

export const BasicDialogManagerContext = new rx.Context<{
  openDialog: OpenDialog;
  promptYesOrNo(
    heading: TemplateElementChild,
    content?: TemplateElementChild,
  ): Promise<boolean>;
  promptInput(
    heading: TemplateElementChild,
    content?: TemplateElementChild,
  ): Promise<string | undefined>;
  dialogs: rx.State<ComponentTemplateElement<BasicDialog>[]>;
}>(mkDialogManagerCtx);

let DIALOG_COUNTER = 1;
function newDialogId(): number { return DIALOG_COUNTER++; }

@Component.register
export class BasicDialog extends Component<{
  slots: { default: any },
  events: { close: CustomEvent }
}> {
  props = {
    heading: rx.prop<TemplateElementChild>(),
    num: rx.prop<number>(),
    buttons: rx.prop<DialogButtons>({ optional: true }),
  }

  render() {
    const { buttons, heading } = this.props;

    const buttonTemplate = buttons.derive(btns => {
      if (btns.length === 0 || !btns) return [
        ui5.button({
          events: {
            click: _ => {
              dialogRef.current.close();
            }
          }
        }, 'Close')
      ]
      return btns.map(btn => ui5.button({
        fields: { design: btn.design },
        events: {
          click: _ => {
            dialogRef.current.close();
            btn.action();
          }
        }
      }, btn.name))
    })

    const dialogRef = this.ref<ui5.types.Dialog>();
    this.onRendered(() => dialogRef.current.show());

    return [
      ui5.dialog({
        ref: dialogRef,
        fields: {
          headerText: heading.derive(
            h => typeof (h) === 'string' ? h : undefined
          ),
        },
        slots: {
          footer: h.div({ fields: { id: 'footer' } }, buttonTemplate),
          header: heading.derive(
            h => typeof(h) === 'string' ? undefined : h
          ),
        },
        events: {
          'after-close': _ => {
            this.dispatch('close', new CustomEvent('close'));
          }
        }
      }, h.slot())
    ]
  }

  static styles = style.sheet({
    '#footer': {
      width: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    '#footer > ui5-button': {
      margin: '3px',
    }
  });
}

function mkDialogManagerCtx() {
  const dialogs = new rx.State<ComponentTemplateElement<BasicDialog>[]>([]);
  const mkCloseDialog = (num: number) => () => {
    dialogs.next(dialogs => dialogs.filter(d => d.params.props.num !== num));
  }

  const openDialog = (
    decl: (close: () => void) => {
      heading: TemplateElementChild,
      content: TemplateElementChild,
      buttons: DialogButtons,
    }
  ) => {
    const num = newDialogId();
    const close = mkCloseDialog(num);
    const { heading, content, buttons } = decl(close);
    const dialog = BasicDialog.t({
      props: {
        heading, buttons, num
      },
      events: { close }
    }, content);
    dialogs.next(d => [...d, dialog]);
  }

  return {
    openDialog,
    promptYesOrNo: mkPromptYesOrNo(openDialog),
    promptInput: mkPromptInput(openDialog),
    dialogs,
  };
}

@Component.register
export class BasicDialogManager extends Component<{
  slots: { default: any }
}> {

  render() {
    const dialogs = new rx.State<ComponentTemplateElement<BasicDialog>[]>([]);
    const mkCloseDialog = (num: number) => () => {
      dialogs.next(dialogs => dialogs.filter(d => d.params.props.num !== num));
    }

    const openDialog = (
      decl: (close: () => void) => {
        heading: TemplateElementChild,
        content: TemplateElementChild,
        buttons: DialogButtons,
      }
    ) => {
      const num = newDialogId();
      const { heading, content, buttons } = decl(mkCloseDialog(num));
      const dialog = BasicDialog.t({
        props: {
          heading, buttons, num
        },
        events: {
          close: mkCloseDialog(num),
        }
      }, content);
      dialogs.next(d => [...d, dialog]);
    }

    this.provideContext(BasicDialogManagerContext, {
      openDialog,
      promptYesOrNo: mkPromptYesOrNo(openDialog),
      promptInput: mkPromptInput(openDialog),
      dialogs,
    });

    return [
      h.slot(),
      h.div(dialogs)
    ];
  }
}


const mkPromptYesOrNo = (openDialog: OpenDialog) => (
  heading: TemplateElementChild, content?: TemplateElementChild
) => {
  return new Promise<boolean>((resolve) => {
    openDialog(close => ({
      content, heading,
      buttons: [
        {
          name: 'Yes', design: 'Positive', action: () => {
            resolve(true); close();
          }
        },
        {
          name: 'No', design: 'Negative', action: () => {
            resolve(false); close();
          }
        },
      ]
    }));
  });
}

const mkPromptInput = (openDialog: OpenDialog) => (
  heading: TemplateElementChild, content?: TemplateElementChild
) => {
  const value = new rx.State('');
  return new Promise<string | undefined>((resolve) => {
    openDialog(close => ({
      heading,
      content: [
        h.div(content),
        ui5.input({
          fields: { value: rx.bind(value) },
          events: {
            keypress: e => {
              if (e.key === 'Enter') {
                resolve(value.value); close();
              }
            }
          }
        }),
      ],
      buttons: [
        {
          name: 'OK', design: 'Emphasized', action: () => {
            resolve(value.value); close();
          }
        },
        {
          name: 'Cancel', design: 'Default', action: () => {
            resolve(undefined); close();
          }
        },
      ]
    }));
  });
}

import {
  Component, ComponentTemplateElement, h, rx, style, TemplateElementChild
} from "@mvui/core";
import * as ui5 from "@mvui/ui5";
import { DSUtils } from "util/DSUtils";
import { getLogger } from "util/Logging";

const LOG = getLogger(__filename);

type ButtonDesign =
  'Default' | 'Positive' | 'Negative' | 'Transparent' | 'Emphasized' | 'Attention';

type DialogButtons = {
  name: string, action: () => void,
  design?: ButtonDesign, icon?: string,
}[];

export type OpenDialog = (decl: (close: () => void) => {
  content: TemplateElementChild,
  heading: TemplateElementChild,
  buttons: DialogButtons,
  state?: ui5.types.Dialog['state'],
  maxWidth?: string,
}) => void;

export const BasicDialogManagerContext = new rx.Context<{
  openDialog: OpenDialog;
  promptYesOrNo(
    heading: TemplateElementChild,
    content?: TemplateElementChild,
    state?: ui5.types.Dialog['state'],
    maxWidth?: string,
  ): Promise<boolean>;
  promptInput(
    heading: TemplateElementChild,
    content?: TemplateElementChild,
    state?: ui5.types.Dialog['state'],
    maxWidth?: string,
  ): Promise<string | undefined>;
  infoBox(
    heading: TemplateElementChild,
    content: TemplateElementChild,
    state?: ui5.types.Dialog['state'],
    maxWidth?: string,
  ): void;
  pleaseWait(
    heading: TemplateElementChild,
    content?: TemplateElementChild,
    maxWidth?: string,
  ): () => void;
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
    state: rx.prop<ui5.types.Dialog['state']>({ defaultValue: 'None' }),
    maxWidth: rx.prop<string>({ defaultValue: 'auto' }),
  }

  render() {
    const { buttons, heading, state, maxWidth } = this.props;

    LOG.info(`showing dialog with heading ${DSUtils.trySerialize(heading)}`);

    const buttonTemplate = buttons.derive(btns => {
      if (btns === undefined) return [
        ui5.button({
          events: {
            click: _ => {
              dialogRef.current.close();
            }
          }
        }, 'Close')
      ]
      return btns.map(btn => ui5.button({
        fields: { design: btn.design, icon: btn.icon ?? null },
        events: {
          click: _ => {
            dialogRef.current.close();
            btn.action();
          }
        }
      }, btn.name))
    })

    const dialogRef = this.ref<ui5.types.Dialog>();
    this.onRendered(() => {
      dialogRef.current.show()
    });

    return [
      ui5.dialog({
        ref: dialogRef,
        fields: {
          headerText: heading.derive(
            h => typeof (h) === 'string' ? h : undefined
          ),
          state,
        },
        style: { maxWidth },
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

export function mkDialogManagerCtx() {
  const dialogs = new rx.State<ComponentTemplateElement<BasicDialog>[]>([]);
  const mkCloseDialog = (num: number) => () => {
    dialogs.next(dialogs => dialogs.filter(d => d.params.props.num !== num));
  }

  const openDialog = (
    decl: (close: () => void) => {
      heading: TemplateElementChild,
      content: TemplateElementChild,
      buttons: DialogButtons,
      state?: ui5.types.Dialog['state'],
      maxWidth?: string,
    }
  ) => {
    const num = newDialogId();
    const close = mkCloseDialog(num);
    const { heading, content, buttons, state, maxWidth } = decl(close);
    LOG.info(`Opening dialogue with heading '${heading}'`);
    const dialog = BasicDialog.t({
      props: { heading, buttons, num, state, maxWidth },
      events: { close }
    }, content);
    dialogs.next(d => [...d, dialog]);
  }

  return {
    openDialog,
    promptYesOrNo: mkPromptYesOrNo(openDialog),
    promptInput: mkPromptInput(openDialog),
    infoBox: mkInfoBox(openDialog),
    pleaseWait: mkPleaseWait(openDialog),
    dialogs,
  };
}

const mkInfoBox = (openDialog: OpenDialog) => (
  heading: TemplateElementChild,
  content: TemplateElementChild,
  state?: ui5.types.Dialog['state'],
  maxWidth?: string,
) => {
  openDialog(close => ({
    content, heading, state, maxWidth,
    buttons: [
      {
        name: 'OK', design: 'Default', action: () => {
          close();
          LOG.info('InfoBox acknowledged');
        }
      },
    ]
  }));
}

const mkPromptYesOrNo = (openDialog: OpenDialog) => (
  heading: TemplateElementChild,
  content?: TemplateElementChild,
  state?: ui5.types.Dialog['state'],
  maxWidth?: string,
) => {
  return new Promise<boolean>((resolve) => {
    openDialog(close => ({
      content, heading, state, maxWidth,
      buttons: [
        {
          name: 'Yes', design: 'Positive', action: () => {
            resolve(true); close();
            LOG.info('YesOrNo confirmed');
          }
        },
        {
          name: 'No', design: 'Negative', action: () => {
            resolve(false); close();
            LOG.info('YesOrNo denied');
          }
        },
      ]
    }));
  });
}

const mkPromptInput = (openDialog: OpenDialog) => (
  heading: TemplateElementChild,
  content?: TemplateElementChild,
  state?: ui5.types.Dialog['state'],
  maxWidth?: string,
) => {
  const value = new rx.State('');
  return new Promise<string | undefined>((resolve) => {
    openDialog(close => ({
      heading, state, maxWidth,
      content: [
        h.div(content),
        ui5.input({
          fields: { value: rx.bind(value) },
          events: {
            keypress: e => {
              if (e.key === 'Enter') {
                resolve(value.value); close();
                LOG.info(`Input dialog submitted with value '${value.value}'`);
              }
            }
          }
        }),
      ],
      buttons: [
        {
          name: 'OK', design: 'Emphasized', action: () => {
            resolve(value.value); close();
            LOG.info(`Input dialog submitted with value '${value.value}'`);
          }
        },
        {
          name: 'Cancel', design: 'Default', action: () => {
            resolve(undefined); close();
            LOG.info(`Input dialog cancelled (with value '${value.value}')`);
          }
        },
      ]
    }));
  });
}

const mkPleaseWait = (openDialog: OpenDialog) => (
  heading: TemplateElementChild,
  content?: TemplateElementChild,
  state?: ui5.types.Dialog['state'],
  maxWidth?: string,
) => {
  LOG.info(`PleaseWait opened`);
  let _close: () => void;
  openDialog(close => {
    _close = () => {
      LOG.info(`PleaseWait closed`);
      close();
    };
    return {
      heading, maxWidth,
      state: state ?? 'Information',
      content: content ?? ui5.busyIndicator({
        fields: { size: 'Medium', active: true, delay: 0 }
      }),
      buttons: [],
    }
  });
  return _close;
}

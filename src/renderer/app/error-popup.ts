import { Component, h, rx, style } from '@mvui/core';
import * as ui5 from '@mvui/ui5';
import environment from 'environment';
import PackageJson from 'PackageJson';
import { getLogHistory } from 'util/Logging';

@Component.register
export class ErrorPopup extends Component {

  private readonly dialogRef = this.ref<ui5.types.Dialog>();
  private readonly error = new rx.State<any>(null);

  show(error: any) {
    this.error.next(error);
    console.log(this.dialogRef.current);
    if (!this.dialogRef.current && window.alert) {
      alert('Uncaught Exception. Could not Display: \n' + errorDetails(error));
    } else {
      this.dialogRef.current.show();
    }
  }

  render() {
    const link = (url: string, text?: string) =>
      h.a({ fields: { href: url, target: '_blank' } }, text ?? url);

    this.setAttribute('data-ui5-compact-size', 'true');

    const displayCopied = new rx.State(false);
    const errString = this.error.derive(errorDetails);

    return [
      ui5.dialog({
        ref: this.dialogRef,
        fields: {
          headerText: 'This should not have happened',
          state: 'Error',
          initialFocus: 'button-ok',
        },
        slots: {
          footer: h.div(
            { fields: { id: 'footer' } },
            [
              ui5.button(
                {
                  fields: { design: 'Emphasized', id: 'button-ok', },
                  events: { click: _ => { this.dialogRef.current.close(); } }
                },
                'Close'
              ),
            ]
          ),
        }
      }, [
        h.p([
          'An unexpected error has occurred. This is likely the cause of a bug',
          ' in Wournal.'
        ]),
        h.p([
          'Internal error message: ',
          h.b(this.error.derive(
            e => e instanceof Error ? `${e.name}: ${e.message}` : '<None>'
          )),
        ]),
        h.p([
          'You may report this error at ', link(PackageJson.bugs.url),
          '. Please check that the error has not been reported before posting. ',
          'We appreciate your assistance.'
        ]),
        h.section(
          { fields: { id: 'section-copy' } },
          [
            h.i(
              { fields: { hidden: displayCopied.derive(v => !v) } },
              'Copied '
            ),
            ui5.button(
              {
                fields: { icon: 'copy', id: 'button-copy' },
                events: {
                  click: async _ => {
                    displayCopied.next(false);
                    await new Promise(requestAnimationFrame);
                    displayCopied.next(true);
                    navigator.clipboard.writeText(errString.value);
                    setTimeout(() => {
                      displayCopied.next(false);
                    }, 1000);
                  }
                }
              },
              'Copy Internal Error Details to Clipboard'
            ),
          ]
        ),
        ui5.panel(
          {
            fields: {
              headerText: 'Internal Error Details', collapsed: environment.production
            }
          },
          h.p({ fields: { id: 'error-details' } }, errString)
        )
      ])
    ]
  }

  static styles = style.sheet({
    'ui5-dialog': {
      maxWidth: '800px',
    },
    '#section-copy': {
      textAlign: 'right',
    },
    '#error-details': {
      fontFamily: 'monospace',
      whiteSpace: 'pre',
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
  });

}

const trySerialize = (data: any): string | '<Not Serializable>' => {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return '<Not Serializable>';
  }
}

const checkSerialize = <T>(data: T): T | '<Not Serializable>' => {
  try {
    JSON.stringify(data);
    return data;
  } catch {
    return '<Not Serializable>';
  }
}

const prettyStack = (stack: any) => {
  try {
    return stack.split('\n');
  } catch {
    return stack;
  }
}

function errorDetails(error: any): string {
  let ret: any = {};

  try {
    ret['buildInfo'] = {
      wournalVersion: PackageJson.version,
      gitVersion: environment.gitVersion,
      buildTime: environment.buildTime,
      production: environment.production,
      userAgent: navigator.userAgent,
    };
  } catch { }

  try {
    if (error === null || error === undefined)
      ret['error'] = `Empty Error ${error}`;

    if (typeof error === 'object') {
      ret['error'] = {};
      if (error instanceof Error) {
        ret['error']['name'] = error.name;
        ret['error']['constructor'] = error.constructor.name;
        ret['error']['message'] = error.message;
        ret['error']['cause'] = error.cause;
        ret['error']['stack'] = prettyStack(error.stack);
      }
      for (const key of Object.keys(error)) {
        ret['error'][key] = checkSerialize((error as any)[key]);
      }
    } else {
      ret['error'] = checkSerialize(error);
    }
  } catch { }

  try {
    ret['logs'] = getLogHistory().map(
      l => `${l.time} [${l.level}]: ${trySerialize(l.msg)}` +
        (l.data !== undefined ? ` -- ${trySerialize(l.data)}` : '')
    );
  } catch {
    ret['logs'] = '<Could Not Get Logs>';
  }

  return trySerialize(ret);
}

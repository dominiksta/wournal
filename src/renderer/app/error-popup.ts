import { Component, h, rx, style } from '@mvui/core';
import * as ui5 from '@mvui/ui5';
import environment from 'environment';
import PackageJson from 'PackageJson';
import { DSUtils } from 'util/DSUtils';
import { getLogHistoryText } from 'util/Logging';
import * as ErrorStackParser from 'error-stack-parser';
import { SourceMapConsumer } from 'source-map';

(SourceMapConsumer as any).initialize({
  'lib/mappings.wasm': 'res/source-map/mappings.wasm'
});

async function getMainSourceMap(): Promise<SourceMapConsumer> {
  const map = await (await fetch('script/main.js.map')).text();
  return new Promise(resolve => {
    SourceMapConsumer.with(map, null, consumer => resolve(consumer));
  })
}

let mainSourceMap: SourceMapConsumer | undefined = undefined;

@Component.register
export class ErrorPopup extends Component {

  private readonly dialogRef = this.ref<ui5.types.Dialog>();
  private readonly error = new rx.State<any>(null);

  constructor() {
    super();
    if (!mainSourceMap) getMainSourceMap().then(map => mainSourceMap = map);
  }

  async show(error: any) {
    this.error.next(error);
    try {
      await new Promise(requestAnimationFrame);
      this.dialogRef.current.show();
    } catch {
      alert('Uncaught Exception. Could not Display: \n' + errorDetails(error));
    }
  }

  render() {
    const link = (url: string, text?: string) =>
      h.a({ fields: { href: url, target: '_blank' } }, text ?? url);

    this.setAttribute('data-ui5-compact-size', 'true');

    const displayCopied = new rx.State(false, 'ErrorPopup:displayCopied');
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
      wordBreak: 'break-all',
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

const prettyStack = (stack: any) => {
  try {
    return stack.split('\n');
  } catch {
    return stack;
  }
}

const parseMapStack = (e: Error) => {
  try {
    const stack = ErrorStackParser.parse(e);
    if (!mainSourceMap) return [
      '<Source map was not downloaded yet!>',
      ...stack.map(frame => frame.toString()),
    ];

    try {
      interface Pos {
        file: string,
        function: string,
        line?: number,
        column?: number,
      }

      const shortenFile = (f: string) =>
        f.startsWith('webpack://') ? f.slice(10) : f;

      const parsed: Pos[] = stack.map(frame => {
        if (frame.lineNumber && frame.columnNumber) {
          const mapped = mainSourceMap.originalPositionFor({
            line: frame.lineNumber,
            column: frame.columnNumber,
          });
          return {
            function: frame.functionName, file: shortenFile(mapped.source),
            column: mapped.column, line: mapped.line,
          };
        } else {
          return {
            function: frame.functionName, file: shortenFile(frame.fileName),
            line: undefined, column: undefined,
          };
        }
      });

      return parsed.map(pos => (
        `${pos.file} [${pos.function}] at ${pos.line ?? '?'}:${pos.column ?? '?'}`
      ));

    } catch {
      return [
        '<Could not map stack!>',
        ...stack.map(frame => frame.toString()),
      ];
    }

  } catch {
    return [ '<Could not parse stack!>', e.stack ];
  }
}

const { trySerialize, checkSerialize } = DSUtils;

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
        ret['error']['cause'] = checkSerialize(error.cause);
        ret['error']['stack'] = prettyStack(error.stack);
        ret['error']['stackParsed'] = parseMapStack(error);
      }
      for (const key of Object.keys(error)) {
        ret['error'][key] = checkSerialize((error as any)[key]);
      }
    } else {
      ret['error'] = checkSerialize(error);
    }
  } catch { }

  try {
    ret['logs'] = getLogHistoryText();
  } catch {
    ret['logs'] = '<Could Not Get Logs>';
  }

  return trySerialize(ret);
}

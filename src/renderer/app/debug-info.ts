import { Component, h, rx } from "@mvui/core";
import { OpenDialog } from "common/dialog-manager";
import * as ui5 from '@mvui/ui5';
import { getLogger, getLogHistoryText } from "util/Logging";
import environment from "Shared/environment";
import PackageJson from 'PackageJson';

const LOG = getLogger(__filename);

const trySerialize = (data: any): string | '<Not Serializable>' => {
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return '<Not Serializable>';
  }
}

export default function openSystemDebugInfo(openDialog: OpenDialog) {
  const displayCopied = new rx.State(false);

  const sysInfo = (withLogs = true) => JSON.stringify({
    buildInfo: {
      wournalVersion: PackageJson.version,
      gitVersion: environment.gitVersion,
      buildTime: environment.buildTime,
      production: environment.production,
      userAgent: navigator.userAgent,
    },
    logs: withLogs ? getLogHistoryText() : '<Omitted By User>',
  }, null, 2);

  openDialog(close => ({
    heading: 'System Debug Information',
    state: 'Information',
    maxWidth: '800px',

    content: [
      h.p([
        'The following information may be requested of you from maintainers of ',
        'Wournal for debugging purposes.'
      ]),
      h.p([
        'Note that the "logs" section ',
        h.b('may include text from the document you were editing'), '.',
        'If you wish to not disclose any such information, you ',
        'may copy this information without the logs included.'
      ]),
      h.section(
        {
          fields: { id: 'section-copy' },
          style: {
            textAlign: 'right',
          }
        },
        [
          h.i(
            { fields: { hidden: displayCopied.derive(v => !v) } },
            'Copied '
          ),
          ui5.button(
            {
              fields: {
                icon: 'copy',
                design: 'Emphasized',
              },
              events: {
                click: async _ => {
                  displayCopied.next(false);
                  await new Promise(requestAnimationFrame);
                  displayCopied.next(true);
                  navigator.clipboard.writeText(sysInfo());
                  setTimeout(() => {
                    displayCopied.next(false);
                  }, 1000);
                  LOG.info('System debug info copied to clipboard');
                }
              }
            },
            'Copy System Debug Info to Clipboard'
          ),
          ui5.button(
            {
              fields: { icon: 'copy' },
              events: {
                click: async _ => {
                  displayCopied.next(false);
                  await new Promise(requestAnimationFrame);
                  displayCopied.next(true);
                  navigator.clipboard.writeText(sysInfo(false));
                  setTimeout(() => {
                    displayCopied.next(false);
                  }, 1000);
                  LOG.info('System debug info copied to clipboard');
                }
              }
            },
            'Copy System Debug Info Without Logs'
          ),
        ]
      ),
      ui5.panel(
        { fields: { fixed: true } },
        h.p(
          { style: { fontFamily: 'monospace', whiteSpace: 'pre' } },
          sysInfo()
        )
      ),

      !environment.production && ui5.button(
        {
          fields: { design: 'Negative' },
          events: {
            click: () => {
              throw new Error('Error for Testing');
            }
          }
        },
        'Generate Error For Testing',
      )
    ],

    buttons: [{ name: 'Close', action: close }]
  }))
}

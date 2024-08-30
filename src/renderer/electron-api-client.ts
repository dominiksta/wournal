import { getLogger } from 'Shared/logging';
import { ApiRouteNames, ElectronApi } from '../main/api';
import environment from 'Shared/environment';

const LOG = getLogger(__filename);

export let ApiClient: ElectronApi = {} as any;

function registerDevToolsShortcut() {
  document.addEventListener('keyup', e => {
    if (!(e instanceof KeyboardEvent)) return;
    if (
      (e.shiftKey && e.ctrlKey && e.key === 'I') ||
      (e.shiftKey && e.ctrlKey && e.key === 'D') ||
      (e.ctrlKey && e.key === 'F12')
    )
      ApiClient['debug:showDevTools']();

    if (
      (e.ctrlKey && e.key === 'r' && !environment.production)
    ) {
      location.reload();
    }
  });
}

registerDevToolsShortcut();

function mkApiClient() {
  for (const routeName of ApiRouteNames) {
    ApiClient[routeName] = async (...args: any[]) => {
      try {
        const ret = await window.electron.invoke(routeName, ...args);
        LOG.debug(
          `Electron API call: ${routeName}\n`,
          [args, ret instanceof ArrayBuffer ? 'ArrayBuffer' : ret]
        );
        return ret;
      } catch(e) {
        LOG.warn(`Failed electron API call: ${routeName}\n`, [args]);
        throw e;
      }
    };
  }
}

mkApiClient();

import { ApiRouteNames, ElectronApi } from '../main/api';

export let ApiClient: ElectronApi = {} as any;

function registerDevToolsShortcut() {
  document.addEventListener('keypress', e => {
    if (e.shiftKey && e.ctrlKey && e.key === 'I')
      ApiClient['debug:showDevTools']();

    if (e.ctrlKey && e.key === 'r')
      location.reload();
  });
}

registerDevToolsShortcut();

function mkApiClient() {
  for (const routeName of ApiRouteNames) {
    ApiClient[routeName] = (...args: any[]) => {
      console.log(
        `Electron API call: ${routeName}\n`,
        args
      )
      return window.electronInvoke(routeName, ...args);
    };
  }
}

mkApiClient();

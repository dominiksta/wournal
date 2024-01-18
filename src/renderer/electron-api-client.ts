import { ApiRouteNames, ElectronApi } from '../main/api';

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
      (e.ctrlKey && e.key === 'r')
    ) {
      location.reload();
    }
  });
}

registerDevToolsShortcut();

function mkApiClient() {
  for (const routeName of ApiRouteNames) {
    ApiClient[routeName] = (...args: any[]) => {
      const promise = window.electron.invoke(routeName, ...args);
      promise.then((val: any) => {
        console.log(
          `Electron API call: ${routeName}\n`,
          args, '\n', val instanceof ArrayBuffer ? 'ArrayBuffer' : val
        )
      })
      return promise
    };
  }
}

mkApiClient();

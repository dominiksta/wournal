import type { ElectronCallbacks } from "../main/api";

type ElectronCallbackClient = {
  [channel in keyof ElectronCallbacks]: (
    callback: (args: [ ElectronCallbacks[channel] ]) => void
  ) => void;
}

declare global {
  interface Window {
    electron: {
      invoke: Function,
      on: ElectronCallbackClient,
    };
  }
}

export {};

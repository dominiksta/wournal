export type ApiSpec<Routes extends string> = {
  [key in Routes]: (...args: any[]) => Promise<any>
};

export const ApiRouteNames = [
  'debug:echo',
  'debug:showDevTools',
  'debug:binTest',

  'file:load',
  'file:loadPrompt',
  'file:save',
  'file:savePrompt',

  'process:argv',
] as const;

export type ApiRouteName = typeof ApiRouteNames[number];

export interface ElectronApi extends ApiSpec<ApiRouteName> {

  'debug:echo': (msg: string) => Promise<string>;
  'debug:showDevTools': () => Promise<void>;
  'debug:binTest': () => Promise<Uint8Array>;

  'file:load': (path: string) => Promise<ArrayBuffer>;
  'file:loadPrompt': () =>
    Promise<{ buf: ArrayBuffer, path: string } | undefined>;
  'file:save': (path: string, data: ArrayBuffer) => Promise<void>;
  'file:savePrompt': (data: ArrayBuffer, defaultPath?: string) => Promise<boolean>;

  'process:argv': () => Promise<string[]>;

}

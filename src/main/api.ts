export type ApiSpec<Routes extends string> = {
  [key in Routes]: (...args: any[]) => Promise<any>
};

export const ApiRouteNames = [
  'debug:echo',
  'debug:showDevTools',
  'debug:binTest',

  'file:read',
  'file:loadPrompt',
  'file:write',
  'file:savePrompt',

  'process:argv',

  'window:setTitle',
  'window:destroy',
] as const;

export type ApiRouteName = typeof ApiRouteNames[number];

type Filters = { extensions: string[], name: string }[];

export interface ElectronApi extends ApiSpec<ApiRouteName> {

  'debug:echo': (msg: string) => Promise<string>;
  'debug:showDevTools': () => Promise<void>;
  'debug:binTest': () => Promise<Uint8Array>;

  'file:read': (path: string) => Promise<ArrayBuffer>;
  'file:loadPrompt': (filters?: Filters) => Promise<string | false>;
  'file:write': (path: string, data: ArrayBuffer) => Promise<void>;
  'file:savePrompt': (
    defaultPath?: string, filters?: Filters
  ) => Promise<string | false>;

  'process:argv': () => Promise<string[]>;

  'window:setTitle': (title: string) => Promise<void>;
  'window:destroy': () => Promise<void>;

}

export const ElectronCallbackNames = [
  'window:close'
] as const;

export interface ElectronCallbacks {

  'window:close': { },

}

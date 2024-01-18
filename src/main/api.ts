import type { ArgvParsed } from "./argv";

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
  'file:exists',

  'process:argv',

  'window:setTitle',
  'window:destroy',

  'clipboard:writeWournal',
  'clipboard:readText',
  'clipboard:readImage',
  'clipboard:readWournal',
] as const;

export type ApiRouteName = typeof ApiRouteNames[number];

type Filters = { extensions: string[], name: string }[];

export interface ElectronApi extends ApiSpec<ApiRouteName> {

  'debug:echo': (msg: string) => Promise<string>;
  'debug:showDevTools': () => Promise<void>;
  'debug:binTest': () => Promise<Uint8Array>;

  'file:read': (path: string) => Promise<ArrayBuffer | false>;
  'file:loadPrompt': (filters?: Filters) => Promise<string | false>;
  'file:write': (path: string, data: ArrayBuffer) => Promise<void>;
  'file:savePrompt': (
    defaultPath?: string, filters?: Filters
  ) => Promise<string | false>;
  'file:exists': (path: string) => Promise<boolean>;

  'process:argv': () => Promise<ArgvParsed>;

  'window:setTitle': (title: string) => Promise<void>;
  'window:destroy': () => Promise<void>;

  'clipboard:writeWournal': (data: any) => Promise<void>;
  'clipboard:readText': () => Promise<string | false>;
  'clipboard:readImage': () => Promise<string | false>;
  'clipboard:readWournal': () => Promise<any | false>;

}

export const ElectronCallbackNames = [
  'window:close'
] as const;

export interface ElectronCallbacks {

  'window:close': { },

}

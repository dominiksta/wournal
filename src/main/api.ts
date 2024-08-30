import type { ArgvParsed } from "./argv";

export type ApiSpec<Routes extends string> = {
  [key in Routes]: (...args: any[]) => Promise<any>
};

export const ApiRouteNames = [
  'debug:echo',
  'debug:showDevTools',
  'debug:binTest',

  'shell:open',
  'shell:addRecentDocument',

  'file:read',
  'file:loadPrompt',
  'file:write',
  'file:savePrompt',
  'file:exists',
  'file:mkdir',
  'file:ls',
  'file:rm',

  'process:argv',
  'process:getRendererSourceDir',
  'process:getAppDir',

  'window:setTitle',
  'window:destroy',
  'window:setZoom',
  'window:new',
  'window:list',
  'window:focus',

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

  'shell:open': (path: string) => Promise<void>;
  'shell:addRecentDocument': (path: string) => Promise<void>,

  'file:read': (path: string) => Promise<ArrayBuffer | false>;
  'file:loadPrompt': (filters?: Filters) => Promise<string | false>;
  'file:write': (path: string, data: ArrayBuffer) => Promise<void>;
  'file:savePrompt': (
    defaultPath?: string, filters?: Filters
  ) => Promise<string | false>;
  'file:exists': (path: string) => Promise<boolean>;
  'file:mkdir': (path: string) => Promise<void>;
  'file:ls': (path: string) => Promise<string[]>;
  'file:rm': (path: string) => Promise<void>;

  'process:argv': () => Promise<ArgvParsed>;
  'process:getRendererSourceDir': () => Promise<string>;
  'process:getAppDir': () => Promise<string>;

  'window:setTitle': (title: string) => Promise<void>;
  'window:destroy': () => Promise<void>;
  'window:setZoom': (zoom: number) => Promise<void>;
  'window:new': (argv?: ArgvParsed, pwd?: string) => Promise<void>;
  'window:list': () => Promise<{ id: number, title: string, focused: boolean }[]>;
  'window:focus': (id: number) => Promise<void>;

  'clipboard:writeWournal': (data: any) => Promise<void>;
  'clipboard:readText': () => Promise<string | false>;
  'clipboard:readImage': () => Promise<string | false>;
  'clipboard:readWournal': () => Promise<any | false>;

}

export const ElectronCallbackNames = [
  'window:close',
  'file:open',
] as const;

export interface ElectronCallbacks {

  'window:close': { },
  'file:open': { argv: ArgvParsed, pwd: string },

}

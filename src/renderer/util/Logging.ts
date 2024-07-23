import environment from "Shared/environment";
import { rx } from '@mvuijs/core';

/**
   Use `LOG` instead of the the console.* logging functions. Example: Instead of
   `console.log('hi')`, write `LOG.info('hi')`.

   In development, this will act exactly like calling the original console.*
   functions, including the correct display of line numbers in the browser
   console. Sadly, we cannot enhance the console.* functions without breaking
   that, so we just dont touch them in dev.

   In production, this will additionally store a history of logs that can then
   be examined by e.g. a crash reporter using `getLogHistory()`;

   You may also want to call `overwriteConsoleLogFunctions()` at the start of
   the app to also catch console.* calls in the history.
 */

export type ToStringable = { toString: () => string };

type Logger = {
  debug: (msg: ToStringable, data?: any) => void,
  info: (msg: ToStringable, data?: any) => void,
  warn: (msg: ToStringable, data?: any) => void,
  error: (msg: ToStringable, e?: any) => void,
}

type LogLevel = keyof Logger;

type LogMessage = {
  time: string, // ISO format
  level: LogLevel,
  msg: string,
  data?: any,
}

const LOG_HISTORY_LENGTH = 200;
let LOG_HISTORY_CURRENT = 0;
const LOG_HISTORY: LogMessage[] = new Array(LOG_HISTORY_LENGTH);

function getLogHistory(): LogMessage[] {
  const ret: LogMessage[] = [];
  for (let i = 0; i < LOG_HISTORY_LENGTH; i++) {
    const msg = LOG_HISTORY[(LOG_HISTORY_CURRENT + i) % LOG_HISTORY_LENGTH];
    if (msg === undefined) continue;
    let data: any = undefined;
    if (msg.data !== undefined)
      try { data = `${JSON.stringify(msg.data)}`.replaceAll('"', "'") }
      catch { data = '<Not Serializable>' }
    ret.push({ ...msg, data: data })
  }
  return ret;
}

/**
   Get a history of logs. This only works in production (see module
   description).
 */
export const getLogHistoryText = (): string[] => {
  const lvlOut: { [Prop in keyof Logger]: string } =
    { 'info': 'INF', 'debug': 'DBG', 'warn': 'WRN', 'error': 'ERR' };

  const pad = (s: number) => s.toString().padStart(2, '0');

  return getLogHistory().map(
    l => {
      const d = new Date(l.time);

      return (
        d.getUTCFullYear().toString().slice(2) + '-' +
        pad(d.getUTCMonth()) + '-' +
        pad(d.getUTCDate()) + ' ' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' +
        pad(d.getUTCSeconds()) + ' ' +
        lvlOut[l.level] + ' ' +
        checkSerializable(l.msg) +
        (l.data !== undefined ? ` -- ${checkSerializable(l.data)}` : '')
      );
    }
  )
}

const LOG_BUILTIN: Logger = {
  debug: console.debug.bind(console),
  info: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

type NotSerializable = { not_serializable: any };

function checkSerializable<T>(obj: T): T | NotSerializable {
  try {
    JSON.stringify(obj);
    return obj;
  } catch (e) {
    return { not_serializable: e };
  }
}

const isScalar = (x: any) => typeof x !== 'object' && typeof x !== 'function';

function maybeSerialize(obj: any): string {
  if (isScalar(obj)) return obj.toString();
  return JSON.stringify(checkSerializable(obj));
}

function getErrorName(e: any) {
  if (e instanceof Error && e.name !== 'Error') return e.name;
  if ('constructor' in e) return e.constructor.name;
  return typeof (e);
}

function log(
  level: LogLevel, msg: ToStringable, data?: object,
) {
  if (data !== undefined) LOG_BUILTIN[level](msg, data);
  else LOG_BUILTIN[level](msg);

  const logMsg: LogMessage = {
    time: (new Date()).toISOString(), level, msg: msg.toString(),
  }
  if (data !== undefined) {
    if (level === 'error') {
      logMsg.data = {
        name: getErrorName(data),
        value: checkSerializable(data),
      };
    } else {
      logMsg.data = checkSerializable(data);
    }
  }

  LOG_HISTORY[LOG_HISTORY_CURRENT % LOG_HISTORY_LENGTH] = logMsg;
  LOG_HISTORY_CURRENT++;
}

const LOG_PROD = {
  debug: (msg: ToStringable, data?: object) => log('debug', msg, data),
  info: (msg: ToStringable, data?: object) => log('info', msg, data),
  warn: (msg: ToStringable, data?: object) => log('warn', msg, data),
  error: (msg: ToStringable, data?: object) => log('error', msg, data),
};

/**
   A replacement for the console.* logging functions. See module description for
   details.
 */
export const LOG: Logger = environment.production ? LOG_PROD : LOG_BUILTIN;

const getLoggerSingle = (name: string, lvl: keyof Logger) => {
  return LOG === LOG_PROD
    ? (msg: ToStringable, data?: object) => {

      // if name looks like a file path, shorten to just file name
      if (name.includes('src') && name.includes('/'))
        name = name.slice(name.lastIndexOf('/') + 1, name.lastIndexOf('.'));

      const args: any = [`[${name}] ${msg}`];
      if (data !== undefined) args.push(data);
      return LOG[lvl].apply(console, args);
    }
    : LOG[lvl];
}

export const getLogger = (name: string): Logger => {
  return {
    debug: getLoggerSingle(name, 'debug'),
    info: getLoggerSingle(name, 'info'),
    warn: getLoggerSingle(name, 'warn'),
    error: getLoggerSingle(name, 'error'),
  }
}

/** Overwrite built-in console.log functions to point to `LOG`. */
function overwriteConsoleLogFunctions() {
  const w = window as any;
  if (LOG === LOG_PROD) {
    w.console.orig = LOG_BUILTIN;

    w.console.debug = LOG_PROD.debug;
    w.console.log = LOG_PROD.info;
    w.console.warn = LOG_PROD.warn;
    w.console.error = LOG_PROD.error;
  }

  LOG.info('Logging initialized');
}

function setupMvuiStateLogging() {
  rx.State.loggingCallback = (name, prev, next) => {
    const prevScalar = isScalar(prev);
    const nextScalar = isScalar(prev);
    const msg = `[state-change] <${name}>`;

    if (!prevScalar && !nextScalar) {
      LOG.debug(msg);
    } else {
      LOG.debug(msg, {
        prev: prevScalar ? prev : `[${typeof prev}]`,
        next: nextScalar ? next : `[${typeof next}]`,
      });
    }
  };
}

// ----------------------------------------------------------------------
// setup
// ----------------------------------------------------------------------

function maybeShorten(s: string, len: number = 20): string {
  if (s.length > 20) return s.slice(0, len) + '...';
  else return s;
}

function logAllClicks() {
  window.onclick = (e: MouseEvent) => {
    const path = e.composedPath().filter(
      el => (
        el instanceof HTMLElement &&
          (
            el.tagName.includes('-') || // custom element
            el.innerText || el.title
          )
      )
    ) as HTMLElement[];

    if (path[0] === undefined) return; // drag outside of window

    if (path[0].tagName.includes('WOURNAL-DOCUMENT')) return;

    const pathStr = path.map(el => {
      let ret = el.tagName.toLowerCase();
      if (el.innerText)
        ret += ` [${maybeShorten(el.innerText.replace('\n', ' '))}]`;
      else if (el.title)
        ret += ` [${maybeShorten(el.title)}]`;
      return ret
    });

    LOG.debug(`[click] ${pathStr.join(' > ')}`);
  }
}

export function setupLogging() {
  overwriteConsoleLogFunctions();
  setupMvuiStateLogging();
  logAllClicks();
}


// ----------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------

export function logFunction<T extends Function>(
  f: T,
  name?: string,
  log: (msg: string) => void = LOG.debug,
  logCall: (name: string, args: any[]) => void = (n, args) => log(
    `${n}(${args.map(maybeSerialize).join(', ')})`
  ),
): T {
  let orig = f;
  return ((...args: any[]) => {
    logCall(name ?? f.name, args);
    return orig.apply(orig, args);
  }) as any as T;
}

export function logObject<T extends { [key: string]: Function }>(
  o: T,
  name?: string,
  log: (msg: string) => void = getLogger(name).debug,
  logCall?: (name: string, args: any[]) => void,
): T {
  for (const key in o) o[key] = logFunction(o[key], undefined, log, logCall);
  return o;
}

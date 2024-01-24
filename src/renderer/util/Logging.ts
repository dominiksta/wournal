import environment from "environment";

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

type Logger = {
  debug: (msg: string, data?: object) => void,
  info: (msg: string, data?: object) => void,
  warn: (msg: string, data?: object) => void,
  error: (msg: string, e?: object) => void,
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogMessage = {
  time: string, // ISO format
  level: LogLevel,
  msg: string,
  data?: any,
}

const LOG_HISTORY_LENGTH = 200;
let LOG_HISTORY_CURRENT = 0;
const LOG_HISTORY: LogMessage[] = new Array(LOG_HISTORY_LENGTH);
/**
   Get a history of logs. This only works in production (see module
   description).
 */
export function getLogHistory(): LogMessage[] {
  const ret: LogMessage[] = [];
  for (let i = 0; i < LOG_HISTORY_LENGTH; i++) {
    const msg = LOG_HISTORY[(LOG_HISTORY_CURRENT + i) % LOG_HISTORY_LENGTH];
    if (msg === undefined) continue;
    let data: any = '<Not Serializable>';
    try { data = JSON.stringify(msg.data) } catch {}
    ret.push({ ...msg, data: data })
  }
  return ret;
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

function getErrorName(e: any) {
  if (e instanceof Error && e.name !== 'Error') return e.name;
  if ('constructor' in e) return e.constructor.name;
  return typeof (e);
}

function log(
  level: LogLevel, msg: string, data?: object,
) {
  if (data !== undefined) LOG_BUILTIN[level](msg, data);
  else LOG_BUILTIN[level](msg);

  const logMsg: LogMessage = {
    time: (new Date()).toISOString(), level, msg,
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
  debug: (msg: string, data?: object) => log('debug', msg, data),
  info: (msg: string, data?: object) => log('info', msg, data),
  warn: (msg: string, data?: object) => log('warn', msg, data),
  error: (msg: string, data?: object) => log('error', msg, data),
};

/**
   A replacement for the console.* logging functions. See module description for
   details.
 */
export const LOG: Logger = !environment.production ? LOG_PROD : LOG_BUILTIN;

/** Overwrite built-in console.log functions to point to `LOG`. */
export function overwriteConsoleLogFunctions() {
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

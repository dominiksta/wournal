export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}

class Logger {

    /** could be set via config in the future */
    private level: LogLevel = LogLevel.INFO;

    private static instance: Logger;
    private constructor() { }
    public static getInstance() {
        if (Logger.instance === undefined)
            Logger.instance = new Logger();
        return Logger.instance;
    }

    private log(level: LogLevel, obj: Object) {
        if (level < this.level) return;

        let date = (new Date()).toISOString();

        switch(level) {
            case LogLevel.DEBUG:
                console.debug(`${date} DEBUG: ${obj}`);
                // Dealing with objects in the browser console window is a
                // decent way of debugging and I don't want to lose that.
                if (!(typeof(obj) === "string")) console.debug(obj);
                break;
            case LogLevel.INFO:
                console.log(`${date} INFO: ${obj}`);
                if (!(typeof(obj) === "string")) console.log(obj);
                break;
            case LogLevel.WARN:
                console.warn(`${date} WARN: ${obj}`);
                if (!(typeof(obj) === "string")) console.warn(obj);
                break;
            case LogLevel.ERROR:
                console.error(`${date} ERROR: ${obj}`);
                if (!(typeof(obj) === "string")) console.error(obj);
                break;
        }
    }

    public debug(obj: Object) {
        this.log(LogLevel.DEBUG, obj);
    }
    public info(obj: Object) {
        this.log(LogLevel.INFO, obj);
    }
    public warn(obj: Object) {
        this.log(LogLevel.WARN, obj);
    }
    public error(obj: Object) {
        this.log(LogLevel.ERROR, obj);
    }
}

/** The global logger instance */
export const LOG = Logger.getInstance();
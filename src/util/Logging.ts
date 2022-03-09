export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}

class Logger {

    /** could be set via config in the future */
    private level: LogLevel = LogLevel.DEBUG;

    private static instance: Logger;
    private constructor() { }
    public static getInstance() {
        if (Logger.instance === undefined)
            Logger.instance = new Logger();
        return Logger.instance;
    }

    private log(level: LogLevel, ...args: any[]) {
        if (level < this.level) return;

        let date = (new Date()).toISOString();

        let argsWithNewLine = [];
        for (let i = 0; i < args.length - 1; i++) {
            argsWithNewLine.push(args[i]);
            argsWithNewLine.push("\n");
        }
        argsWithNewLine.push(args[args.length - 1]);

        switch(level) {
            case LogLevel.DEBUG:
                console.debug(`${date} DEBUG:`, ...argsWithNewLine);
                break;
            case LogLevel.INFO:
                console.log(`${date} INFO:`, ...argsWithNewLine);
                break;
            case LogLevel.WARN:
                console.warn(`${date} WARN:`, ...argsWithNewLine);
                break;
            case LogLevel.ERROR:
                console.error(`${date} ERROR:`, ...argsWithNewLine);
                break;
        }
    }

    public debug(...args: any[]) {
        this.log(LogLevel.DEBUG, ...args);
    }
    public info(...args: any[]) {
        this.log(LogLevel.INFO, ...args);
    }
    public warn(...args: any[]) {
        this.log(LogLevel.WARN, ...args);
    }
    public error(...args: any[]) {
        this.log(LogLevel.ERROR, ...args);
    }
}

/** The global logger instance */
export const LOG = Logger.getInstance();

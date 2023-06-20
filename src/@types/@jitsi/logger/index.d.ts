/**
 * jitsi-meet-logger declaration
 */
declare module '@jitsi/logger' {

    /**
     * Logger class and it main methods
     */
    class Logger {
        error(message: string, ...params: any[]): void;
        info(message: string, ...params: any[]): void;
        debug(message: string, ...params: any[]): void;
        warn(message: string, ...params: any[]): void;
    }

    export function getUntrackedLogger(id: string, transports: Array<Object> | undefined, config: Object): Logger;
    export function setLogLevel(level: string): void;
}


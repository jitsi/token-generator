import * as jitsiLogger from '@jitsi/logger';
import { Request, Response, NextFunction } from 'express';
import shortid from 'shortid';


/**
 * The request context, used for injecting request id into logs
 */
export class Context {
    public logger: jitsiLogger.Logger;
    public start: number;
    public requestId: string;

    /**
     * Constructor
     * @param reqLogger logger instance for this request
     * @param start start date of the request
     * @param requestId the request identifier
     */
    constructor(
            reqLogger: jitsiLogger.Logger,
            start: number,
            requestId: string
    ) {
        this.logger = reqLogger;
        this.start = start;
        this.requestId = requestId;
    }
}

/**
 * Generate new request context
 * @param contextId id of the context
 */
export function generateNewContext(contextId?: string): Context {
    const start = Date.now();
    let resultedContextId = contextId;

    if (!resultedContextId) {
        resultedContextId = shortid.generate();
    }
    const ctxLogger = jitsiLogger.getUntrackedLogger(resultedContextId, undefined, {})

    return new Context(ctxLogger, start, resultedContextId);
}


/**
 * Adds context to the express request object. The context
 * includes the start date, a request id and a handler specific logger.
 * This middleware should be registered before any middleware that make use of
 * context or anything it contains.
 * @param req request
 * @param res response
 * @param next next
 */
export function injectContext(
        req: Request,
        res: Response,
        next: NextFunction
): void {
    const requestIdHeader = req.header('X-Request-Id');
    const start = Date.now();
    const reqId = requestIdHeader ? requestIdHeader : shortid.generate();
    const reqLogger = jitsiLogger.getUntrackedLogger(reqId, undefined, {});

    req.context = new Context(reqLogger, start, reqId);
    res.header('X-Request-Id', reqId);
    next();
}


/**
 * Logs summary data for each http api call. It makes use of the context logger.
 * @param req request
 * @param res response
 * @param next next
 */
export function accessLogger(
        req: Request,
        res: Response,
        next: NextFunction
): void {
    let logged = false;
    const accessLog = function() {
        if (!logged) {
            logged = true;
            const requestInfo = JSON.stringify({
                m: req.method,
                u: req.originalUrl,
                s: res.statusCode,
                d: Math.abs(Date.now() - req.context.start)
            });

            req.context.logger.info(`${requestInfo}`);
        }
    };

    res.on('finish', accessLog);
    res.on('close', accessLog);
    next();
}

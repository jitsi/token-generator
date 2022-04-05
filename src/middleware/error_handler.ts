import express from 'express';

import logger from '../logger';

/**
 * Express middleware for handling error
 * @param err error
 * @param req request
 * @param res response
 * @param next next function
 */
export function errorHandlerMiddleware(
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
): void {
    // If the headers have already been sent then we must use
    // the built-in default error handler according to
    // https://expressjs.com/en/guide/error-handling.html
    if (res.headersSent) {
        return next(err);
    }

    let l = logger;

    if (req.context && req.context.logger) {
        l = req.context.logger;
    }

    if (err.name === 'SyntaxError') {
        l.error(`Invalid request ${err}: ${JSON.stringify(err)}`);
        respondInvalidRequest(req, res);
    } else if (err.name === 'UnauthorizedError' && err.message === 'forbidden') {
        l.info(`unauthorized token ${err}`);
        respondForbidden(req, res);
    } else if ((err.name === 'HTTPError'
        && err.message === 'Response code 403 (Forbidden)')
        || err.name === 'UnauthorizedError'
        || err.message === 'invalid issuer or kid'
        || err.message === 'kid is required in header'
        || err.message === 'invalid kid format for VpaaS'
        || err.message === 'error obtaining asap pub key'
    ) {
        // HTTPError: Response code 403 (Forbidden) is thrown in case of an invalid kid
        l.info(`unauthorized token ${err}`);
        res.status(401).send();
    } else {
        l.error(`internal error ${err}`, { stack: err.stack });
        respondInternalServerError(req, res);
    }
}

/**
 * Respond with invalid request error
 * @param req
 * @param res
 */
function respondInvalidRequest(req: express.Request, res: express.Response) {
    res.status(400).send({
        timestamp: Date.now(),
        status: 400,
        message: 'Invalid request',
        messageKey: 'invalid_request',
        path: req.path
    });
}

/**
 * Response with forbidden error
 * @param req
 * @param res
 */
function respondForbidden(req: express.Request, res: express.Response) {
    res.status(403).send({
        timestamp: Date.now(),
        status: 403,
        message: 'Forbidden',
        messageKey: 'forbidden',
        path: req.path
    });
}

/**
 * Respond with internal server error
 * @param req
 * @param res
 */
function respondInternalServerError(req: express.Request, res: express.Response) {
    res.status(500).send({
        timestamp: Date.now(),
        status: 500,
        message: 'Internal Server Error',
        messageKey: 'internal.server.errors',
        path: req.path
    });
}

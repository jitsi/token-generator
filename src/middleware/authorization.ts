import express from 'express';
import jwt, { UnauthorizedError } from 'express-jwt';

import { ASAPPubKeyFetcher } from '../util/asap';

export interface JwtClaims {
    asapJwtAcceptedAud: string;
    asapJwtAcceptedHookIss: string[];
}

export interface TokenAuthorizationOptions {
    asapFetcher: ASAPPubKeyFetcher,
    protectedApi: boolean,
    systemJwtClaims: JwtClaims,
    jitsiJwtClaims: JwtClaims
}

/**
 * Provider of authorization middlewares
 */
export class GeneratorAuthorization {
    private asapFetcher: ASAPPubKeyFetcher;
    private readonly protectedApi: boolean;
    private readonly systemJwtClaims: JwtClaims;
    private readonly jitsiJwtClaims: JwtClaims;

    /**
     * Constructor
     * @param options
     */
    constructor(options: TokenAuthorizationOptions) {
        this.asapFetcher = options.asapFetcher;
        this.protectedApi = options.protectedApi;
        this.systemJwtClaims = options.systemJwtClaims;
        this.jitsiJwtClaims = options.jitsiJwtClaims;
        this.jitsiAuthMiddleware = this.jitsiAuthMiddleware.bind(this);
        this.signalAuthMiddleware = this.signalAuthMiddleware.bind(this);
        this.systemAuthMiddleware = this.systemAuthMiddleware.bind(this);
        this.authorize = this.authorize.bind(this);
    }

    /**
     * Express authorization middleware for jitsi meeting tokens
     * @param req
     * @param res
     * @param next
     */
    public jitsiAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (req.context) {
            req.context.logger.debug('Trying jitsi authorization');
        }
        this.authorize(req, res, next, this.jitsiJwtClaims);
    }

    /**
     * Express authorization middleware for signaling tokens
     * @param req
     * @param res
     * @param next
     */
    public signalAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (req.context) {
            req.context.logger.debug('Trying signal authorization');
        }

        // TODO implement authorization
        // next(new UnauthorizedError('revoked_token', { message: 'test error message' }));
        next();
    }

    /**
     * Express authorization middleware for system tokens
     * @param req
     * @param res
     * @param next
     */
    public systemAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (req.context) {
            req.context.logger.info('Trying system authorization');
        }
        this.authorize(req, res, next, this.systemJwtClaims);
    }

    /**
     * Express-jwt authorization of tokens, taking into consideration the expected jwtClaims.
     * The public key is retrieved from the pre-configured callback associated to the issuer.
     * @param req
     * @param res
     * @param next
     * @param jwtClaims
     * @private
     */
    private authorize(req: express.Request, res: express.Response, next: express.NextFunction, jwtClaims: JwtClaims) {
        try {
            jwt({
                secret: this.asapFetcher.pubKeyCallback,
                audience: jwtClaims.asapJwtAcceptedAud,
                issuer: jwtClaims.asapJwtAcceptedHookIss,
                algorithms: [ 'RS256' ]
            })
                .unless(() => {
                    if (!this.protectedApi) {
                        return true;
                    }

                    // check for jwt
                    return false;
                })
                .apply(this, [ req, res, next ]);
        } catch (err) {
            // if the token has no kid, a TypeError will be thrown. This should be mapped to invalid token
            next(new UnauthorizedError('invalid_token', err));
        }
    }
}

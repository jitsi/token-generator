// import got, { CancelableRequest } from 'got';
import { JwtPayload, sign, SignOptions } from 'jsonwebtoken';
import NodeCache from 'node-cache';

import { Context } from './util/context';

interface Claims {
    [key: string]: string;
}

interface SigningKeyMap {
    [key: string]: Buffer;
}

export interface TokenGeneratorOptions {
    signingKey: Buffer;
    asapJwtIss: string;
    asapJwtAud: string;
    asapJwtKid: string;
    asapJwtSub?: string;
    cacheTTL?: number;
    signingKeys?: SigningKeyMap;
}

/**
 */
export default class TokenGenerator {
    private signingKey: Buffer;
    private signingKeys: SigningKeyMap;
    private asapCache: NodeCache;
    private asapJwtIss: string;
    private asapJwtAud: string;
    private asapJwtKid: string;
    private asapJwtSub: string;
    private cacheTTL = 60 * 45;
    private defaultSignOptions: SignOptions

    /**
     * Constructor
     * @param options
     */
    constructor(options: TokenGeneratorOptions) {
        this.signingKey = options.signingKey;
        this.asapJwtIss = options.asapJwtIss;
        this.asapJwtAud = options.asapJwtAud;
        this.asapJwtKid = options.asapJwtKid;
        this.asapJwtSub = options.asapJwtSub;

        this.signingKeys = <SigningKeyMap>{};
        if (options.signingKeys !== undefined) {
            this.signingKeys = options.signingKeys;
        }
        if (options.cacheTTL !== undefined) {
            this.cacheTTL = options.cacheTTL;
        }
        this.asapCache = new NodeCache({ stdTTL: this.cacheTTL }); // TTL of 45 minutes

        this.defaultSignOptions = <SignOptions>{
            algorithm: 'RS256',
            expiresIn: '1 hour', // 1 hour
            notBefore: '-5m',
            audience: this.asapJwtAud,
            issuer: this.asapJwtIss,
            keyid: this.asapJwtKid
        }

        if (this.asapJwtSub) {
            this.defaultSignOptions.subject = this.asapJwtSub;
        }

        this.serverToken = this.serverToken.bind(this);
    }

    /**
     */
    serverToken(ctx: Context, options: SignOptions): string {
        // const cacheKey = 'asap_server';
        // const cachedAuth: string = this.asapCache.get(cacheKey);

        // if (cachedAuth) {
        //     return cachedAuth;
        // }

        ctx.logger.debug('serverToken generation');

        const auth = this.signJWT(ctx, {}, options);

        // this.asapCache.set(cacheKey, auth);

        return auth;
    }

    /**
     *
     * @param ctx Context
     * @param room string
     * @param options SignOptions
     * @returns string for client auth
     */
    clientToken(ctx: Context, payload: JwtPayload, options: SignOptions = {}): string {
        return this.signJWT(ctx, payload, options);
    }

    /**
     * signJWT creates and returns a new JWT
     * @param ctx Context
     * @param options SignOptions
     */
    private signJWT(ctx: Context, claims: Claims, options: SignOptions): string {
        ctx.logger.debug('new JWT generation');

        const signOptions = {
            ...this.defaultSignOptions,
            ...options
        };

        // pull the signing key by kid, if not found use the default key
        const signingKey = this.signingKeys[signOptions.keyid] ? this.signingKeys[signOptions.keyid] : this.signingKey;

        const auth = sign(claims, signingKey, signOptions);

        return auth;
    }
}

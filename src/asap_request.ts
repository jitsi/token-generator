import got, { CancelableRequest } from 'got';
import { sign } from 'jsonwebtoken';
import NodeCache from 'node-cache';

import { Context } from './util/context';

export interface AsapRequestOptions {
    signingKey: Buffer;
    asapJwtIss: string;
    asapJwtAud: string;
    asapJwtKid: string;
    cacheTTL?: number;
    requestTimeoutMs?: number;
    requestRetryCount?: number;
}

export interface OverrideableRequestOptions {
    requestTimeoutMs?: number;
}

/**
 */
export default class AsapRequest {
    private signingKey: Buffer;
    private asapCache: NodeCache;
    private asapJwtIss: string;
    private asapJwtAud: string;
    private asapJwtKid: string;
    private cacheTTL = 60 * 45;
    private requestTimeoutMs = 3 * 1000;
    private requestRetryCount = 2;

    /**
     * Constructor
     * @param options
     */
    constructor(options: AsapRequestOptions) {
        this.signingKey = options.signingKey;
        this.asapJwtIss = options.asapJwtIss;
        this.asapJwtAud = options.asapJwtAud;
        this.asapJwtKid = options.asapJwtKid;

        if (options.requestTimeoutMs !== undefined) {
            this.requestTimeoutMs = options.requestTimeoutMs;
        }
        if (options.requestRetryCount !== undefined) {
            this.requestRetryCount = options.requestRetryCount;
        }

        if (options.cacheTTL !== undefined) {
            this.cacheTTL = options.cacheTTL;
        }
        this.asapCache = new NodeCache({ stdTTL: this.cacheTTL }); // TTL of 45 minutes

        this.authToken = this.authToken.bind(this);
        this.getJson = this.getJson.bind(this);
    }

    /**
     */
    authToken(): string {
        const cachedAuth: string = this.asapCache.get('asap');

        if (cachedAuth) {
            return cachedAuth;
        }

        const auth = sign({}, this.signingKey, {
            issuer: this.asapJwtIss,
            audience: this.asapJwtAud,
            algorithm: 'RS256',
            keyid: this.asapJwtKid,
            expiresIn: 60 * 60 // 1 hour
        });

        this.asapCache.set('asap', auth);

        return auth;
    }

    /**
     * @param ctx
     * @param url
     */
    async getJson(ctx: Context, url: string): Promise<CancelableRequest> {
        ctx.logger.debug(`Sending GET ${url}`);
        const response = await got.get(url, {
            headers: {
                Authorization: `Bearer ${this.authToken()}`
            },
            responseType: 'json',
            timeout: this.requestTimeoutMs,
            retry: this.requestRetryCount
        });

        ctx.logger.debug(`GET ${url} response: code ${response.statusCode} and body ${JSON.stringify(response.body)}`);

        return response.body;
    }

    /**
     * @param ctx
     * @param url
     * @param body
     * @param requestOptions
     */
    async postJson(
            ctx: Context,
            url: string,
            body: unknown,
            requestOptions: OverrideableRequestOptions
    ): Promise<CancelableRequest> {
        ctx.logger.info(`Sending POST ${url}`);

        // by default, got library does not retry post requests
        // we don't need to change this behavior for now
        // https://www.npmjs.com/package/got#retry
        const response = await got.post(url, {
            headers: {
                Authorization: `Bearer ${this.authToken()}`
            },
            json: body,
            responseType: 'json',
            timeout: requestOptions.requestTimeoutMs ? requestOptions.requestTimeoutMs : this.requestTimeoutMs
        });

        if (response.statusCode === 200) {
            ctx.logger.info(
                `POST ${url} response: code ${response.statusCode} and body ${JSON.stringify(response.body)}`
            );
        } else {
            ctx.logger.error(
                `POST ${url} response: code ${response.statusCode} and body ${JSON.stringify(response.body)}`
            );
        }

        return response.statusCode;
    }
}

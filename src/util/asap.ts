
import express from 'express';
import got from 'got';
import { Jwt, Secret, JwtPayload } from 'jsonwebtoken';
import NodeCache from 'node-cache';
import sha256 from 'sha256';

import { AsapBaseUrlMapping } from '../config';

import { Context } from './context';

/**
 * Public key fetcher
 */
export class ASAPPubKeyFetcher {
    private issToBaseUrl: Map<string, AsapBaseUrlMapping[]>;
    private kidPrefixPattern: RegExp;
    private cache: NodeCache;

    /**
     * Constructor
     * @param issToBaseUrl
     * @param kidPrefixPattern
     * @param ttl
     */
    constructor(
            issToBaseUrl: Map<string, any>,
            kidPrefixPattern: RegExp,
            ttl: number
    ) {
        this.issToBaseUrl = issToBaseUrl;
        this.cache = new NodeCache({ stdTTL: ttl });
        this.kidPrefixPattern = kidPrefixPattern;

        this.pubKeyCallback = this.pubKeyCallback.bind(this);
        this.pubKeyCallbackForJsonWebToken = this.pubKeyCallbackForJsonWebToken.bind(this);
    }

    /**
     * Method for getting the public key
     * @param ctx
     * @param token Jwt token details from jsonwebtoken
     */
    async pubKeyCallbackForJsonWebToken(ctx: Context, token: Jwt): Promise<Secret> {
        if (!token.header.kid) {
            throw new Error('kid is required in header');
        }

        let pubKey = <Secret> this.cache.get(token.header.kid);

        ctx.logger.debug('fetching pub key from key server');
        const payload = <JwtPayload>token.payload;
        const issuer = payload.iss;
        const baseUrl = this.getPublicKeyUrl(ctx, token.header.kid, this.issToBaseUrl.get(issuer));

        if (!baseUrl) {
            throw new Error('invalid issuer or kid');
        }

        ctx.logger.debug('Fetching pub key from key server');
        try {
            pubKey = <Secret> await fetchPublicKey(baseUrl, token.header.kid);
            this.cache.set(token.header.kid, pubKey);
        } catch (err) {
            ctx.logger.error(`Obtaining asap pub ${err}`, { err });
            throw err;
        }

        return pubKey;
    }

    /**
     * Retrieves the first valid public key URL from the list of mappings
     * @param ctx
     * @param kid
     * @param baseUrlMappings
     * @private
     */
    private getPublicKeyUrl(ctx: Context, kid: string, baseUrlMappings: AsapBaseUrlMapping[]): string {
        if (typeof baseUrlMappings === 'undefined') {
            ctx.logger.warn('No public key URL mapping found');

            return null;
        }

        for (const baseUrlMapping of baseUrlMappings) {
            if (!baseUrlMapping.kid) {
                ctx.logger.debug(`Found pub key url mapping: ${baseUrlMapping.baseUrl}`);

                return baseUrlMapping.baseUrl;
            }

            const kidPattern = new RegExp(baseUrlMapping.kid);

            if (kidPattern.test(kid)) {
                if (!baseUrlMapping.appendKidPrefix) {
                    ctx.logger.debug(`Found pub key url mapping by kid pattern: ${baseUrlMapping.baseUrl}`);

                    return baseUrlMapping.baseUrl;
                }

                if (this.kidPrefixPattern.test(kid)) {
                    const baseUrl = baseUrlMapping.baseUrl.concat('/').concat(this.kidPrefixPattern.exec(kid)[1]);

                    ctx.logger.debug(`Found pub key url mapping by kid pattern and suffix: ${baseUrl}`);

                    return baseUrl;
                }
            }
        }

        return null;
    }

    /**
     * Method for getting the public key, using a signature
     * specific to express-jwt
     * @param req
     * @param token JWT from jsonwebtoken
     */
    async pubKeyCallback(req: express.Request, token: Jwt): Promise<Secret> {
        return this.pubKeyCallbackForJsonWebToken(req.context, token);
    }
}

/**
 * Method for getting the public key from server
 * @param baseUrl
 * @param kid
 */
async function fetchPublicKey(baseUrl: string, kid: string): Promise<string> {
    const hashedKid = sha256(kid);
    const reqUrl = `${baseUrl}/${hashedKid}.pem`;
    const response = await got(reqUrl);

    return response.body;
}

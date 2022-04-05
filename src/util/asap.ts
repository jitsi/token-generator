
import express from 'express';
import { secretType } from 'express-jwt';
import got from 'got';
import { Secret } from 'jsonwebtoken';
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
     * @param header
     * @param payload
     * @param done
     */
    pubKeyCallbackForJsonWebToken(ctx: Context,
            header: any,
            payload: any,
            done: (err: any, secret?: secretType | Secret) => void): void {
        try {
            if (!header || !header.kid) {
                done(new Error('kid is required in header'), null);

                return;
            }
            const kid = header.kid;
            const pubKey: string = this.cache.get(kid);

            if (pubKey) {
                ctx.logger.debug('Using pub key from cache');
                done(null, pubKey);

                return;
            }

            const issuer = payload.iss;
            const baseUrl = this.getPublicKeyUrl(ctx, kid, this.issToBaseUrl.get(issuer));

            if (!baseUrl) {
                done(new Error('invalid issuer or kid'), null);

                return;
            }

            ctx.logger.debug('Fetching pub key from key server');
            fetchPublicKey(baseUrl, kid)
                .then(key => {
                    this.cache.set(kid, key);
                    done(null, key);
                })
                .catch(err => {
                    ctx.logger.error(`Obtaining asap pub ${err}`);
                    done(err);
                });
        } catch (err) {
            done(err);
        }
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
     * @param header
     * @param payload
     * @param done
     */
    pubKeyCallback(req: express.Request,
            header: any,
            payload: any,
            done: (err: any, secret?: secretType) => void): void {
        return this.pubKeyCallbackForJsonWebToken(req.context, header, payload, done);
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

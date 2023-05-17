import { Request, Response } from 'express';
import { JwtPayload, SignOptions } from 'jsonwebtoken';

import TokenGenerator from './token_generator';
import { generateKey } from './util/crypto_helper';

interface HandlersOptions {
    tokenGenerator: TokenGenerator;
    salt: Uint8Array
}

/**
 * class for express request handling
 */
class Handlers {
    private tokenGenerator: TokenGenerator;
    private salt: Uint8Array;

    /**
     *
     * @param options HandlersOptions
     */
    constructor(options: HandlersOptions) {

        this.tokenGenerator = options.tokenGenerator;
        this.salt = options.salt;
    }

    /**
     *
     * @param req Request
     * @param res Response
     */
    async generateComponentToken(req: Request, res: Response) {
        /** expected inputs
         * {
         *   "domain": "string",
         *   "room": "string",
         *   "tenant": "string",
         *   "tokenType": "JIGASI"
         * }
         **/
        const inputs = {
            ...req.params,
            ...req.body
        };

        req.context.logger.debug('inputs', { inputs,
            body: req.body,
            params: req.params });

        const payload = <JwtPayload>{
            room: inputs.room ? inputs.room : '*'
        };

        const signOptions = <SignOptions>{
            issuer: 'jaas-components',
            expiresIn: '1 day'
        };

        if (inputs.tenant) {
            signOptions.subject = inputs.tenant;
        } else if (inputs.domain) {
            signOptions.subject = inputs.domain;
        } else {
            signOptions.subject = '*';
        }

        switch (inputs.tokenType) {
        case 'JIGASI':
            // inject any jigasi specifics here
            signOptions.audience = `jigasi.${inputs.domain}`;
            break;
        }


        const token = this.tokenGenerator.clientToken(
            req.context,
            payload,
            signOptions
        );

        res.status(200).json({ token });

    }

    /**
     *
     * @param req Request
     * @param res Response
     */
    async generateServerToken(req: Request, res: Response) {
        let signOptions = <SignOptions>{
            audience: 'jitsi-token-generator',
            expiresIn: '1 hour'
        };

        if (req.params) {
            signOptions = <SignOptions>{
                ...signOptions,
                ...req.params
            };
        }
        if (req.body) {
            signOptions = <SignOptions>{
                ...signOptions,
                ...req.body
            };
        }
        const token = this.tokenGenerator.serverToken(req.context, signOptions);

        res.status(200).json({ token });

    }

    /**
     * Generates a client token valid for 2 hours. The token structure is taken from the body of the reques.
     * @param req Request
     * @param res Response
     * @returns A json with token and tenant (extracted from the token body field sub).
     */
    async generateClientToken(req: Request, res: Response) {
        const inputs = {
            ...req.body,
            ...req.params,
            ...req.query
        };

        req.context.logger.debug('inputs', { inputs,
            method: req.method,
            body: req.body,
            params: req.params });

        const payload = <JwtPayload>{
            ...req.body
        };

        const signOptions = <SignOptions>{
            audience: 'jitsi',
            issuer: 'chat',
            expiresIn: '2 hour'
        };

        const originalRoomName = payload.room;
        const tenant = inputs.sub;
        let confId: string;

        if (inputs.confId === 'true') {
            confId = await generateKey(`${tenant}/${originalRoomName}`, this.salt);
            payload.room = confId;
        }

        const token = this.tokenGenerator.clientToken(
            req.context,
            payload,
            signOptions
        );

        let e2eeKey: string;

        if (inputs.e2eeKey === 'true') {
            e2eeKey = await generateKey(originalRoomName, this.salt);
        }

        res.status(200).json({
            confId,
            token,
            tenant,
            e2eeKey
        });
    }
}

export default Handlers;

import { Request, Response } from 'express';
import { JwtPayload, SignOptions } from 'jsonwebtoken';

import TokenGenerator from './token_generator';
interface HandlersOptions {
    tokenGenerator: TokenGenerator;
}

/**
 * class for express request handling
 */
class Handlers {
    private tokenGenerator: TokenGenerator;

    /**
     *
     * @param options HandlersOptions
     */
    constructor(options: HandlersOptions) {

        this.tokenGenerator = options.tokenGenerator;
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
        }

        const signOptions = <SignOptions>{
            issuer: 'jaas-components',
            expiresIn: '1 day'
        }

        if (inputs.tenant) {
            signOptions.subject = inputs.tenant;
        } else if (inputs.domain) {
            signOptions.subject = inputs.domain;
        } else {
            signOptions.subject = '*'
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
        }

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

}

export default Handlers;

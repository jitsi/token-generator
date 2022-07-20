// @TODO: implement all this parts of the token: https://developer.8x8.com/jaas/docs/api-keys-jwt
import * as dotenv from 'dotenv';
import envalid from 'envalid';
import fs from 'fs';

import logger from './logger';
import TokenGenerator from './token_generator';
import { Context } from './util/context';

dotenv.config();

const env = envalid.cleanEnv(process.env, {
    ASAP_JWT_ISS: envalid.str({ default: 'jitsi-token-generator' }),
    ASAP_JWT_AUD: envalid.str({ default: 'jitsi' }),
    ASAP_SIGNING_KEY_FILE: envalid.str(),
    ASAP_JWT_KID: envalid.str(),
    ASAP_TYPE: envalid.str({ default: '' }),
    ASAP_JWT_SUB: envalid.str({ default: undefined }),
    ASAP_ROOM: envalid.str({ default: '' }),
    ASAP_SCD: envalid.str({ default: undefined })  // cluster scope domain
});

const jwtSigningKey = fs.readFileSync(env.ASAP_SIGNING_KEY_FILE);

const tokenGenerator = new TokenGenerator({
    signingKey: jwtSigningKey,
    asapJwtIss: env.ASAP_JWT_ISS,
    asapJwtAud: env.ASAP_JWT_AUD,
    asapJwtKid: env.ASAP_JWT_KID,
    asapJwtSub: env.ASAP_JWT_SUB
});

const ctx = new Context(logger, 0, '');

let token = '';

let asapType = 'server';

if (env.ASAP_TYPE) {
    asapType = <string>env.ASAP_TYPE
}

switch (asapType) {
case 'server':
    const payload = <JwtPayload>{};
    if (env.ASAP_SCD) {
        payload.scd = env.ASAP_SCD
    }
    token = tokenGenerator.serverToken(ctx, payload, {});
    break;
case 'client':
    token = tokenGenerator.clientToken(ctx, { room: env.ASAP_ROOM ? env.ASAP_ROOM : '*' }, { expiresIn: '1 day' });
    break;
case 'component':
    token = tokenGenerator.clientToken(ctx,
        { room: env.ASAP_ROOM ? env.ASAP_ROOM : '*' },
        {
            audience: 'jitsi-component',
            expiresIn: '1 day',
            subject: '*'
        }
    );
    break;
default:
    token = 'wtfbbq';
    break;
}
console.log(token);

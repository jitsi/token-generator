import * as dotenv from 'dotenv';
import envalid from 'envalid';

const result = dotenv.config();

if (result.error) {
    const err = <NodeJS.ErrnoException>result.error;

    switch (err.code) {
    case 'ENOENT':
        // skip if only error is missing file, this isn't fatal
        console.debug('Missing .env file, not loading environment file disk');
        break;
    default:
        throw result.error;
    }
}

const env = envalid.cleanEnv(process.env, {
    PORT: envalid.num({ default: 8017 }),
    ASAP_JWT_KID: envalid.str({ default: '' }),
    ASAP_JWT_ISS: envalid.str({ default: 'jitsi-component-sidecar' }),
    ASAP_JWT_AUD: envalid.str({ default: 'jitsi-component-selector' }),
    REQUEST_TIMEOUT_MS: envalid.num({ default: 8000 }),
    REQUEST_RETRY_COUNT: envalid.num({ default: 2 })
});

export default {
    HTTPServerPort: env.PORT,
    AsapJwtKid: env.ASAP_JWT_KID,
    AsapJwtIss: env.ASAP_JWT_ISS,
    AsapJwtAud: env.ASAP_JWT_AUD,
    RequestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    RequestRetryCount: env.REQUEST_RETRY_COUNT
};

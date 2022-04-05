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

/**
 * Maps a public key base URL to a kidPattern, if any
 */
export interface AsapBaseUrlMapping {
    kid?: string,
    baseUrl: string;
    appendKidPrefix: boolean;
}

const env = envalid.cleanEnv(process.env, {
    LOG_LEVEL: envalid.str({ default: 'info' }),
    PORT: envalid.num({ default: 8017 }),
    ASAP_SIGNING_KEY_FILE: envalid.str(),
    ASAP_JWT_KID: envalid.str({ default: '' }),
    ASAP_JWT_ISS: envalid.str({ default: 'jitsi-token-generator' }),
    ASAP_JWT_AUD: envalid.str({ default: 'jitsi' }),
    ASAP_JWT_SUB: envalid.str({ default: undefined }),
    ASAP_PUB_KEY_TTL: envalid.num({ default: 3600 }),
    KEY_PREFIX_PATTERN: envalid.str({ default: '^(.*)/(.*)$' }),
    SYSTEM_ASAP_BASE_URL_MAPPINGS: envalid.json(
        { example:
            '[{"kid": "kidPattern", baseUrl": "https://jaas-public-keys.jitsi.net/server/dev"}]'
        }),
    SYSTEM_ASAP_JWT_AUD: envalid.str(),
    SYSTEM_ASAP_JWT_ACCEPTED_HOOK_ISS: envalid.str(),
    PROTECTED_API: envalid.bool({ default: true }),
    REQUEST_TIMEOUT_MS: envalid.num({ default: 8000 }),
    REQUEST_RETRY_COUNT: envalid.num({ default: 2 }),
    HOSTNAME: envalid.str({ default: '' }),
    VOLATILE_EVENTS: envalid.bool({ default: true })
});

export default {
    LogLevel: env.LOG_LEVEL,
    HTTPServerPort: env.PORT,
    AsapSigningKeyFile: env.ASAP_SIGNING_KEY_FILE,
    AsapJwtKid: env.ASAP_JWT_KID,
    AsapJwtIss: env.ASAP_JWT_ISS,
    AsapJwtAud: env.ASAP_JWT_AUD,
    AsapJwtSub: env.ASAP_JWT_SUB,
    RequestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    RequestRetryCount: env.REQUEST_RETRY_COUNT,
    Hostname: env.HOSTNAME,
    VolatileEvents: env.VOLATILE_EVENTS,
    ProtectedApi: env.PROTECTED_API,
    AsapPubKeyTTL: env.ASAP_PUB_KEY_TTL,
    KidPrefixPattern: env.KEY_PREFIX_PATTERN,
    SystemAsapBaseUrlMappings: env.SYSTEM_ASAP_BASE_URL_MAPPINGS,
    SystemAsapJwtAcceptedAud: env.SYSTEM_ASAP_JWT_AUD,
    SystemAsapJwtAcceptedHookIss: env.SYSTEM_ASAP_JWT_ACCEPTED_HOOK_ISS.split(',')
};

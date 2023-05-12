import * as dotenv from 'dotenv';
import envalid from 'envalid';

const crypto = require('crypto');

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
 * Converts a string to Uint8Array.
 * @param str
 */
function asciiToUint8Array([ ...str ]) {
    return new Uint8Array(str.map(char => char.charCodeAt(0)));
}

/**
 * Maps a public key base URL to a kidPattern, if any
 */
export interface AsapBaseUrlMapping {
    appendKidPrefix: boolean;
    baseUrl: string;
    kid?: string;
}

const env = envalid.cleanEnv(process.env, {
    ASAP_JWT_AUD: envalid.str({ default: 'jitsi' }),
    ASAP_JWT_ISS: envalid.str({ default: 'jitsi-token-generator' }),
    ASAP_JWT_KID: envalid.str(),
    ASAP_JWT_SUB: envalid.str({ default: undefined }),
    ASAP_PUB_KEY_TTL: envalid.num({ default: 3600 }),
    ASAP_SIGNING_KEY_FILE: envalid.str(),
    HOSTNAME: envalid.str({ default: '' }),
    KEY_GEN_SALT: envalid.str({ default: crypto.randomBytes(16).toString('hex') }),
    KEY_PREFIX_PATTERN: envalid.str({ default: '^(.*)/(.*)$' }),
    LOG_LEVEL: envalid.str({ default: 'info' }),
    PORT: envalid.num({ default: 8017 }),
    PROTECTED_API: envalid.bool({ default: true }),
    REQUEST_RETRY_COUNT: envalid.num({ default: 2 }),
    REQUEST_TIMEOUT_MS: envalid.num({ default: 8000 }),
    SYSTEM_ASAP_BASE_URL_MAPPINGS: envalid.json(
        { example:
            '[{"kid": "kidPattern", baseUrl": "https://jaas-public-keys.jitsi.net/server/dev"}]'
        }),
    SYSTEM_ASAP_JWT_ACCEPTED_HOOK_ISS: envalid.str(),
    SYSTEM_ASAP_JWT_AUD: envalid.str()
});

export default {
    AsapJwtAud: env.ASAP_JWT_AUD,
    AsapJwtIss: env.ASAP_JWT_ISS,
    AsapJwtKid: env.ASAP_JWT_KID,
    AsapJwtSub: env.ASAP_JWT_SUB,
    AsapPubKeyTTL: env.ASAP_PUB_KEY_TTL,
    AsapSigningKeyFile: env.ASAP_SIGNING_KEY_FILE,
    HTTPServerPort: env.PORT,
    Hostname: env.HOSTNAME,
    KeyGenSalt: asciiToUint8Array(env.KEY_GEN_SALT),
    KidPrefixPattern: env.KEY_PREFIX_PATTERN,
    LogLevel: env.LOG_LEVEL,
    ProtectedApi: env.PROTECTED_API,
    RequestRetryCount: env.REQUEST_RETRY_COUNT,
    RequestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    SystemAsapBaseUrlMappings: env.SYSTEM_ASAP_BASE_URL_MAPPINGS,
    SystemAsapJwtAcceptedAud: env.SYSTEM_ASAP_JWT_AUD,
    SystemAsapJwtAcceptedHookIss: env.SYSTEM_ASAP_JWT_ACCEPTED_HOOK_ISS.split(',')
};

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
    LOG_LEVEL: envalid.str({ default: 'info' }),
    PORT: envalid.num({ default: 8017 }),
    WS_SERVER_URL: envalid.str({ default: 'ws://localhost:8015' }),
    WS_SERVER_PATH: envalid.str({ default: '/jitsi-component-selector/ws' }),
    ASAP_SIGNING_KEY_FILE: envalid.str(),
    ASAP_JWT_KID: envalid.str({ default: '' }),
    ASAP_JWT_ISS: envalid.str({ default: 'jitsi-component-sidecar' }),
    ASAP_JWT_AUD: envalid.str({ default: 'jitsi-component-selector' }),
    REQUEST_TIMEOUT_MS: envalid.num({ default: 8000 }),
    REQUEST_RETRY_COUNT: envalid.num({ default: 2 }),
    START_REQUEST_TIMEOUT_MS: envalid.num({ default: 30000 }),
    STATS_POLLING_INTERVAL: envalid.num({ default: 30 }),
    STATS_REPORTING_INTERVAL: envalid.num({ default: 30 }),
    STATS_RETRIEVE_URL: envalid.str({
        default: ''
    }),
    START_INSTANCE_URL: envalid.str({
        default: ''
    }),
    STOP_INSTANCE_URL: envalid.str({
        default: ''
    }),
    ENABLE_STOP_INSTANCE: envalid.bool({ default: true }),
    ENVIRONMENT: envalid.str(),
    REGION: envalid.str(),
    COMPONENT_TYPE: envalid.str(),
    INSTANCE_KEY: envalid.str(),
    INSTANCE_NICK: envalid.str({ default: 'jibri' }),
    INSTANCE_METADATA: envalid.json({ default: '{}' }),
    INSTANCE_ID: envalid.str({ default: '' }),
    HOSTNAME: envalid.str({ default: '' }),
    VOLATILE_EVENTS: envalid.bool({ default: true }),
    SIP_CLIENT_USERNAME: envalid.str({ default: '' }),
    SIP_CLIENT_PASSWORD: envalid.str({ default: '' })
});

export default {
    LogLevel: env.LOG_LEVEL,
    HTTPServerPort: env.PORT,
    WSServerUrl: env.WS_SERVER_URL,
    WSServerPath: env.WS_SERVER_PATH,
    AsapSigningKeyFile: env.ASAP_SIGNING_KEY_FILE,
    AsapJwtKid: env.ASAP_JWT_KID,
    AsapJwtIss: env.ASAP_JWT_ISS,
    AsapJwtAud: env.ASAP_JWT_AUD,
    RequestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    RequestRetryCount: env.REQUEST_RETRY_COUNT,
    StartRequestTimeoutMs: env.START_REQUEST_TIMEOUT_MS,

    // number of seconds to wait before polling for stats
    StatsPollingInterval: env.STATS_POLLING_INTERVAL,

    // number of seconds to wait before reporting stats
    StatsReportingInterval: env.STATS_REPORTING_INTERVAL,
    StatsRetrieveURL: env.STATS_RETRIEVE_URL,
    StartComponentURL: env.START_INSTANCE_URL,
    StopComponentURL: env.STOP_INSTANCE_URL,
    EnableStopComponent: env.ENABLE_STOP_INSTANCE,
    Environment: env.ENVIRONMENT,
    Region: env.REGION,
    ComponentType: env.COMPONENT_TYPE,
    ComponentKey: env.INSTANCE_KEY,
    ComponentNick: env.INSTANCE_NICK,
    ComponentMetadata: env.INSTANCE_METADATA,
    ComponentId: env.INSTANCE_ID,
    ComponentGroup: env.INSTANCE_GROUP,
    Hostname: env.HOSTNAME,
    VolatileEvents: env.VOLATILE_EVENTS,
    SipClientUserName: env.SIP_CLIENT_USERNAME,
    SipClientPassword: env.SIP_CLIENT_PASSWORD
};

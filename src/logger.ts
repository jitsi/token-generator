import jitsiLogger from '@jitsi/logger';

jitsiLogger.setLogLevel(process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info');

/**
 * An instantiated and configured {@code jitsi logger} instance.
 */
export default jitsiLogger.getUntrackedLogger('jitsi-token-generator', undefined, {
    disableCallerInfo: true
});

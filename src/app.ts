import express from 'express';

// import * as fs from 'fs';

// import AsapRequest from './asap_request';
import config from './config';
import logger from './logger';

const app = express();

logger.info(`Starting up jitsi-component-sidecar service with config: ${JSON.stringify(config)}`);


logger.warn('starting in unprotected api mode');

app.listen(config.HTTPServerPort, () => {
    logger.info(`...listening on :${config.HTTPServerPort}`);
});

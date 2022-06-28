import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import fs from 'fs';

// import * as fs from 'fs';

// import AsapRequest from './asap_request';
import config, { AsapBaseUrlMapping } from './config';
import Handlers from './handlers';
import logger from './logger';
import { GeneratorAuthorization } from './middleware/authorization';
import * as errorHandler from './middleware/error_handler';
import { unless } from './middleware/middleware_utils';
import TokenGenerator from './token_generator';
import { ASAPPubKeyFetcher } from './util/asap';
import * as context from './util/context';

const issToBaseUrlMapping = new Map();

for (const issuer of config.SystemAsapJwtAcceptedHookIss.values()) {
    issToBaseUrlMapping.set(issuer, config.SystemAsapBaseUrlMappings as AsapBaseUrlMapping[]);
}

const systemJwtClaims = {
    asapJwtAcceptedAud: config.SystemAsapJwtAcceptedAud,
    asapJwtAcceptedHookIss: config.SystemAsapJwtAcceptedHookIss
}
const jitsiJwtClaims = {
    asapJwtAcceptedAud: config.SystemAsapJwtAcceptedAud,
    asapJwtAcceptedHookIss: config.SystemAsapJwtAcceptedHookIss
}

const asapFetcher = new ASAPPubKeyFetcher(
    issToBaseUrlMapping,
    new RegExp(config.KidPrefixPattern),
    config.AsapPubKeyTTL
);

const generatorAuthorization = new GeneratorAuthorization({
    asapFetcher,
    protectedApi: config.ProtectedApi,
    systemJwtClaims,
    jitsiJwtClaims
});

const jwtSigningKey = fs.readFileSync(config.AsapSigningKeyFile);

const tokenGenerator = new TokenGenerator({
    signingKey: jwtSigningKey,
    asapJwtIss: config.AsapJwtIss,
    asapJwtAud: config.AsapJwtAud,
    asapJwtKid: config.AsapJwtKid,
    asapJwtSub: config.AsapJwtSub
});

const handlers = new Handlers({ tokenGenerator });

const app = express();

app.get('/health', (req: express.Request, res: express.Response) => {
    res.send('OK');
});

app.use(bodyParser.json());
app.use(express.json());
app.use('/', context.injectContext);

logger.info(`Starting up jitsi-token-generator service with config: ${JSON.stringify(config)}`);

// Use system authorization for the rest of endpoints
const noSystemAuthPaths: string[] = [
    '/jitsi-token-generator/blah'
];

app.use(unless(generatorAuthorization.systemAuthMiddleware, ...noSystemAuthPaths));

// This is placed last in the middleware chain and is our default error handler.
app.use(errorHandler.errorHandlerMiddleware);


app.get('/generate/component', async (req: Request, res: Response, next) => {
    try {
        await handlers.generateComponentToken(req, res);
    } catch (err) {
        next(err);
    }
});

app.get('/generate/server', async (req: Request, res: Response, next) => {
    try {
        await handlers.generateServerToken(req, res);
    } catch (err) {
        next(err);
    }
});
app.post('/generate/component', async (req: Request, res: Response, next) => {
    try {
        await handlers.generateComponentToken(req, res);
    } catch (err) {
        next(err);
    }
});

app.post('/generate/server', async (req: Request, res: Response, next) => {
    try {
        await handlers.generateServerToken(req, res);
    } catch (err) {
        next(err);
    }
});

app.listen(config.HTTPServerPort, () => {
    logger.info(`...listening on :${config.HTTPServerPort}`);
});

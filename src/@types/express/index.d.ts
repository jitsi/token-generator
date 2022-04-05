import { Context } from '../../util/context';

declare global {
    namespace Express {

        /**
         * Overrides Express Request object to attach the custom request Context
         */
        interface Request {
            context: Context;
        }
    }
}

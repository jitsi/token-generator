import express from 'express';

export const unless = (middleware: any, ...paths: string[]) =>
    function(req: express.Request, res: express.Response, next: express.NextFunction) {
        const pathCheck = paths.some(path => path === req.path);

        pathCheck ? next() : middleware(req, res, next);
    };

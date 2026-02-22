import type { Request, Response, NextFunction } from "express";

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const start = Date.now();

    res.on("finish", () => {
        const end = Date.now();

        const request = {
            method: req.method,
            path: req.baseUrl + req.path,
            query: req.query,
            contentType: req.headers["content-type"],
            ip: req.ip,
            responseStatus: res.statusCode,
            responseMessage: res.statusMessage,
            resContentType: res.getHeaders()["content-type"],
            startTime: start,
            endTime: end,
            duration: `${end - start}ms`,
        }

        console.log(request)
    });

    next();
};

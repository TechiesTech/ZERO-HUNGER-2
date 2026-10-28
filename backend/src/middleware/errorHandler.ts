import { Request, Response, NextFunction } from 'express';

/**
 * backend/src/middleware/errorHandler.ts
 * TODO: Implement centralised Express error handler.
 * This must have 4 parameters for Express to recognise it as an error handler.
 *
 * Example:
 *   export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
 *     const status = (err as { status?: number }).status ?? 500;
 *     res.status(status).json({ error: err.message });
 *   }
 */

// Placeholder — satisfies Express's 4-param signature requirement
export function errorHandler(
  _err: Error,
  _req: Request,
  _res: Response,
  _next: NextFunction
): void {
  // TODO: implement
}

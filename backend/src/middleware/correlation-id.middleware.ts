import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const HEADER_NAME = 'x-correlation-id';

/**
 * Correlation ID middleware.
 * Assigns a unique ID to each request for distributed tracing.
 * If the client sends an x-correlation-id header, it is preserved.
 * The ID is set on the response headers and attached to req for logging.
 */
export const correlationId = (req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers[HEADER_NAME] as string) || crypto.randomUUID();

  // Attach to request for downstream use
  (req as any).correlationId = id;

  // Echo back in response headers
  res.setHeader(HEADER_NAME, id);

  next();
};

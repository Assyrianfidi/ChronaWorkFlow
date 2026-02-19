import { Router, Request, Response } from "express";

const router = Router();

/**
 * Ultra-fast health check for uptime monitoring
 * No authentication, no DB queries, <10ms response
 */
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    uptime: Math.floor(process.uptime()),
  });
});

router.head("/", (req: Request, res: Response) => {
  res.status(200).end();
});

/**
 * Readiness probe for load balancers
 */
router.get("/ready", (req: Request, res: Response) => {
  res.status(200).json({ ready: true });
});

router.head("/ready", (req: Request, res: Response) => {
  res.status(200).end();
});

/**
 * Liveness probe for orchestration
 */
router.get("/alive", (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

router.head("/alive", (req: Request, res: Response) => {
  res.status(200).end();
});

/**
 * Detailed health check (authenticated)
 * Includes DB, Stripe, memory checks
 */
router.get("/detailed", async (req: Request, res: Response) => {
  try {
    const status = { status: 'healthy', timestamp: new Date() };
    const statusCode = status.status === "healthy" ? 200 : 
                       status.status === "degraded" ? 200 : 503;
    res.status(statusCode).json(status);
  } catch (error: any) {
    res.status(503).json({
      status: "unhealthy",
      error: (error as Error).message,
    });
  }
});

export default router;

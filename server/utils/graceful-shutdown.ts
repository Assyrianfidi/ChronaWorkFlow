import { logger } from './structured-logger.js';
import { metrics } from './metrics.js';

export class GracefulShutdown {
  private isShuttingDown = false;
  private shutdownTimeoutMs = 30000; // 30 seconds
  private activeConnections = 0;
  private shutdownCallbacks: Array<() => Promise<void>> = [];

  constructor() {
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    // Handle SIGTERM (sent by Kubernetes, Docker, etc.)
    process.on('SIGTERM', () => {
      logger.logShutdown('SIGTERM');
      this.initiateShutdown('SIGTERM');
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.logShutdown('SIGINT');
      this.initiateShutdown('SIGINT');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', error, { type: 'uncaught_exception' });
      this.initiateShutdown('uncaught_exception');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled promise rejection', new Error(String(reason)), { 
        type: 'unhandled_rejection',
        promise: promise.toString()
      });
      this.initiateShutdown('unhandled_rejection');
    });
  }

  // Register shutdown callbacks
  addShutdownCallback(callback: () => Promise<void>): void {
    this.shutdownCallbacks.push(callback);
  }

  // Track active connections
  incrementActiveConnections(): void {
    this.activeConnections++;
    metrics.updateActiveConnections(this.activeConnections);
  }

  decrementActiveConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    metrics.updateActiveConnections(this.activeConnections);
  }

  public async initiateShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress', { signal });
      return;
    }

    this.isShuttingDown = true;
    const shutdownStartTime = Date.now();

    logger.info('Starting graceful shutdown', {
      signal,
      activeConnections: this.activeConnections,
      timeout: this.shutdownTimeoutMs
    });

    // Set a hard timeout for shutdown
    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout', new Error('Shutdown timeout'), {
        duration: Date.now() - shutdownStartTime
      });
      process.exit(1);
    }, this.shutdownTimeoutMs);

    try {
      // Wait for active connections to close (with reasonable timeout)
      if (this.activeConnections > 0) {
        logger.info('Waiting for active connections to close', {
          activeConnections: this.activeConnections
        });
        
        const connectionWaitTimeout = setTimeout(() => {
          logger.warn('Connection wait timeout, proceeding with shutdown', {
            activeConnections: this.activeConnections
          });
        }, 10000); // 10 seconds for connections

        const connectionWaitStart = Date.now();
        while (this.activeConnections > 0 && (Date.now() - connectionWaitStart) < 10000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        clearTimeout(connectionWaitTimeout);
      }

      // Execute shutdown callbacks
      for (const callback of this.shutdownCallbacks) {
        try {
          await callback();
        } catch (error) {
          logger.error('Shutdown callback failed', error as Error, {
            callback: callback.name || 'anonymous'
          });
        }
      }

      const shutdownDuration = Date.now() - shutdownStartTime;
      logger.logShutdownComplete(shutdownDuration);
      
      clearTimeout(shutdownTimeout);
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', error as Error);
      
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  // Check if shutdown is in progress
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }

  // Get shutdown status
  getStatus(): {
    isShuttingDown: boolean;
    activeConnections: number;
    registeredCallbacks: number;
  } {
    return {
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.activeConnections,
      registeredCallbacks: this.shutdownCallbacks.length
    };
  }
}

// Global shutdown manager instance
export const shutdownManager = new GracefulShutdown();

// Database shutdown utilities
export class DatabaseManager {
  private connections: Array<{
    name: string;
    close: () => Promise<void>;
  }> = [];

  // Register a database connection
  registerConnection(name: string, closeFn: () => Promise<void>): void {
    this.connections.push({ name, close: closeFn });
    
    // Register shutdown callback
    shutdownManager.addShutdownCallback(async () => {
      await this.closeAllConnections();
    });
  }

  // Close all database connections
  async closeAllConnections(): Promise<void> {
    logger.info('Closing database connections', {
      connectionCount: this.connections.length
    });

    const closePromises = this.connections.map(async ({ name, close }) => {
      try {
        const startTime = Date.now();
        await close();
        logger.info('Database connection closed', {
          connection: name,
          duration: Date.now() - startTime
        });
      } catch (error) {
        logger.error('Failed to close database connection', error as Error, {
          connection: name
        });
      }
    });

    await Promise.allSettled(closePromises);
    metrics.updateDatabaseConnections(0);
  }

  // Update active connection count
  updateActiveConnectionCount(count: number): void {
    metrics.updateDatabaseConnections(count);
  }
}

// Global database manager instance
export const dbManager = new DatabaseManager();

// Express middleware for connection tracking
export function connectionTrackingMiddleware() {
  return (req: any, res: any, next: any) => {
    if (shutdownManager.isShutdownInProgress()) {
      res.set('Connection', 'close');
      return res.status(503).json({
        error: 'Service shutting down',
        status: 'shutting_down'
      });
    }

    shutdownManager.incrementActiveConnections();
    
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      shutdownManager.decrementActiveConnections();
      originalEnd.apply(res, args);
    };

    // Handle connection close
    req.on('close', () => {
      shutdownManager.decrementActiveConnections();
    });

    next();
  };
}

// Request middleware for observability
export function observabilityMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Add correlation ID to response headers
    const correlationId = req.headers['x-correlation-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.set('X-Correlation-ID', correlationId);

    // Log request
    logger.logRequest(req.method, req.url, {
      correlationId,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress
    });

    // Track response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - startTime;
      
      // Log response
      logger.logResponse(req.method, req.url, res.statusCode, duration, {
        correlationId
      });

      // Record metrics
      metrics.recordRequest(req.method, req.url, res.statusCode, duration);

      originalEnd.apply(res, args);
    };

    next();
  };
}

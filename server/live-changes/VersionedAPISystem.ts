/**
 * ACCUBOOKS VERSIONED API SYSTEM
 * Owner-Level Change Authority - Core Mechanism #2
 * 
 * Rules:
 * - Never break existing APIs
 * - Changes introduced as /v2, /v3, etc.
 * - Old versions supported until explicitly retired
 * - Deprecation warnings logged, not enforced
 */

import { Application, Request, Response, NextFunction } from 'express';

export interface APIVersion {
  version: string; // 'v1', 'v2', etc.
  path: string; // '/api/v1/invoices'
  status: 'active' | 'deprecated' | 'sunset' | 'retired';
  introducedAt: Date;
  deprecatedAt?: Date;
  sunsetAt?: Date; // Stop accepting requests
  retiredAt?: Date; // Fully removed
  breakingChangesFrom?: string[]; // Previous versions this breaks
  migrationGuide?: string;
}

export interface VersionRoutingConfig {
  defaultVersion: string;
  supportedVersions: string[];
  deprecationWarnings: boolean;
  sunsetWarnings: boolean;
}

export class VersionedAPISystem {
  private app: Application;
  private versions: Map<string, APIVersion> = new Map();
  private routes: Map<string, Map<string, Function>> = new Map(); // version -> path -> handler
  private config: VersionRoutingConfig;

  constructor(app: Application, config: VersionRoutingConfig) {
    this.app = app;
    this.config = config;
    this.setupVersionMiddleware();
  }

  /**
   * SETUP VERSION MIDDLEWARE
   * Handles version detection and routing
   */
  private setupVersionMiddleware(): void {
    // Version detection middleware
    this.app.use('/api', (req: Request, res: Response, next: NextFunction) => {
      const requestedVersion = this.detectVersion(req);
      const routePath = req.path.replace(/^\/api\/v\d+/, '');
      
      // Check if version exists
      if (!this.versions.has(requestedVersion)) {
        return res.status(404).json({
          error: 'API version not found',
          requestedVersion,
          availableVersions: Array.from(this.versions.keys()),
          defaultVersion: this.config.defaultVersion
        });
      }

      const version = this.versions.get(requestedVersion)!;

      // Check version status
      if (version.status === 'retired') {
        return res.status(410).json({
          error: 'API version retired',
          message: `Version ${requestedVersion} has been retired. Please migrate to ${this.config.defaultVersion}`,
          migrationGuide: version.migrationGuide
        });
      }

      if (version.status === 'sunset') {
        if (this.config.sunsetWarnings) {
          res.setHeader('X-API-Status', 'sunset');
          res.setHeader('X-API-Sunset-Date', version.sunsetAt!.toISOString());
          res.setHeader('X-API-Migration-Guide', version.migrationGuide || '');
        }
      }

      if (version.status === 'deprecated') {
        if (this.config.deprecationWarnings) {
          res.setHeader('X-API-Status', 'deprecated');
          res.setHeader('X-API-Deprecation-Date', version.deprecatedAt!.toISOString());
          res.setHeader('X-API-Sunset-Date', version.sunsetAt?.toISOString() || '');
        }
      }

      // Attach version info to request
      (req as any).apiVersion = requestedVersion;
      (req as any).apiVersionStatus = version.status;

      // Route to appropriate handler
      const versionRoutes = this.routes.get(requestedVersion);
      if (versionRoutes && versionRoutes.has(routePath)) {
        const handler = versionRoutes.get(routePath)!;
        return handler(req, res, next);
      }

      // Try to fall back to older version if available
      const fallbackVersion = this.findFallbackVersion(requestedVersion, routePath);
      if (fallbackVersion) {
        const fallbackRoutes = this.routes.get(fallbackVersion)!;
        const handler = fallbackRoutes.get(routePath)!;
        
        if (this.config.deprecationWarnings) {
          res.setHeader('X-API-Fallback', fallbackVersion);
        }
        
        return handler(req, res, next);
      }

      next(); // Pass to next middleware (404 handler)
    });
  }

  /**
   * DETECT API VERSION from request
   */
  private detectVersion(req: Request): string {
    // Priority 1: URL path (/api/v2/invoices)
    const pathMatch = req.path.match(/^\/api\/(v\d+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // Priority 2: Accept-Version header
    const headerVersion = req.headers['accept-version'];
    if (headerVersion && typeof headerVersion === 'string') {
      if (this.versions.has(headerVersion)) {
        return headerVersion;
      }
    }

    // Priority 3: X-API-Version header
    const xVersion = req.headers['x-api-version'];
    if (xVersion && typeof xVersion === 'string') {
      if (this.versions.has(xVersion)) {
        return xVersion;
      }
    }

    // Default version
    return this.config.defaultVersion;
  }

  /**
   * FIND FALLBACK VERSION
   * If v3 doesn't have a route, try v2, then v1
   */
  private findFallbackVersion(requestedVersion: string, routePath: string): string | null {
    const versionNum = parseInt(requestedVersion.replace('v', ''));
    
    for (let v = versionNum - 1; v >= 1; v--) {
      const versionKey = `v${v}`;
      const versionRoutes = this.routes.get(versionKey);
      
      if (versionRoutes && versionRoutes.has(routePath)) {
        const version = this.versions.get(versionKey);
        if (version && version.status !== 'retired') {
          return versionKey;
        }
      }
    }
    
    return null;
  }

  /**
   * REGISTER API VERSION
   */
  registerVersion(version: APIVersion): void {
    this.versions.set(version.version, version);
    
    if (!this.routes.has(version.version)) {
      this.routes.set(version.version, new Map());
    }

    console.log(`📡 API Version registered: ${version.version} (${version.status})`);
  }

  /**
   * REGISTER ROUTE for specific version
   */
  registerRoute(
    version: string,
    method: string,
    path: string,
    handler: Function,
    options: {
      featureFlag?: string; // Wrap in feature flag
      accountingSafe?: boolean; // Verify TB before enabling
    } = {}
  ): void {
    const versionRoutes = this.routes.get(version);
    if (!versionRoutes) {
      throw new Error(`Version ${version} not registered. Call registerVersion first.`);
    }

    const fullPath = `${method.toUpperCase()} ${path}`;
    
    // Wrap handler with safety checks
    const safeHandler = this.wrapWithSafety(handler, options);
    
    versionRoutes.set(fullPath, safeHandler);
    console.log(`  ↳ ${method.toUpperCase()} ${path} → ${version}`);
  }

  /**
   * WRAP HANDLER with safety checks
   */
  private wrapWithSecurity(handler: Function, options: any): Function {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Feature flag check
        if (options.featureFlag) {
          const flagEnabled = await this.checkFeatureFlag(options.featureFlag, req);
          if (!flagEnabled) {
            return res.status(404).json({
              error: 'Feature not available',
              featureFlag: options.featureFlag
            });
          }
        }

        // Accounting safety check
        if (options.accountingSafe) {
          const accountingOK = await this.checkAccountingSafety();
          if (!accountingOK) {
            return res.status(503).json({
              error: 'Accounting safety check failed',
              message: 'System is currently unable to process this request safely'
            });
          }
        }

        // Execute handler
        await handler(req, res, next);

      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * INTRODUCE NEW VERSION
   * Safe rollout of new API version
   */
  async introduceVersion(
    newVersion: string,
    basedOn: string,
    changes: {
      added: string[];
      modified: string[];
      removed: string[];
    },
    rolloutConfig: {
      stages: number[];
      monitorDuration: number;
    }
  ): Promise<void> {
    console.log(`🆕 Introducing API version: ${newVersion} (based on ${basedOn})`);
    
    // Register new version
    this.registerVersion({
      version: newVersion,
      path: `/api/${newVersion}`,
      status: 'active',
      introducedAt: new Date(),
      breakingChangesFrom: [basedOn]
    });

    // Log all changes
    console.log('  Changes:');
    changes.added.forEach(c => console.log(`    + ${c}`));
    changes.modified.forEach(c => console.log(`    ~ ${c}`));
    changes.removed.forEach(c => console.log(`    - ${c}`));

    // Gradual rollout
    for (const percentage of rolloutConfig.stages) {
      console.log(`  → Rolling out to ${percentage}% of traffic...`);
      
      // In production: Update load balancer routing rules
      await this.setVersionTrafficSplit({
        [newVersion]: percentage,
        [basedOn]: 100 - percentage
      });

      // Monitor
      await this.monitorVersionHealth(newVersion, rolloutConfig.monitorDuration);
    }

    console.log(`✅ API ${newVersion} fully deployed`);
  }

  /**
   * DEPRECATE VERSION
   * Mark version as deprecated with sunset timeline
   */
  async deprecateVersion(
    version: string,
    sunsetMonths: number,
    migrationGuide: string
  ): Promise<void> {
    const v = this.versions.get(version);
    if (!v) throw new Error(`Version ${version} not found`);

    v.status = 'deprecated';
    v.deprecatedAt = new Date();
    v.sunsetAt = new Date();
    v.sunsetAt.setMonth(v.sunsetAt.getMonth() + sunsetMonths);
    v.migrationGuide = migrationGuide;

    console.log(`⚠️  API ${version} deprecated`);
    console.log(`   Sunset date: ${v.sunsetAt.toISOString()}`);
    console.log(`   Migration guide: ${migrationGuide}`);

    // Notify all clients using this version
    await this.notifyVersionDeprecation(version, v.sunsetAt, migrationGuide);
  }

  /**
   * RETIRE VERSION
   * Final removal of version
   */
  async retireVersion(version: string): Promise<void> {
    const v = this.versions.get(version);
    if (!v) throw new Error(`Version ${version} not found`);

    // Check if any traffic is still hitting this version
    const traffic = await this.getVersionTraffic(version);
    if (traffic > 0) {
      throw new Error(`Cannot retire ${version}: still receiving ${traffic} req/min`);
    }

    v.status = 'retired';
    v.retiredAt = new Date();

    console.log(`🗑️  API ${version} retired`);
  }

  /**
   * GET VERSION STATISTICS
   */
  async getVersionStats(): Promise<any> {
    const stats: any = {};
    
    for (const [version, data] of this.versions) {
      const traffic = await this.getVersionTraffic(version);
      const errorRate = await this.getVersionErrorRate(version);
      
      stats[version] = {
        status: data.status,
        traffic: `${traffic} req/min`,
        errorRate: `${(errorRate * 100).toFixed(2)}%`,
        introduced: data.introducedAt,
        deprecated: data.deprecatedAt,
        sunset: data.sunsetAt,
        retired: data.retiredAt
      };
    }

    return stats;
  }

  /**
   * UTILITY METHODS
   */
  private async checkFeatureFlag(flagName: string, req: Request): Promise<boolean> {
    // Check with feature flag system
    const result = await fetch(`http://localhost:3000/internal/flags/${flagName}/check`, {
      headers: {
        'X-Company-ID': (req as any).companyId || 'unknown',
        'X-User-ID': (req as any).userId || 'unknown'
      }
    });
    return result.ok;
  }

  private async checkAccountingSafety(): Promise<boolean> {
    // Check with financial integrity guard
    const result = await fetch('http://localhost:3000/internal/accounting/safety-check');
    return result.ok;
  }

  private async setVersionTrafficSplit(splits: Record<string, number>): Promise<void> {
    // In production: Update load balancer or API gateway
    console.log('   Traffic split:', JSON.stringify(splits));
  }

  private async monitorVersionHealth(version: string, durationMs: number): Promise<void> {
    console.log(`   Monitoring ${version} for ${durationMs / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, durationMs));
    
    const errorRate = await this.getVersionErrorRate(version);
    if (errorRate > 0.01) { // 1% error threshold
      throw new Error(`Version ${version} has high error rate: ${errorRate}`);
    }
  }

  private async getVersionTraffic(version: string): Promise<number> {
    // In production: Query metrics from Datadog/CloudWatch
    return 0; // Placeholder
  }

  private async getVersionErrorRate(version: string): Promise<number> {
    // In production: Query metrics
    return 0; // Placeholder
  }

  private async notifyVersionDeprecation(
    version: string, 
    sunsetDate: Date, 
    guide: string
  ): Promise<void> {
    // Log to audit trail
    console.log(`   Notifying clients of ${version} deprecation`);
    // In production: Email/webhook to registered API consumers
  }
}

export default VersionedAPISystem;

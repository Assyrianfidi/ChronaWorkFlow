// Database connection setup using javascript_database blueprint
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "../shared/schema";
import { getDatabaseConfig } from "./config/env-validation";
import { getDatabasePoolConfig } from "./config/database-pool";

const connectionString = getDatabaseConfig();

function isNeonConnectionString(url: string): boolean {
  // Neon typically uses hosts like: ep-xxx-yyy.us-east-2.aws.neon.tech
  // Keep this conservative so local/dev postgres uses the standard pg driver.
  return /(^|\.)neon\.tech\b/i.test(url) || /pooler\./i.test(url);
}

export const pool = (() => {
  const poolConfig = {
    connectionString,
    ...getDatabasePoolConfig(),
  };

  if (isNeonConnectionString(connectionString)) {
    neonConfig.webSocketConstructor = ws;
    return new NeonPool(poolConfig);
  }
  return new PgPool(poolConfig);
})();

export const db = (() => {
  if (isNeonConnectionString(connectionString)) {
    return drizzleNeon({ client: pool as any, schema });
  }
  return drizzlePg({ client: pool as any, schema });
})();

// Database connection setup using javascript_database blueprint
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { getDatabaseConfig } from "./config/env-validation";

neonConfig.webSocketConstructor = ws;

const connectionString = getDatabaseConfig();

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });

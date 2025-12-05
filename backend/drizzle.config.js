"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
dotenv.config({ path: '.env' });
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
exports.default = {
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
    tablesFilter: ['!libsql_wasm_func_table'],
};

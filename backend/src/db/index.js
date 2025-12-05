"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sql = exports.db = void 0;
exports.executeQuery = executeQuery;
exports.transaction = transaction;
exports.closeConnection = closeConnection;
var postgres_1 = require("postgres");
var postgres_js_1 = require("drizzle-orm/postgres-js");
var schema = require("./schema.js");
var config_js_1 = require("../config/config.js");
var env = config_js_1.config;
// Parse the database URL
var connectionString = env.database.url;
// Remove the schema parameter from the connection string if it exists
if (connectionString.includes('schema=')) {
    connectionString = connectionString.replace(/[?&]schema=[^&]*(?:&|$)/, '');
    // Remove trailing ? if it's the only parameter
    connectionString = connectionString.replace(/\?$/, '');
}
if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables');
}
// Disable prepared statements for transactions
var client = (0, postgres_1.default)(connectionString, {
    prepare: false,
    ssl: env.isProduction ? { rejectUnauthorized: false } : false,
    max: 20,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    // Set the schema in the connection options if supported by the database
    // This is a safer approach than using URL parameters
    connection: {
        // Default schema is 'public' if not specified
        search_path: 'public',
    },
});
// Create a single connection pool for the application
exports.db = Object.assign((0, postgres_js_1.drizzle)(client, {
    schema: schema,
    logger: !env.isProduction,
}), { $client: client });
// Set the schema for all queries
// This ensures the schema is set even if the connection option above doesn't work
client(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SET search_path TO public"], ["SET search_path TO public"]))).catch(console.error);
var drizzle_orm_1 = require("drizzle-orm");
Object.defineProperty(exports, "sql", { enumerable: true, get: function () { return drizzle_orm_1.sql; } });
// Helper function to execute raw SQL queries
function executeQuery(query, params) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.unsafe(query, params || [])];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
// Helper function for transactions
function transaction(callback) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, callback(tx)];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    });
                }); })];
        });
    });
}
// Close the database connection
function closeConnection() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.end()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Handle application shutdown
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, closeConnection()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, closeConnection()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
var templateObject_1;

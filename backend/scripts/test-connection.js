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
var postgres_1 = require("postgres");
var config_js_1 = require("../src/config/config.js");
function testConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var connectionString, sql, result, tables, _i, tables_1, table, columns, _a, columns_1, col, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 11, , 12]);
                    connectionString = config_js_1.config.database.url;
                    if (!connectionString) {
                        console.error('❌ DATABASE_URL is not defined in environment variables');
                        process.exit(1);
                    }
                    console.log('🔌 Testing database connection...');
                    console.log('Connection string:', connectionString.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@'));
                    sql = (0, postgres_1.default)(connectionString, {
                        max: 1,
                        idle_timeout: 5,
                        max_lifetime: 10,
                        ssl: config_js_1.config.isProduction ? { rejectUnauthorized: false } : false,
                    });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 8, 10]);
                    return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT NOW() as now"], ["SELECT NOW() as now"])))];
                case 2:
                    result = (_b.sent())[0];
                    console.log('✅ Database connection successful');
                    console.log('Current database time:', result.now);
                    // List all tables in the public schema
                    console.log('\n📋 Listing tables in public schema...');
                    return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        SELECT table_name \n        FROM information_schema.tables \n        WHERE table_schema = 'public';\n      "], ["\n        SELECT table_name \n        FROM information_schema.tables \n        WHERE table_schema = 'public';\n      "])))];
                case 3:
                    tables = _b.sent();
                    console.log('\n📋 Tables in public schema:');
                    _i = 0, tables_1 = tables;
                    _b.label = 4;
                case 4:
                    if (!(_i < tables_1.length)) return [3 /*break*/, 7];
                    table = tables_1[_i];
                    console.log("\nTable: ".concat(table.table_name));
                    return [4 /*yield*/, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n          SELECT column_name, data_type, is_nullable, column_default\n          FROM information_schema.columns \n          WHERE table_schema = 'public' AND table_name = ", "\n          ORDER BY ordinal_position;\n        "], ["\n          SELECT column_name, data_type, is_nullable, column_default\n          FROM information_schema.columns \n          WHERE table_schema = 'public' AND table_name = ", "\n          ORDER BY ordinal_position;\n        "])), table.table_name)];
                case 5:
                    columns = _b.sent();
                    console.log('  Columns:');
                    for (_a = 0, columns_1 = columns; _a < columns_1.length; _a++) {
                        col = columns_1[_a];
                        console.log("    - ".concat(col.column_name, " (").concat(col.data_type, ")"));
                    }
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/, true];
                case 8: 
                // Close the connection
                return [4 /*yield*/, sql.end()];
                case 9:
                    // Close the connection
                    _b.sent();
                    return [7 /*endfinally*/];
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_1 = _b.sent();
                    console.error('❌ Error testing database connection:', error_1);
                    return [2 /*return*/, false];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// Run the test
testConnection()
    .then(function (success) {
    process.exit(success ? 0 : 1);
})
    .catch(function (error) {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
var templateObject_1, templateObject_2, templateObject_3;

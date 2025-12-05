"use strict";
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
var index_js_1 = require("../src/db/index.js");
function executeQuery(query) {
    return __awaiter(this, void 0, void 0, function () {
        var result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('\n🔍 Executing query:', query);
                    return [4 /*yield*/, index_js_1.db.$client.unsafe(query)];
                case 1:
                    result = _a.sent();
                    console.log('✅ Query executed successfully');
                    return [2 /*return*/, result];
                case 2:
                    error_1 = _a.sent();
                    console.error('❌ Query failed:', error_1.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function checkSchema() {
    return __awaiter(this, void 0, void 0, function () {
        var usersTable, allTables, _i, allTables_1, table, tableName, tableSchema, migrationsTable, appliedMigrations, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 11, 12, 14]);
                    console.log('🔍 Checking database schema...');
                    return [4 /*yield*/, executeQuery("\n      SELECT column_name, data_type, is_nullable, column_default\n      FROM information_schema.columns \n      WHERE table_schema = 'public' AND table_name = 'users';\n    ")];
                case 1:
                    usersTable = _a.sent();
                    if (usersTable && usersTable.length > 0) {
                        console.log('\n📋 Users table schema:');
                        console.table(usersTable);
                    }
                    else {
                        console.log('\n❌ Users table does not exist or is empty');
                    }
                    return [4 /*yield*/, executeQuery("\n      SELECT table_name \n      FROM information_schema.tables \n      WHERE table_schema = 'public';\n    ")];
                case 2:
                    allTables = _a.sent();
                    if (!(allTables && allTables.length > 0)) return [3 /*break*/, 6];
                    console.log('\n📋 All tables in public schema:');
                    console.table(allTables);
                    _i = 0, allTables_1 = allTables;
                    _a.label = 3;
                case 3:
                    if (!(_i < allTables_1.length)) return [3 /*break*/, 6];
                    table = allTables_1[_i];
                    tableName = table.table_name;
                    return [4 /*yield*/, executeQuery("\n          SELECT column_name, data_type, is_nullable, column_default\n          FROM information_schema.columns \n          WHERE table_schema = 'public' AND table_name = '".concat(tableName, "';\n        "))];
                case 4:
                    tableSchema = _a.sent();
                    if (tableSchema) {
                        console.log("\n\uD83D\uDCCB Table: ".concat(tableName));
                        console.table(tableSchema);
                    }
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, executeQuery("\n      SELECT column_name, data_type, is_nullable, column_default\n      FROM information_schema.columns \n      WHERE table_schema = 'public' AND table_name = '_migrations';\n    ")];
                case 7:
                    migrationsTable = _a.sent();
                    if (!(migrationsTable && migrationsTable.length > 0)) return [3 /*break*/, 9];
                    console.log('\n📋 _migrations table schema:');
                    console.table(migrationsTable);
                    return [4 /*yield*/, executeQuery('SELECT * FROM _migrations ORDER BY id;')];
                case 8:
                    appliedMigrations = _a.sent();
                    if (appliedMigrations) {
                        console.log('\n📋 Applied migrations:');
                        console.table(appliedMigrations);
                    }
                    return [3 /*break*/, 10];
                case 9:
                    console.log('\n❌ _migrations table does not exist');
                    _a.label = 10;
                case 10: return [3 /*break*/, 14];
                case 11:
                    error_2 = _a.sent();
                    console.error('❌ Error checking schema:', error_2);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, index_js_1.db.$client.end()];
                case 13:
                    _a.sent();
                    process.exit(0);
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
checkSchema();

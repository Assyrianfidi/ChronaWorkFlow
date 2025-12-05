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
var schema_js_1 = require("../src/db/schema.js");
var drizzle_orm_1 = require("drizzle-orm");
function testConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var client, result, now, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    console.log('🔌 Testing database connection...');
                    console.log('Executing query: SELECT NOW() as now');
                    client = index_js_1.db.$client;
                    return [4 /*yield*/, client.unsafe('SELECT NOW() as now')];
                case 1:
                    result = _b.sent();
                    console.log('Query result:', JSON.stringify(result, null, 2));
                    if (!result || !Array.isArray(result) || result.length === 0) {
                        throw new Error('No valid result returned from query');
                    }
                    now = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.now;
                    if (!now) {
                        throw new Error('Could not get current time from database');
                    }
                    console.log('✅ Database connection successful');
                    console.log('Current database time:', now);
                    return [2 /*return*/, true];
                case 2:
                    error_1 = _b.sent();
                    console.error('❌ Database connection failed:', error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function testUserRepository() {
    return __awaiter(this, void 0, void 0, function () {
        var newUser, createdUser, foundUser, updateData, updatedUser, deletedUser, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    console.log('\n🧪 Testing User Repository...');
                    // Test creating a user
                    console.log('Creating test user...');
                    newUser = {
                        name: 'Test User',
                        email: "test-".concat(Date.now(), "@example.com"),
                        password: 'hashedpassword123',
                        role: 'user', // Ensure type safety with 'as const'
                        isActive: true,
                        // Add default values for required fields
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    // Log the user data being inserted
                    console.log('User data to insert:', JSON.stringify(newUser, null, 2));
                    console.log('Inserting user with data:', JSON.stringify(newUser, null, 2));
                    return [4 /*yield*/, index_js_1.db.insert(schema_js_1.users).values(newUser).returning()];
                case 1:
                    createdUser = (_a.sent())[0];
                    console.log('✅ Created user:', createdUser);
                    // Test finding the user by ID
                    console.log('\nFinding user by ID...');
                    console.log('Looking for user with ID:', createdUser.id);
                    return [4 /*yield*/, index_js_1.db.select().from(schema_js_1.users).where((0, drizzle_orm_1.eq)(schema_js_1.users.id, createdUser.id))];
                case 2:
                    foundUser = _a.sent();
                    console.log('Found user:', JSON.stringify(foundUser, null, 2));
                    console.log('✅ Found user by ID:', foundUser[0]);
                    // Test updating the user
                    console.log('\nUpdating user...');
                    updateData = {
                        name: 'Updated Test User',
                        updatedAt: new Date()
                    };
                    console.log('Updating user with data:', JSON.stringify(updateData, null, 2));
                    return [4 /*yield*/, index_js_1.db
                            .update(schema_js_1.users)
                            .set(updateData)
                            .where((0, drizzle_orm_1.eq)(schema_js_1.users.id, createdUser.id))
                            .returning()];
                case 3:
                    updatedUser = _a.sent();
                    console.log('Updated user:', JSON.stringify(updatedUser, null, 2));
                    console.log('✅ Updated user:', updatedUser[0]);
                    // Test deleting the user
                    console.log('\nDeleting user...');
                    console.log('Deleting user with ID:', createdUser.id);
                    return [4 /*yield*/, index_js_1.db.delete(schema_js_1.users).where((0, drizzle_orm_1.eq)(schema_js_1.users.id, createdUser.id))];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, index_js_1.db.select().from(schema_js_1.users).where((0, drizzle_orm_1.eq)(schema_js_1.users.id, createdUser.id))];
                case 5:
                    deletedUser = _a.sent();
                    if (deletedUser.length === 0) {
                        console.log('✅ User successfully deleted');
                    }
                    else {
                        console.log('❌ User was not deleted:', deletedUser);
                        throw new Error('User was not deleted');
                    }
                    return [2 /*return*/, true];
                case 6:
                    error_2 = _a.sent();
                    console.error('❌ User repository test failed:', error_2);
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var connectionSuccess, repositorySuccess;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Starting database tests...\n');
                    return [4 /*yield*/, testConnection()];
                case 1:
                    connectionSuccess = _a.sent();
                    if (!connectionSuccess) {
                        console.error('❌ Database tests aborted due to connection failure');
                        process.exit(1);
                    }
                    return [4 /*yield*/, testUserRepository()];
                case 2:
                    repositorySuccess = _a.sent();
                    console.log('\n📊 Test Results:');
                    console.log("- Database Connection: ".concat(connectionSuccess ? '✅ PASSED' : '❌ FAILED'));
                    console.log("- User Repository: ".concat(repositorySuccess ? '✅ PASSED' : '❌ FAILED'));
                    // Close the database connection
                    return [4 /*yield*/, (0, index_js_1.closeConnection)()];
                case 3:
                    // Close the database connection
                    _a.sent();
                    process.exit(repositorySuccess ? 0 : 1);
                    return [2 /*return*/];
            }
        });
    });
}
runTests().catch(function (error) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error('Test failed:', error);
                return [4 /*yield*/, (0, index_js_1.closeConnection)().catch(console.error)];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });

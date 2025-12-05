"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import the service and dependencies
var auth_service_js_1 = require("../services/auth.service.js");
var prisma_js_1 = require("../utils/prisma.js");
var errors_js_1 = require("../utils/errors.js");
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
// Mock the dependencies
jest.mock('../utils/prisma.js', function () { return ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}); });
jest.mock('bcryptjs', function () { return ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
}); });
jest.mock('jsonwebtoken', function () { return ({
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@example.com' }),
    default: {
        sign: jest.fn().mockReturnValue('test-token'),
        verify: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@example.com' }),
    },
    __esModule: true,
}); });
// Get the mock functions
var mockFindUnique = prisma_js_1.prisma.user.findUnique;
var mockCreate = prisma_js_1.prisma.user.create;
var mockHash = bcryptjs_1.default.hash;
var mockCompare = bcryptjs_1.default.compare;
var mockSign = jsonwebtoken_1.default.sign;
// Setup the mock implementations
beforeEach(function () {
    // Reset all mocks
    jest.clearAllMocks();
    // Setup default mocks
    mockHash.mockResolvedValue('hashedPassword');
    mockCompare.mockResolvedValue(true);
    mockSign.mockReturnValue('test-token');
});
describe('AuthService', function () {
    var authService;
    // Mock data
    var mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(function () {
        // Create a new instance of AuthService before each test
        authService = new auth_service_js_1.AuthService();
    });
    describe('register', function () {
        it('should register a new user successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userData, createdUser, result, password, expectedUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userData = {
                            email: 'test@example.com',
                            password: 'password123',
                            name: 'Test User',
                        };
                        // Mock prisma.user.findUnique to return null (user doesn't exist)
                        mockFindUnique.mockResolvedValueOnce(null);
                        createdUser = {
                            id: 1,
                            email: userData.email,
                            name: userData.name,
                            password: 'hashedPassword',
                            role: 'USER',
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        // Mock prisma.user.create to return the created user
                        mockCreate.mockResolvedValueOnce(createdUser);
                        return [4 /*yield*/, authService.register(userData)];
                    case 1:
                        result = _a.sent();
                        // Verify the results
                        expect(mockFindUnique).toHaveBeenCalledWith({
                            where: { email: userData.email },
                        });
                        expect(bcryptjs_1.default.hash).toHaveBeenCalledWith(userData.password, 10);
                        expect(mockCreate).toHaveBeenCalledWith({
                            data: {
                                email: userData.email,
                                password: 'hashedPassword',
                                name: userData.name,
                            },
                        });
                        password = createdUser.password, expectedUser = __rest(createdUser, ["password"]);
                        expect(result).toEqual(expectedUser);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw an error if user already exists', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock prisma.user.findUnique to return a user (user already exists)
                        mockFindUnique.mockResolvedValue(__assign(__assign({}, mockUser), { password: 'hashedPassword' }));
                        userData = {
                            email: 'existing@example.com',
                            password: 'password123',
                            name: 'Existing User',
                        };
                        // Verify that the register method throws an error
                        return [4 /*yield*/, expect(authService.register(userData)).rejects.toThrow('User already exists')];
                    case 1:
                        // Verify that the register method throws an error
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, authService.register(userData)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        expect(error_1).toBeInstanceOf(errors_js_1.ApiError);
                        if (error_1 instanceof errors_js_1.ApiError) {
                            expect(error_1.statusCode).toBe(400);
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    });
    describe('login', function () {
        it('should login a user with valid credentials', function () { return __awaiter(void 0, void 0, void 0, function () {
            var credentials, mockUserWithPassword, result, password, userWithoutPassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credentials = {
                            email: 'test@example.com',
                            password: 'password123',
                        };
                        mockUserWithPassword = {
                            id: 1,
                            email: credentials.email,
                            name: 'Test User',
                            password: 'hashedPassword',
                            role: 'USER',
                            isActive: true,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        // Set up the mocks
                        mockFindUnique.mockResolvedValueOnce(mockUserWithPassword);
                        mockCompare.mockResolvedValueOnce(true);
                        mockSign.mockReturnValueOnce('test-token');
                        return [4 /*yield*/, authService.login(credentials)];
                    case 1:
                        result = _a.sent();
                        // Verify the results
                        expect(mockFindUnique).toHaveBeenCalledWith({
                            where: { email: credentials.email },
                        });
                        expect(bcryptjs_1.default.compare).toHaveBeenCalledWith(credentials.password, mockUserWithPassword.password);
                        expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: mockUser.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
                        password = mockUserWithPassword.password, userWithoutPassword = __rest(mockUserWithPassword, ["password"]);
                        expect(result).toEqual(__assign(__assign({}, userWithoutPassword), { token: 'test-token' }));
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw an error for invalid credentials', function () { return __awaiter(void 0, void 0, void 0, function () {
            var credentials, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credentials = {
                            email: 'test@example.com',
                            password: 'wrongpassword',
                        };
                        // Mock prisma.user.findUnique to return a user with hashed password
                        mockFindUnique.mockResolvedValueOnce(__assign(__assign({}, mockUser), { password: 'hashedPassword' }));
                        // Mock bcrypt.compare to return false (invalid password)
                        mockCompare.mockResolvedValueOnce(false);
                        // Verify that the login method throws an error
                        return [4 /*yield*/, expect(authService.login(credentials)).rejects.toThrow('Invalid credentials')];
                    case 1:
                        // Verify that the login method throws an error
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, authService.login(credentials)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        expect(error_2).toBeInstanceOf(errors_js_1.ApiError);
                        if (error_2 instanceof errors_js_1.ApiError) {
                            expect(error_2.statusCode).toBe(401);
                        }
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    });
});

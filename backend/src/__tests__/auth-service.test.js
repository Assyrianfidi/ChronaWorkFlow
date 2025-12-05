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
var auth_service_js_1 = require("../services/auth.service.js");
// Import the prisma client
var prisma_js_1 = require("../utils/prisma.js");
// Mock the prisma client
jest.mock('../utils/prisma.js', function () { return ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        $disconnect: jest.fn(),
    },
}); });
var bcryptjs_1 = require("bcryptjs");
var jsonwebtoken_1 = require("jsonwebtoken");
var errors_js_1 = require("../utils/errors.js");
// Mock the dependencies
jest.mock('../utils/prisma.js');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
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
    // Mock Prisma methods
    var mockFindUnique = prisma_js_1.prisma.user.findUnique;
    var mockCreate = prisma_js_1.prisma.user.create;
    beforeEach(function () {
        // Reset all mocks
        jest.clearAllMocks();
        // Setup bcrypt mocks
        bcryptjs_1.default.hash.mockResolvedValue('hashedPassword');
        bcryptjs_1.default.compare.mockResolvedValue(true);
        // Setup JWT mock
        jsonwebtoken_1.default.sign.mockReturnValue('test-token');
        // Create a new instance of AuthService
        authService = new auth_service_js_1.AuthService();
    });
    describe('register', function () {
        it('should register a new user successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userData, result, password, expectedUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userData = {
                            email: 'test@example.com',
                            password: 'password123',
                            name: 'Test User',
                        };
                        mockFindUnique.mockResolvedValue(null);
                        mockCreate.mockResolvedValue(mockUser);
                        return [4 /*yield*/, authService.register(userData)];
                    case 1:
                        result = _a.sent();
                        // Assert
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
                        password = mockUser.password, expectedUser = __rest(mockUser, ["password"]);
                        expect(result.user).toEqual(expectedUser);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw an error if user already exists', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userData = {
                            email: 'existing@example.com',
                            password: 'password123',
                            name: 'Existing User',
                        };
                        mockFindUnique.mockResolvedValue(mockUser);
                        // Act & Assert
                        return [4 /*yield*/, expect(authService.register(userData)).rejects.toThrow('User already exists')];
                    case 1:
                        // Act & Assert
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
            var credentials, result, password, userWithoutPassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credentials = {
                            email: 'test@example.com',
                            password: 'password123',
                        };
                        mockFindUnique.mockResolvedValue(mockUser);
                        bcryptjs_1.default.compare.mockResolvedValue(true);
                        return [4 /*yield*/, authService.login(credentials)];
                    case 1:
                        result = _a.sent();
                        // Assert
                        expect(mockFindUnique).toHaveBeenCalledWith({
                            where: { email: credentials.email },
                        });
                        expect(bcryptjs_1.default.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
                        expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ userId: mockUser.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1d' });
                        password = mockUser.password, userWithoutPassword = __rest(mockUser, ["password"]);
                        expect(result).toEqual({
                            user: userWithoutPassword,
                            tokens: expect.any(Object),
                        });
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
                        mockFindUnique.mockResolvedValue(mockUser);
                        bcryptjs_1.default.compare.mockResolvedValue(false);
                        // Act & Assert
                        return [4 /*yield*/, expect(authService.login(credentials)).rejects.toThrow('Invalid credentials')];
                    case 1:
                        // Act & Assert
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
    describe('getCurrentUser', function () {
        it('should return the current user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, expectedUser, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 1;
                        expectedUser = {
                            id: userId,
                            email: 'test@example.com',
                            name: 'Test User',
                            role: 'USER',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        mockFindUnique.mockResolvedValue(expectedUser);
                        return [4 /*yield*/, authService.getCurrentUser(userId)];
                    case 1:
                        result = _a.sent();
                        // Assert
                        expect(mockFindUnique).toHaveBeenCalledWith({
                            where: { id: userId },
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                role: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        });
                        expect(result).toEqual(expectedUser);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw an error if user is not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 999;
                        mockFindUnique.mockResolvedValue(null);
                        // Act & Assert
                        return [4 /*yield*/, expect(authService.getCurrentUser(userId)).rejects.toThrow('User not found')];
                    case 1:
                        // Act & Assert
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});

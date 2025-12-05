"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var globals_1 = require("@jest/globals");
var http_status_codes_1 = require("http-status-codes");
// Mock all dependencies
var mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    generateAccessToken: jest.fn(),
    changePassword: jest.fn(),
};
var mockRefreshTokenService = {
    createRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    invalidateRefreshToken: jest.fn(),
    invalidateUserRefreshTokens: jest.fn(),
    getRefreshTokenExpiry: jest.fn(function () { return 30; }),
};
var mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
};
jest.mock('../services/auth.service', function () { return ({
    authService: mockAuthService,
}); });
jest.mock('../services/refreshToken.service.ts', function () { return ({
    RefreshTokenService: mockRefreshTokenService,
}); });
jest.mock('../utils/logger.ts', function () { return ({
    logger: mockLogger,
}); });
jest.mock('../utils/errors', function () { return ({
    ApiError: /** @class */ (function (_super) {
        __extends(ApiError, _super);
        function ApiError(statusCode, message, errors) {
            var _this = _super.call(this, message) || this;
            _this.statusCode = statusCode;
            _this.errors = errors;
            return _this;
        }
        return ApiError;
    }(Error)),
}); });
jest.mock('../config/config', function () { return ({
    config: {
        jwt: {
            secret: 'test-secret',
        },
    },
}); });
(0, globals_1.describe)('Auth Controller - Simple Tests', function () {
    var mockRequest;
    var mockResponse;
    var nextFunction;
    (0, globals_1.beforeEach)(function () {
        jest.clearAllMocks();
        // Setup mock request/response
        mockRequest = {
            body: {},
            cookies: {},
            ip: '127.0.0.1',
            user: { id: 1, role: 'USER' },
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn(),
            send: jest.fn(),
        };
        nextFunction = jest.fn();
    });
    (0, globals_1.describe)('login', function () {
        (0, globals_1.it)('should login user successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var login, mockUser, mockTokens, mockRefreshToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        login = (_a.sent()).login;
                        mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
                        mockTokens = { accessToken: 'access-token', expiresIn: 900 };
                        mockRefreshToken = 'refresh-token';
                        mockRequest.body = {
                            email: 'test@example.com',
                            password: 'password123',
                        };
                        mockAuthService.login.mockResolvedValue({ user: mockUser, tokens: mockTokens });
                        mockRefreshTokenService.createRefreshToken.mockResolvedValue(mockRefreshToken);
                        return [4 /*yield*/, login(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(mockAuthService.login).toHaveBeenCalledWith({
                            email: 'test@example.com',
                            password: 'password123',
                        });
                        (0, globals_1.expect)(mockRefreshTokenService.createRefreshToken).toHaveBeenCalledWith(1);
                        (0, globals_1.expect)(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', mockRefreshToken, globals_1.expect.objectContaining({
                            httpOnly: true,
                            secure: false, // NODE_ENV is test
                            sameSite: 'strict',
                            path: '/',
                        }));
                        (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(http_status_codes_1.StatusCodes.OK);
                        (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                            success: true,
                            data: {
                                user: mockUser,
                                accessToken: 'access-token',
                                expiresIn: 900,
                            },
                        });
                        (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('User logged in: test@example.com (ID: 1) from IP: 127.0.0.1');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle validation errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var login;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        login = (_a.sent()).login;
                        mockRequest.body = {
                            email: 'invalid-email',
                            password: '123', // Too short
                        };
                        return [4 /*yield*/, login(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(nextFunction).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should handle authentication errors', function () { return __awaiter(void 0, void 0, void 0, function () {
            var login;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        login = (_a.sent()).login;
                        mockRequest.body = {
                            email: 'test@example.com',
                            password: 'wrongpassword',
                        };
                        mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
                        return [4 /*yield*/, login(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(nextFunction).toHaveBeenCalledWith(globals_1.expect.any(Error));
                        (0, globals_1.expect)(mockLogger.error).toHaveBeenCalledWith('Login failed for email: test@example.com from IP: 127.0.0.1');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('register', function () {
        (0, globals_1.it)('should register new user successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var register, mockUser, mockTokens, mockRefreshToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        register = (_a.sent()).register;
                        mockUser = { id: 2, email: 'new@example.com', name: 'New User' };
                        mockTokens = { accessToken: 'access-token', expiresIn: 900 };
                        mockRefreshToken = 'refresh-token';
                        mockRequest.body = {
                            name: 'New User',
                            email: 'new@example.com',
                            password: 'password123',
                        };
                        mockAuthService.register.mockResolvedValue({ user: mockUser, tokens: mockTokens });
                        mockRefreshTokenService.createRefreshToken.mockResolvedValue(mockRefreshToken);
                        return [4 /*yield*/, register(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(mockAuthService.register).toHaveBeenCalledWith({
                            name: 'New User',
                            email: 'new@example.com',
                            password: 'password123',
                        });
                        (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(http_status_codes_1.StatusCodes.CREATED);
                        (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                            success: true,
                            data: {
                                user: mockUser,
                                accessToken: 'access-token',
                                expiresIn: 900,
                            },
                        });
                        (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('User registered: new@example.com (ID: 2) from IP: 127.0.0.1');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('refreshToken', function () {
        (0, globals_1.it)('should refresh access token successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var authModule, refreshToken, mockRefreshToken, mockNewRefreshToken, mockUser, mockTokens;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        authModule = _a.sent();
                        refreshToken = authModule.refreshToken;
                        mockRefreshToken = 'valid-refresh-token';
                        mockNewRefreshToken = 'new-refresh-token';
                        mockUser = { id: 1, email: 'test@example.com', role: 'USER' };
                        mockTokens = { accessToken: 'new-access-token', expiresIn: 900 };
                        mockRequest.cookies = { refreshToken: mockRefreshToken };
                        mockRefreshTokenService.rotateRefreshToken.mockResolvedValue(mockNewRefreshToken);
                        mockRefreshTokenService.verifyRefreshToken.mockResolvedValue({ user: mockUser });
                        mockAuthService.generateAccessToken.mockResolvedValue(mockTokens);
                        return [4 /*yield*/, refreshToken(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(mockRefreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
                        (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(http_status_codes_1.StatusCodes.OK);
                        (0, globals_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                            success: true,
                            data: {
                                accessToken: 'new-access-token',
                                expiresIn: 900,
                            },
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should reject missing refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var refreshToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        refreshToken = (_a.sent()).refreshToken;
                        mockRequest.cookies = {};
                        return [4 /*yield*/, refreshToken(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(nextFunction).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                            message: 'No refresh token provided',
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('logout', function () {
        (0, globals_1.it)('should logout user successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var logout, mockRefreshToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        logout = (_a.sent()).logout;
                        mockRefreshToken = 'valid-refresh-token';
                        mockRequest.cookies = { refreshToken: mockRefreshToken };
                        mockRefreshTokenService.invalidateRefreshToken.mockResolvedValue(undefined);
                        return [4 /*yield*/, logout(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(mockRefreshTokenService.invalidateRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
                        (0, globals_1.expect)(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', globals_1.expect.objectContaining({
                            httpOnly: true,
                            secure: false,
                            sameSite: 'strict',
                            path: '/',
                        }));
                        (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(http_status_codes_1.StatusCodes.NO_CONTENT);
                        (0, globals_1.expect)(mockResponse.send).toHaveBeenCalled();
                        (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('User logged out from IP: 127.0.0.1');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('logoutAll', function () {
        (0, globals_1.it)('should logout from all sessions', function () { return __awaiter(void 0, void 0, void 0, function () {
            var logoutAll;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        logoutAll = (_a.sent()).logoutAll;
                        mockRequest.user = { id: 1, role: 'USER' };
                        mockRefreshTokenService.invalidateUserRefreshTokens.mockResolvedValue(undefined);
                        return [4 /*yield*/, logoutAll(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(mockRefreshTokenService.invalidateUserRefreshTokens).toHaveBeenCalledWith(1);
                        (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(http_status_codes_1.StatusCodes.NO_CONTENT);
                        (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('User logged out from all sessions - User ID: 1 from IP: 127.0.0.1');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should require authentication', function () { return __awaiter(void 0, void 0, void 0, function () {
            var logoutAll;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        logoutAll = (_a.sent()).logoutAll;
                        mockRequest.user = undefined;
                        return [4 /*yield*/, logoutAll(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(nextFunction).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                            message: 'Not authenticated',
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
    });
    (0, globals_1.describe)('changePassword', function () {
        (0, globals_1.it)('should change password successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var changePassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        changePassword = (_a.sent()).changePassword;
                        mockRequest.user = { id: 1, role: 'USER' };
                        mockRequest.body = {
                            currentPassword: 'oldpassword',
                            newPassword: 'newpassword123',
                        };
                        mockAuthService.changePassword.mockResolvedValue(undefined);
                        mockRefreshTokenService.invalidateUserRefreshTokens.mockResolvedValue(undefined);
                        return [4 /*yield*/, changePassword(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(mockAuthService.changePassword).toHaveBeenCalledWith(1, 'oldpassword', 'newpassword123');
                        (0, globals_1.expect)(mockRefreshTokenService.invalidateUserRefreshTokens).toHaveBeenCalledWith(1);
                        (0, globals_1.expect)(mockResponse.status).toHaveBeenCalledWith(http_status_codes_1.StatusCodes.NO_CONTENT);
                        (0, globals_1.expect)(mockLogger.info).toHaveBeenCalledWith('Password changed for user ID: 1 from IP: 127.0.0.1');
                        return [2 /*return*/];
                }
            });
        }); });
        (0, globals_1.it)('should require authentication', function () { return __awaiter(void 0, void 0, void 0, function () {
            var changePassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../controllers/auth.controller.js'); })];
                    case 1:
                        changePassword = (_a.sent()).changePassword;
                        mockRequest.user = undefined;
                        return [4 /*yield*/, changePassword(mockRequest, mockResponse, nextFunction)];
                    case 2:
                        _a.sent();
                        (0, globals_1.expect)(nextFunction).toHaveBeenCalledWith(globals_1.expect.objectContaining({
                            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                            message: 'Not authenticated',
                        }));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});

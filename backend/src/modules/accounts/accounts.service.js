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
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsService = exports.AccountsService = void 0;
var prisma_js_1 = require("../../utils/prisma.js");
var accounts_model_js_1 = require("./accounts.model.js");
var errors_js_1 = require("../../utils/errors.js");
var http_status_codes_1 = require("http-status-codes");
var library_1 = require("@prisma/client/runtime/library");
var AccountsService = /** @class */ (function () {
    function AccountsService() {
    }
    AccountsService.prototype.list = function (companyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma_js_1.prisma.account.findMany({
                        where: { companyId: companyId },
                        orderBy: { code: 'asc' },
                    })];
            });
        });
    };
    AccountsService.prototype.create = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed;
            var _a;
            return __generator(this, function (_b) {
                parsed = accounts_model_js_1.accountCreateSchema.parse(payload);
                return [2 /*return*/, prisma_js_1.prisma.account.create({
                        data: {
                            companyId: parsed.companyId,
                            code: parsed.code,
                            name: parsed.name,
                            type: parsed.type,
                            parentId: parsed.parentId,
                            balance: parsed.balance ? new library_1.Decimal(parsed.balance) : new library_1.Decimal(0),
                            description: parsed.description,
                            isActive: (_a = parsed.isActive) !== null && _a !== void 0 ? _a : true
                        }
                    })];
            });
        });
    };
    AccountsService.prototype.update = function (id, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed;
            return __generator(this, function (_a) {
                if (!payload || Object.keys(payload).length === 0) {
                    throw new errors_js_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No update payload provided');
                }
                parsed = accounts_model_js_1.accountUpdateSchema.parse(payload);
                return [2 /*return*/, prisma_js_1.prisma.account.update({
                        where: { id: id },
                        data: __assign(__assign({}, parsed), { updatedAt: new Date().toISOString() }),
                    })];
            });
        });
    };
    AccountsService.prototype.adjustBalance = function (id, amount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (Number.isNaN(amount)) {
                    throw new errors_js_1.ApiError(http_status_codes_1.StatusCodes.BAD_REQUEST, 'amount must be a number');
                }
                return [2 /*return*/, prisma_js_1.prisma.account.update({
                        where: { id: id },
                        data: { balance: { increment: Number(amount.toFixed(2)) } },
                    })];
            });
        });
    };
    return AccountsService;
}());
exports.AccountsService = AccountsService;
exports.accountsService = new AccountsService();

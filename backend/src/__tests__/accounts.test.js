// @ts-nocheck
"use strict";
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null",
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
// Mock Prisma client first
var mockPrisma = {
  account: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
};
jest.mock("../utils/prisma", function () {
  return {
    prisma: mockPrisma,
  };
});
jest.mock("../utils/errors", function () {
  return {
    ApiError: /** @class */ (function (_super) {
      __extends(ApiError, _super);
      function ApiError(statusCode, message) {
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.name = "ApiError";
        return _this;
      }
      return ApiError;
    })(Error),
  };
});
var accounts_service_js_1 = require("../modules/accounts/accounts.service.js");
var accounts_controller_js_1 = require("../modules/accounts/accounts.controller.js");
describe("Accounts Module", function () {
  var mockRequest;
  var mockResponse;
  var nextFunction;
  beforeEach(function () {
    jest.clearAllMocks();
    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: {
        id: "test-user-id",
        email: "test@example.com",
        role: "USER",
        isActive: true,
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });
  afterAll(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, mockPrisma.$disconnect()];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  describe("AccountsService", function () {
    describe("list", function () {
      it("should list accounts for a company", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var mockAccounts, result;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                mockAccounts = [
                  {
                    id: "1",
                    code: "1000",
                    name: "Cash",
                    type: "ASSET",
                    companyId: "company-1",
                  },
                ];
                mockPrisma.account.findMany.mockResolvedValue(mockAccounts);
                return [
                  4 /*yield*/,
                  accounts_service_js_1.accountsService.list("company-1"),
                ];
              case 1:
                result = _a.sent();
                expect(result).toEqual(mockAccounts);
                expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
                  where: { companyId: "company-1" },
                  orderBy: { code: "asc" },
                });
                return [2 /*return*/];
            }
          });
        });
      });
    });
    describe("create", function () {
      it("should create a new account", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var accountData, mockAccount, result;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                accountData = {
                  companyId: "550e8400-e29b-41d4-a716-446655440000",
                  code: "1000",
                  name: "Cash",
                  type: "ASSET",
                };
                mockAccount = __assign({ id: "1" }, accountData);
                mockPrisma.account.create.mockResolvedValue(mockAccount);
                return [
                  4 /*yield*/,
                  accounts_service_js_1.accountsService.create(accountData),
                ];
              case 1:
                result = _a.sent();
                expect(result).toEqual(mockAccount);
                expect(mockPrisma.account.create).toHaveBeenCalledWith({
                  data: accountData,
                });
                return [2 /*return*/];
            }
          });
        });
      });
    });
    describe("update", function () {
      it("should update an account", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var updateData, mockAccount, result;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                updateData = { name: "Updated Cash" };
                mockAccount = { id: "1", name: "Updated Cash" };
                mockPrisma.account.update.mockResolvedValue(mockAccount);
                return [
                  4 /*yield*/,
                  accounts_service_js_1.accountsService.update("1", updateData),
                ];
              case 1:
                result = _a.sent();
                expect(result).toEqual(mockAccount);
                expect(mockPrisma.account.update).toHaveBeenCalledWith({
                  where: { id: "1" },
                  data: __assign(__assign({}, updateData), {
                    updatedAt: expect.any(String),
                  }),
                });
                return [2 /*return*/];
            }
          });
        });
      });
    });
    describe("adjustBalance", function () {
      it("should adjust account balance", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var mockAccount, result;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                mockAccount = { id: "1", balance: 100 };
                mockPrisma.account.update.mockResolvedValue(mockAccount);
                return [
                  4 /*yield*/,
                  accounts_service_js_1.accountsService.adjustBalance("1", 50),
                ];
              case 1:
                result = _a.sent();
                expect(result).toEqual(mockAccount);
                expect(mockPrisma.account.update).toHaveBeenCalledWith({
                  where: { id: "1" },
                  data: { balance: { increment: 50 } },
                });
                return [2 /*return*/];
            }
          });
        });
      });
      it("should throw error for NaN amount", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                return [
                  4 /*yield*/,
                  expect(
                    accounts_service_js_1.accountsService.adjustBalance(
                      "1",
                      NaN,
                    ),
                  ).rejects.toThrow(),
                ];
              case 1:
                _a.sent();
                return [2 /*return*/];
            }
          });
        });
      });
    });
  });
  describe("AccountsController", function () {
    describe("list", function () {
      it("should return accounts list", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var mockAccounts;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                mockRequest.query = {
                  companyId: "550e8400-e29b-41d4-a716-446655440000",
                };
                mockAccounts = [{ id: "1", code: "1000", name: "Cash" }];
                mockPrisma.account.findMany.mockResolvedValue(mockAccounts);
                return [
                  4 /*yield*/,
                  accounts_controller_js_1.accountsController.list(
                    mockRequest,
                    mockResponse,
                    nextFunction,
                  ),
                ];
              case 1:
                _a.sent();
                expect(mockResponse.status).toHaveBeenCalledWith(200);
                expect(mockResponse.json).toHaveBeenCalledWith({
                  success: true,
                  data: mockAccounts,
                });
                return [2 /*return*/];
            }
          });
        });
      });
      it("should handle validation errors", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                mockRequest.query = {};
                return [
                  4 /*yield*/,
                  accounts_controller_js_1.accountsController.list(
                    mockRequest,
                    mockResponse,
                    nextFunction,
                  ),
                ];
              case 1:
                _a.sent();
                expect(nextFunction).toHaveBeenCalled();
                return [2 /*return*/];
            }
          });
        });
      });
    });
    describe("create", function () {
      it("should create and return account", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var accountData, mockAccount;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                accountData = {
                  companyId: "550e8400-e29b-41d4-a716-446655440000",
                  code: "1000",
                  name: "Cash",
                  type: "ASSET",
                };
                mockRequest.body = accountData;
                mockAccount = __assign({ id: "1" }, accountData);
                mockPrisma.account.create.mockResolvedValue(mockAccount);
                return [
                  4 /*yield*/,
                  accounts_controller_js_1.accountsController.create(
                    mockRequest,
                    mockResponse,
                    nextFunction,
                  ),
                ];
              case 1:
                _a.sent();
                expect(mockResponse.status).toHaveBeenCalledWith(201);
                expect(mockResponse.json).toHaveBeenCalledWith({
                  success: true,
                  data: mockAccount,
                });
                return [2 /*return*/];
            }
          });
        });
      });
    });
    describe("update", function () {
      it("should update and return account", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var updateData, mockAccount;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                updateData = { name: "Updated Cash" };
                mockRequest.params = { id: "1" };
                mockRequest.body = updateData;
                mockAccount = __assign({ id: "1" }, updateData);
                mockPrisma.account.update.mockResolvedValue(mockAccount);
                return [
                  4 /*yield*/,
                  accounts_controller_js_1.accountsController.update(
                    mockRequest,
                    mockResponse,
                    nextFunction,
                  ),
                ];
              case 1:
                _a.sent();
                expect(mockResponse.status).toHaveBeenCalledWith(200);
                expect(mockResponse.json).toHaveBeenCalledWith({
                  success: true,
                  data: mockAccount,
                });
                return [2 /*return*/];
            }
          });
        });
      });
    });
    describe("adjustBalance", function () {
      it("should adjust account balance", function () {
        return __awaiter(void 0, void 0, void 0, function () {
          var mockAccount;
          return __generator(this, function (_a) {
            switch (_a.label) {
              case 0:
                mockRequest.params = { id: "1" };
                mockRequest.body = { amount: 50 };
                mockAccount = { id: "1", balance: 150 };
                mockPrisma.account.update.mockResolvedValue(mockAccount);
                return [
                  4 /*yield*/,
                  accounts_controller_js_1.accountsController.adjustBalance(
                    mockRequest,
                    mockResponse,
                    nextFunction,
                  ),
                ];
              case 1:
                _a.sent();
                expect(mockResponse.status).toHaveBeenCalledWith(200);
                expect(mockResponse.json).toHaveBeenCalledWith({
                  success: true,
                  data: mockAccount,
                });
                return [2 /*return*/];
            }
          });
        });
      });
    });
  });
});

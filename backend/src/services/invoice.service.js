"use strict";
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
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
var prisma_js_1 = require("../utils/prisma.js");
var errors_js_1 = require("../utils/errors.js");
var InvoiceService = /** @class */ (function () {
  function InvoiceService() {}
  InvoiceService.prototype.getInvoicesByCompany = function (companyId_1) {
    return __awaiter(
      this,
      arguments,
      void 0,
      function (companyId, page, limit) {
        var skip, _a, invoices, total;
        if (page === void 0) {
          page = 1;
        }
        if (limit === void 0) {
          limit = 10;
        }
        return __generator(this, function (_b) {
          switch (_b.label) {
            case 0:
              skip = (page - 1) * limit;
              return [
                4 /*yield*/,
                Promise.all([
                  prisma_js_1.prisma.invoice.findMany({
                    where: { companyId: companyId },
                    skip: skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                  }),
                  prisma_js_1.prisma.invoice.count({
                    where: { companyId: companyId },
                  }),
                ]),
              ];
            case 1:
              ((_a = _b.sent()), (invoices = _a[0]), (total = _a[1]));
              return [
                2 /*return*/,
                {
                  data: invoices,
                  meta: {
                    total: total,
                    page: page,
                    totalPages: Math.ceil(total / limit),
                    limit: limit,
                  },
                },
              ];
          }
        });
      },
    );
  };
  InvoiceService.prototype.getInvoiceById = function (id) {
    return __awaiter(this, void 0, void 0, function () {
      var invoice, items;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoice.findUnique({
                where: { id: id },
              }),
            ];
          case 1:
            invoice = _a.sent();
            if (!invoice) {
              throw new errors_js_1.ApiError(404, "Invoice not found");
            }
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoiceItem.findMany({
                where: { invoiceId: id },
              }),
            ];
          case 2:
            items = _a.sent();
            return [
              2 /*return*/,
              __assign(__assign({}, invoice), { items: items }),
            ];
        }
      });
    });
  };
  InvoiceService.prototype.createInvoice = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      var items, invoiceData;
      var _this = this;
      return __generator(this, function (_a) {
        ((items = data.items), (invoiceData = __rest(data, ["items"])));
        return [
          2 /*return*/,
          prisma_js_1.prisma.$transaction(function (tx) {
            return __awaiter(_this, void 0, void 0, function () {
              var invoice, _a, _b, invoiceItems;
              var _c, _d;
              return __generator(this, function (_e) {
                switch (_e.label) {
                  case 0:
                    _b = (_a = tx.invoice).create;
                    _c = {};
                    _d = {};
                    return [
                      4 /*yield*/,
                      this.generateInvoiceNumber(invoiceData.companyId),
                    ];
                  case 1:
                    return [
                      4 /*yield*/,
                      _b.apply(_a, [
                        ((_c.data =
                          ((_d.invoiceNumber = _e.sent()),
                          (_d.date = invoiceData.issueDate || new Date()),
                          (_d.dueDate = invoiceData.dueDate),
                          (_d.totalAmount = invoiceData.total || 0),
                          (_d.status = invoiceData.status || "DRAFT"),
                          (_d.companyId = invoiceData.companyId),
                          (_d.clientId = invoiceData.customerId || null),
                          _d)),
                        _c),
                      ]),
                    ];
                  case 2:
                    invoice = _e.sent();
                    if (!(items && items.length > 0)) return [3 /*break*/, 4];
                    return [
                      4 /*yield*/,
                      tx.invoiceItem.createMany({
                        data: items.map(function (item) {
                          return {
                            invoiceId: invoice.id,
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalAmount: item.amount,
                            accountId: "default-account-id", // TODO: Get from company default account
                          };
                        }),
                      }),
                    ];
                  case 3:
                    _e.sent();
                    _e.label = 4;
                  case 4:
                    return [
                      4 /*yield*/,
                      tx.invoiceItem.findMany({
                        where: { invoiceId: invoice.id },
                      }),
                    ];
                  case 5:
                    invoiceItems = _e.sent();
                    return [
                      2 /*return*/,
                      __assign(__assign({}, invoice), { items: invoiceItems }),
                    ];
                }
              });
            });
          }),
        ];
      });
    });
  };
  InvoiceService.prototype.updateInvoice = function (id, data) {
    return __awaiter(this, void 0, void 0, function () {
      var existingInvoice, updatedInvoice, items;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoice.findUnique({
                where: { id: id },
              }),
            ];
          case 1:
            existingInvoice = _a.sent();
            if (!existingInvoice) {
              throw new errors_js_1.ApiError(404, "Invoice not found");
            }
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoice.update({
                where: { id: id },
                data: __assign(__assign({}, data), { updatedAt: new Date() }),
              }),
            ];
          case 2:
            updatedInvoice = _a.sent();
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoiceItem.findMany({
                where: { invoiceId: id },
              }),
            ];
          case 3:
            items = _a.sent();
            return [
              2 /*return*/,
              __assign(__assign({}, updatedInvoice), { items: items }),
            ];
        }
      });
    });
  };
  InvoiceService.prototype.deleteInvoice = function (id) {
    return __awaiter(this, void 0, void 0, function () {
      var existingInvoice;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoice.findUnique({
                where: { id: id },
              }),
            ];
          case 1:
            existingInvoice = _a.sent();
            if (!existingInvoice) {
              throw new errors_js_1.ApiError(404, "Invoice not found");
            }
            // Delete invoice items first (due to foreign key constraint)
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoiceItem.deleteMany({
                where: { invoiceId: id },
              }),
            ];
          case 2:
            // Delete invoice items first (due to foreign key constraint)
            _a.sent();
            // Delete the invoice
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoice.delete({
                where: { id: id },
              }),
            ];
          case 3:
            // Delete the invoice
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  InvoiceService.prototype.generateInvoiceNumber = function (companyId) {
    return __awaiter(this, void 0, void 0, function () {
      var count;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              prisma_js_1.prisma.invoice.count({
                where: { companyId: companyId },
              }),
            ];
          case 1:
            count = _a.sent();
            // Generate a unique invoice number (e.g., INV-0001, INV-0002, etc.)
            return [
              2 /*return*/,
              "INV-".concat(String(count + 1).padStart(4, "0")),
            ];
        }
      });
    });
  };
  return InvoiceService;
})();
exports.InvoiceService = InvoiceService;

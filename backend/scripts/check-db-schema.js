"use strict";
var __makeTemplateObject =
  (this && this.__makeTemplateObject) ||
  function (cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, "raw", { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
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
var index_js_1 = require("../src/db/index.js");
var drizzle_orm_1 = require("drizzle-orm");
function checkSchema() {
  return __awaiter(this, void 0, void 0, function () {
    var now, tables, _i, _a, table, columns, _b, _c, col, error_1;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          _d.trys.push([0, 7, 8, 10]);
          console.log("🔍 Checking database schema...");
          return [
            4 /*yield*/,
            index_js_1.db.execute(
              (0, drizzle_orm_1.sql)(
                templateObject_1 ||
                  (templateObject_1 = __makeTemplateObject(
                    ["SELECT NOW() as now"],
                    ["SELECT NOW() as now"],
                  )),
              ),
            ),
          ];
        case 1:
          now = _d.sent();
          console.log("✅ Database connection successful");
          console.log("Current database time:", now.rows[0].now);
          return [
            4 /*yield*/,
            index_js_1.db.execute(
              (0, drizzle_orm_1.sql)(
                templateObject_2 ||
                  (templateObject_2 = __makeTemplateObject(
                    [
                      "\n      SELECT table_name \n      FROM information_schema.tables \n      WHERE table_schema = 'public';\n    ",
                    ],
                    [
                      "\n      SELECT table_name \n      FROM information_schema.tables \n      WHERE table_schema = 'public';\n    ",
                    ],
                  )),
              ),
            ),
          ];
        case 2:
          tables = _d.sent();
          console.log("\n📋 Tables in public schema:");
          ((_i = 0), (_a = tables.rows));
          _d.label = 3;
        case 3:
          if (!(_i < _a.length)) return [3 /*break*/, 6];
          table = _a[_i];
          console.log("\nTable: ".concat(table.table_name));
          return [
            4 /*yield*/,
            index_js_1.db.execute(
              (0, drizzle_orm_1.sql)(
                templateObject_3 ||
                  (templateObject_3 = __makeTemplateObject(
                    [
                      "\n        SELECT column_name, data_type, is_nullable, column_default\n        FROM information_schema.columns \n        WHERE table_schema = 'public' AND table_name = ",
                      "\n        ORDER BY ordinal_position;\n      ",
                    ],
                    [
                      "\n        SELECT column_name, data_type, is_nullable, column_default\n        FROM information_schema.columns \n        WHERE table_schema = 'public' AND table_name = ",
                      "\n        ORDER BY ordinal_position;\n      ",
                    ],
                  )),
                table.table_name,
              ),
            ),
          ];
        case 4:
          columns = _d.sent();
          console.log("Columns:");
          for (_b = 0, _c = columns.rows; _b < _c.length; _b++) {
            col = _c[_b];
            console.log(
              "  - ".concat(col.column_name, " (").concat(col.data_type, ")"),
            );
          }
          _d.label = 5;
        case 5:
          _i++;
          return [3 /*break*/, 3];
        case 6:
          return [3 /*break*/, 10];
        case 7:
          error_1 = _d.sent();
          console.error("❌ Error checking database schema:", error_1);
          return [3 /*break*/, 10];
        case 8:
          // Close the connection
          return [4 /*yield*/, index_js_1.db.$client.end()];
        case 9:
          // Close the connection
          _d.sent();
          process.exit(0);
          return [7 /*endfinally*/];
        case 10:
          return [2 /*return*/];
      }
    });
  });
}
checkSchema();
var templateObject_1, templateObject_2, templateObject_3;

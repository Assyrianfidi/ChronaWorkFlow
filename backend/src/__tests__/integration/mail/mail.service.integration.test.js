"use strict";
var __esDecorate =
  (this && this.__esDecorate) ||
  function (
    ctor,
    descriptorIn,
    decorators,
    contextIn,
    initializers,
    extraInitializers,
  ) {
    function accept(f) {
      if (f !== void 0 && typeof f !== "function")
        throw new TypeError("Function expected");
      return f;
    }
    var kind = contextIn.kind,
      key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target =
      !descriptorIn && ctor
        ? contextIn["static"]
          ? ctor
          : ctor.prototype
        : null;
    var descriptor =
      descriptorIn ||
      (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _,
      done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) {
        if (done)
          throw new TypeError(
            "Cannot add initializers after decoration has completed",
          );
        extraInitializers.push(accept(f || null));
      };
      var result = (0, decorators[i])(
        kind === "accessor"
          ? { get: descriptor.get, set: descriptor.set }
          : descriptor[key],
        context,
      );
      if (kind === "accessor") {
        if (result === void 0) continue;
        if (result === null || typeof result !== "object")
          throw new TypeError("Object expected");
        if ((_ = accept(result.get))) descriptor.get = _;
        if ((_ = accept(result.set))) descriptor.set = _;
        if ((_ = accept(result.init))) initializers.unshift(_);
      } else if ((_ = accept(result))) {
        if (kind === "field") initializers.unshift(_);
        else descriptor[key] = _;
      }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  };
var __runInitializers =
  (this && this.__runInitializers) ||
  function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
      value = useValue
        ? initializers[i].call(thisArg, value)
        : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName =
  (this && this.__setFunctionName) ||
  function (f, name, prefix) {
    if (typeof name === "symbol")
      name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", {
      configurable: true,
      value: prefix ? "".concat(prefix, " ", name) : name,
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("@nestjs/testing");
var mail_service_1 = require("../../../mail/mail.service");
var nodemailer = require("nodemailer");
var fs = require("fs");
var path = require("path");
var util_1 = require("util");
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
// Define TestModule with ConfigModule to handle environment variables
var TestModule = (function () {
  var _classDecorators = [
    (0, common_1.Module)({
      imports: [
        config_1.ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      providers: [
        mail_service_1.MailService,
        {
          provide: "NODEMAILER_TRANSPORTER",
          useFactory: function () {
            return nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || "587", 10),
              secure: process.env.SMTP_SECURE === "true",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
              tls: {
                rejectUnauthorized: false,
              },
            });
          },
        },
      ],
      exports: [mail_service_1.MailService],
    }),
  ];
  var _classDescriptor;
  var _classExtraInitializers = [];
  var _classThis;
  var TestModule = (_classThis = /** @class */ (function () {
    function TestModule_1() {}
    return TestModule_1;
  })());
  __setFunctionName(_classThis, "TestModule");
  (function () {
    var _metadata =
      typeof Symbol === "function" && Symbol.metadata
        ? Object.create(null)
        : void 0;
    __esDecorate(
      null,
      (_classDescriptor = { value: _classThis }),
      _classDecorators,
      { kind: "class", name: _classThis.name, metadata: _metadata },
      null,
      _classExtraInitializers,
    );
    TestModule = _classThis = _classDescriptor.value;
    if (_metadata)
      Object.defineProperty(_classThis, Symbol.metadata, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: _metadata,
      });
    __runInitializers(_classThis, _classExtraInitializers);
  })();
  return (TestModule = _classThis);
})();
describe("MailService Integration Tests", function () {
  var mailService;
  var testAccount;
  var testTemplate = "test-email";
  var testContext = {
    title: "Test Email",
    header: "Welcome to AccuBooks",
    name: "Test User",
    message:
      "This is a test email sent from the MailService integration tests.",
    buttonText: "Go to Dashboard",
    buttonUrl: "https://app.accubooks.test/dashboard",
    year: new Date().getFullYear(),
  };
  // Create a test module with the MailService
  var module;
  beforeAll(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var templatesDir, testTemplateContent, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 7, , 8]);
            return [4 /*yield*/, nodemailer.createTestAccount()];
          case 1:
            // Create a test account using ethereal.email
            testAccount = _a.sent();
            // Set up environment variables for the test
            process.env.SMTP_HOST = testAccount.smtp.host;
            process.env.SMTP_PORT = testAccount.smtp.port.toString();
            process.env.SMTP_SECURE = testAccount.smtp.secure.toString();
            process.env.SMTP_USER = testAccount.user;
            process.env.SMTP_PASS = testAccount.pass;
            process.env.SMTP_FROM = "test@accubooks.test";
            templatesDir = path.join(__dirname, "../../../mail/templates");
            if (!!fs.existsSync(templatesDir)) return [3 /*break*/, 3];
            return [
              4 /*yield*/,
              (0, util_1.promisify)(fs.mkdir)(templatesDir, {
                recursive: true,
              }),
            ];
          case 2:
            _a.sent();
            _a.label = 3;
          case 3:
            testTemplateContent =
              '\n        <!DOCTYPE html>\n        <html>\n        <head>\n            <title>{{title}}</title>\n        </head>\n        <body>\n            <h1>{{header}}</h1>\n            <p>Hello {{name}},</p>\n            <p>{{message}}</p>\n            {{#if buttonText}}\n            <a href="{{buttonUrl}}">{{buttonText}}</a>\n            {{/if}}\n            <p>\u00A9 {{year}} AccuBooks</p>\n        </body>\n        </html>\n      ';
            return [
              4 /*yield*/,
              (0, util_1.promisify)(fs.writeFile)(
                path.join(templatesDir, "".concat(testTemplate, ".hbs")),
                testTemplateContent,
                "utf8",
              ),
            ];
          case 4:
            _a.sent();
            return [
              4 /*yield*/,
              testing_1.Test.createTestingModule({
                imports: [TestModule],
              }).compile(),
            ];
          case 5:
            // Initialize the testing module
            module = _a.sent();
            // Get the MailService instance from the testing module
            mailService = module.get(mail_service_1.MailService);
            // Add a small delay to ensure the test account is ready
            return [
              4 /*yield*/,
              new Promise(function (resolve) {
                return setTimeout(resolve, 1000);
              }),
            ];
          case 6:
            // Add a small delay to ensure the test account is ready
            _a.sent();
            return [3 /*break*/, 8];
          case 7:
            error_1 = _a.sent();
            console.error("Error in beforeAll:", error_1);
            throw error_1;
          case 8:
            return [2 /*return*/];
        }
      });
    });
  });
  describe("sendMail", function () {
    it("should send an email with template successfully", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var testRecipient, testSubject, testTransport, messages;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              testRecipient = "test@example.com";
              testSubject = "Test Email";
              // Act
              return [
                4 /*yield*/,
                mailService.sendMail(
                  testRecipient,
                  testSubject,
                  testTemplate,
                  testContext,
                ),
              ];
            case 1:
              // Act
              _a.sent();
              // Add a small delay to ensure the email is processed
              return [
                4 /*yield*/,
                new Promise(function (resolve) {
                  return setTimeout(resolve, 2000);
                }),
              ];
            case 2:
              // Add a small delay to ensure the email is processed
              _a.sent();
              testTransport = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                  user: testAccount.user,
                  pass: testAccount.pass,
                },
              });
              return [4 /*yield*/, testTransport.getTestMessageUrl({})];
            case 3:
              messages = _a.sent();
              // Assert
              expect(messages).toBeDefined();
              expect(messages).toContain("ethereal.email");
              return [2 /*return*/];
          }
        });
      });
    }, 10000); // Increase timeout to 10 seconds for this test
    it("should throw an error for invalid template", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Act & Assert
              return [
                4 /*yield*/,
                expect(
                  mailService.sendMail(
                    "test@example.com",
                    "Test Email",
                    "non-existent-template",
                    testContext,
                  ),
                ).rejects.toThrow(),
              ];
            case 1:
              // Act & Assert
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should handle template compilation errors", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var badTemplate, templatesDir;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              badTemplate = "bad-template";
              templatesDir = path.join(__dirname, "../../../mail/templates");
              return [
                4 /*yield*/,
                (0, util_1.promisify)(fs.writeFile)(
                  path.join(templatesDir, "".concat(badTemplate, ".hbs")),
                  "{{#each invalid}}", // Invalid handlebars syntax
                  "utf8",
                ),
              ];
            case 1:
              _a.sent();
              // Act & Assert
              return [
                4 /*yield*/,
                expect(
                  mailService.sendMail(
                    "test@example.com",
                    "Test Email",
                    badTemplate,
                    testContext,
                  ),
                ).rejects.toThrow(),
              ];
            case 2:
              // Act & Assert
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should throw an error for invalid template", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              // Act & Assert
              return [
                4 /*yield*/,
                expect(
                  mailService.sendMail(
                    "test@example.com",
                    "Test Email",
                    "non-existent-template",
                    testContext,
                  ),
                ).rejects.toThrow(),
              ];
            case 1:
              // Act & Assert
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
    it("should handle template compilation errors", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var badTemplate, templatesDir;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              badTemplate = "bad-template";
              templatesDir = path.join(__dirname, "../../../templates");
              return [
                4 /*yield*/,
                (0, util_1.promisify)(fs.writeFile)(
                  path.join(templatesDir, "".concat(badTemplate, ".hbs")),
                  "{{#each invalid}}", // Invalid handlebars syntax
                  "utf8",
                ),
              ];
            case 1:
              _a.sent();
              // Act & Assert
              return [
                4 /*yield*/,
                expect(
                  mailService.sendMail(
                    "test@example.com",
                    "Test Email",
                    badTemplate,
                    testContext,
                  ),
                ).rejects.toThrow(),
              ];
            case 2:
              // Act & Assert
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("compileTemplate", function () {
    it("should compile template with context", function () {
      // This is a white-box test since compileTemplate is private
      // We'll access it through the sendMail method
      var result = mailService.compileTemplate(testTemplate, testContext);
      // Verify the template was compiled correctly
      expect(result).toContain(testContext.header);
      expect(result).toContain(testContext.name);
      expect(result).toContain(testContext.message);
      expect(result).toContain(testContext.buttonText);
      expect(result).toContain(testContext.buttonUrl);
      expect(result).toContain(testContext.year.toString());
    });
  });
  afterAll(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      var templatesDir,
        testTemplatePath,
        badTemplatePath,
        files,
        error_2,
        error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 13, , 14]);
            templatesDir = path.join(__dirname, "../../../mail/templates");
            testTemplatePath = path.join(
              templatesDir,
              "".concat(testTemplate, ".hbs"),
            );
            badTemplatePath = path.join(templatesDir, "bad-template.hbs");
            if (!fs.existsSync(testTemplatePath)) return [3 /*break*/, 2];
            return [
              4 /*yield*/,
              (0, util_1.promisify)(fs.unlink)(testTemplatePath).catch(
                console.error,
              ),
            ];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            if (!fs.existsSync(badTemplatePath)) return [3 /*break*/, 4];
            return [
              4 /*yield*/,
              (0, util_1.promisify)(fs.unlink)(badTemplatePath).catch(
                console.error,
              ),
            ];
          case 3:
            _a.sent();
            _a.label = 4;
          case 4:
            _a.trys.push([4, 8, , 9]);
            return [
              4 /*yield*/,
              (0, util_1.promisify)(fs.readdir)(templatesDir),
            ];
          case 5:
            files = _a.sent();
            if (!(files.length === 0)) return [3 /*break*/, 7];
            return [
              4 /*yield*/,
              (0, util_1.promisify)(fs.rmdir)(templatesDir).catch(
                console.error,
              ),
            ];
          case 6:
            _a.sent();
            _a.label = 7;
          case 7:
            return [3 /*break*/, 9];
          case 8:
            error_2 = _a.sent();
            // Directory might not exist, which is fine
            if (error_2.code !== "ENOENT") {
              console.error("Error reading templates directory:", error_2);
            }
            return [3 /*break*/, 9];
          case 9:
            if (!module) return [3 /*break*/, 11];
            return [4 /*yield*/, module.close().catch(console.error)];
          case 10:
            _a.sent();
            _a.label = 11;
          case 11:
            // Add a small delay to ensure all resources are released
            return [
              4 /*yield*/,
              new Promise(function (resolve) {
                return setTimeout(resolve, 1000);
              }),
            ];
          case 12:
            // Add a small delay to ensure all resources are released
            _a.sent();
            return [3 /*break*/, 14];
          case 13:
            error_3 = _a.sent();
            console.error("Error during test cleanup:", error_3);
            return [3 /*break*/, 14];
          case 14:
            return [2 /*return*/];
        }
      });
    });
  });
});

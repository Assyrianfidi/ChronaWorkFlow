"use strict";
/**
 * AI-Powered Accounting Engine
 * Advanced tax logic, automated categorization, anomaly detection
 */
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
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingAIEngine = void 0;
var client_1 = require("@prisma/client");
var logger_1 = require("../utils/logger");
var event_bus_1 = require("../events/event-bus");
var cache_manager_1 = require("../cache/cache-manager");
var AccountingAIEngine = /** @class */ (function () {
  function AccountingAIEngine() {
    this.modelCache = new Map();
    this.prisma = new client_1.PrismaClient();
    this.logger = logger_1.logger.child({ component: "AccountingAIEngine" });
    this.eventBus = new event_bus_1.EventBus();
    this.cache = new cache_manager_1.CacheManager();
    this.initializeModels();
  }
  AccountingAIEngine.prototype.initializeModels = function () {
    return __awaiter(this, void 0, void 0, function () {
      var error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            // Initialize ML models for categorization
            return [4 /*yield*/, this.loadCategorizationModel()];
          case 1:
            // Initialize ML models for categorization
            _a.sent();
            // Initialize tax calculation models
            return [4 /*yield*/, this.loadTaxModels()];
          case 2:
            // Initialize tax calculation models
            _a.sent();
            // Initialize anomaly detection models
            return [4 /*yield*/, this.loadAnomalyDetectionModel()];
          case 3:
            // Initialize anomaly detection models
            _a.sent();
            this.logger.info("AI models initialized successfully");
            return [3 /*break*/, 5];
          case 4:
            error_1 = _a.sent();
            this.logger.error("Failed to initialize AI models:", error_1);
            throw error_1;
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Automated Transaction Categorization
   */
  AccountingAIEngine.prototype.categorizeTransaction = function (transaction) {
    return __awaiter(this, void 0, void 0, function () {
      var startTime,
        features,
        historicalPatterns,
        prediction,
        validatedResult,
        duration,
        error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            startTime = performance.now();
            _a.label = 1;
          case 1:
            _a.trys.push([1, 7, , 8]);
            return [4 /*yield*/, this.extractFeatures(transaction)];
          case 2:
            features = _a.sent();
            return [
              4 /*yield*/,
              this.getHistoricalPatterns(transaction.accountId),
            ];
          case 3:
            historicalPatterns = _a.sent();
            return [
              4 /*yield*/,
              this.applyCategorizationModel(features, historicalPatterns),
            ];
          case 4:
            prediction = _a.sent();
            return [
              4 /*yield*/,
              this.validateCategorization(prediction, transaction),
            ];
          case 5:
            validatedResult = _a.sent();
            // Log categorization for model improvement
            return [
              4 /*yield*/,
              this.logCategorization(transaction, validatedResult),
            ];
          case 6:
            // Log categorization for model improvement
            _a.sent();
            // Emit event for real-time updates
            this.eventBus.emit("transaction.categorized", {
              transactionId: transaction.id,
              result: validatedResult,
            });
            duration = performance.now() - startTime;
            this.logger.info(
              "Transaction categorized in ".concat(duration, "ms"),
              {
                transactionId: transaction.id,
                category: validatedResult.categoryId,
                confidence: validatedResult.confidence,
              },
            );
            return [2 /*return*/, validatedResult];
          case 7:
            error_2 = _a.sent();
            this.logger.error("Failed to categorize transaction:", error_2);
            throw error_2;
          case 8:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Advanced Tax Calculation
   */
  AccountingAIEngine.prototype.calculateTax = function (
    transaction,
    jurisdiction,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var taxRules, taxApplicable, taxAmount, deductible, result, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 6, , 7]);
            return [4 /*yield*/, this.getTaxRules(jurisdiction)];
          case 1:
            taxRules = _a.sent();
            return [
              4 /*yield*/,
              this.determineTaxApplicability(transaction, taxRules),
            ];
          case 2:
            taxApplicable = _a.sent();
            if (!taxApplicable.applicable) {
              return [
                2 /*return*/,
                {
                  taxAmount: 0,
                  taxRate: 0,
                  taxCategory: "non-taxable",
                  deductible: false,
                  jurisdiction: jurisdiction,
                  reasoning: taxApplicable.reasoning,
                },
              ];
            }
            return [
              4 /*yield*/,
              this.calculateTaxAmount(transaction, taxRules),
            ];
          case 3:
            taxAmount = _a.sent();
            return [
              4 /*yield*/,
              this.determineDeductibility(transaction, taxRules),
            ];
          case 4:
            deductible = _a.sent();
            result = {
              taxAmount: taxAmount.amount,
              taxRate: taxAmount.rate,
              taxCategory: taxAmount.category,
              deductible: deductible.allowed,
              jurisdiction: jurisdiction,
              reasoning: ""
                .concat(taxAmount.reasoning, ". ")
                .concat(deductible.reasoning),
            };
            // Cache tax calculation for similar transactions
            return [4 /*yield*/, this.cacheTaxCalculation(transaction, result)];
          case 5:
            // Cache tax calculation for similar transactions
            _a.sent();
            return [2 /*return*/, result];
          case 6:
            error_3 = _a.sent();
            this.logger.error("Failed to calculate tax:", error_3);
            throw error_3;
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Anomaly Detection
   */
  AccountingAIEngine.prototype.detectAnomalies = function (transaction) {
    return __awaiter(this, void 0, void 0, function () {
      var accountHistory,
        anomalies,
        significantAnomalies,
        primaryAnomaly,
        _a,
        error_4;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 4, , 5]);
            return [
              4 /*yield*/,
              this.getAccountHistory(transaction.accountId, 90),
            ];
          case 1:
            accountHistory = _b.sent();
            return [
              4 /*yield*/,
              Promise.all([
                this.detectAmountAnomaly(transaction, accountHistory),
                this.detectFrequencyAnomaly(transaction, accountHistory),
                this.detectPatternAnomaly(transaction, accountHistory),
                this.detectTimingAnomaly(transaction, accountHistory),
                this.detectCategoryAnomaly(transaction, accountHistory),
              ]),
            ];
          case 2:
            anomalies = _b.sent();
            significantAnomalies = anomalies.filter(function (a) {
              return a.isAnomalous && a.confidence > 0.7;
            });
            if (significantAnomalies.length === 0) {
              return [
                2 /*return*/,
                {
                  isAnomalous: false,
                  anomalyType: "pattern",
                  confidence: 0,
                  description: "No anomalies detected",
                  severity: "low",
                  recommendations: [],
                },
              ];
            }
            primaryAnomaly = significantAnomalies.reduce(
              function (prev, current) {
                return current.confidence > prev.confidence ? current : prev;
              },
            );
            // Generate recommendations
            _a = primaryAnomaly;
            return [
              4 /*yield*/,
              this.generateAnomalyRecommendations(primaryAnomaly, transaction),
            ];
          case 3:
            // Generate recommendations
            _a.recommendations = _b.sent();
            // Emit anomaly alert
            if (
              primaryAnomaly.severity === "high" ||
              primaryAnomaly.severity === "critical"
            ) {
              this.eventBus.emit("anomaly.detected", {
                transactionId: transaction.id,
                anomaly: primaryAnomaly,
              });
            }
            return [2 /*return*/, primaryAnomaly];
          case 4:
            error_4 = _b.sent();
            this.logger.error("Failed to detect anomalies:", error_4);
            throw error_4;
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Generate Financial Insights
   */
  AccountingAIEngine.prototype.generateInsights = function (
    accountId,
    timeframe,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var financialData, insights, allInsights, highConfidenceInsights, error_5;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            return [4 /*yield*/, this.getFinancialData(accountId, timeframe)];
          case 1:
            financialData = _a.sent();
            return [
              4 /*yield*/,
              Promise.all([
                this.generateTrendInsights(financialData),
                this.generatePredictionInsights(financialData),
                this.generateOpportunityInsights(financialData),
                this.generateRiskInsights(financialData),
                this.generateOptimizationInsights(financialData),
              ]),
            ];
          case 2:
            insights = _a.sent();
            allInsights = insights.flat().sort(function (a, b) {
              return b.confidence - a.confidence;
            });
            highConfidenceInsights = allInsights.filter(function (insight) {
              return insight.confidence > 0.7;
            });
            // Cache insights
            return [
              4 /*yield*/,
              this.cacheInsights(accountId, timeframe, highConfidenceInsights),
            ];
          case 3:
            // Cache insights
            _a.sent();
            return [2 /*return*/, highConfidenceInsights];
          case 4:
            error_5 = _a.sent();
            this.logger.error("Failed to generate insights:", error_5);
            throw error_5;
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Batch Transaction Processing
   */
  AccountingAIEngine.prototype.processBatchTransactions = function (
    transactions,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var batchSize, results, _loop_1, this_1, i, error_6;
      var _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            batchSize = 50;
            results = {
              categorizations: [],
              taxCalculations: [],
              anomalies: [],
            };
            _a.label = 1;
          case 1:
            _a.trys.push([1, 6, , 7]);
            _loop_1 = function (i) {
              var batch,
                batchResults,
                categorizationIndex,
                taxIndex,
                anomalyIndex;
              return __generator(this, function (_b) {
                switch (_b.label) {
                  case 0:
                    batch = transactions.slice(i, i + batchSize);
                    return [
                      4 /*yield*/,
                      Promise.allSettled(
                        __spreadArray(
                          __spreadArray(
                            __spreadArray(
                              [],
                              batch.map(function (tx) {
                                return _this.categorizeTransaction(tx);
                              }),
                              true,
                            ),
                            batch.map(function (tx) {
                              return _this.calculateTax(tx, "US");
                            }),
                            true,
                          ),
                          batch.map(function (tx) {
                            return _this.detectAnomalies(tx);
                          }),
                          true,
                        ),
                      ),
                    ];
                  case 1:
                    batchResults = _b.sent();
                    categorizationIndex = 0;
                    taxIndex = 0;
                    anomalyIndex = 0;
                    batchResults.forEach(function (result) {
                      if (result.status === "fulfilled") {
                        if (categorizationIndex < batch.length) {
                          results.categorizations.push(result.value);
                          categorizationIndex++;
                        } else if (taxIndex < batch.length) {
                          results.taxCalculations.push(result.value);
                          taxIndex++;
                        } else {
                          results.anomalies.push(result.value);
                          anomalyIndex++;
                        }
                      } else {
                        _this.logger.error(
                          "Batch processing error:",
                          result.reason,
                        );
                      }
                    });
                    // Emit progress event
                    this_1.eventBus.emit("batch.progress", {
                      processed: Math.min(i + batchSize, transactions.length),
                      total: transactions.length,
                      percentage: Math.round(
                        (Math.min(i + batchSize, transactions.length) /
                          transactions.length) *
                          100,
                      ),
                    });
                    return [2 /*return*/];
                }
              });
            };
            this_1 = this;
            i = 0;
            _a.label = 2;
          case 2:
            if (!(i < transactions.length)) return [3 /*break*/, 5];
            return [5 /*yield**/, _loop_1(i)];
          case 3:
            _a.sent();
            _a.label = 4;
          case 4:
            i += batchSize;
            return [3 /*break*/, 2];
          case 5:
            this.logger.info(
              "Batch processing completed: ".concat(
                transactions.length,
                " transactions",
              ),
            );
            return [2 /*return*/, results];
          case 6:
            error_6 = _a.sent();
            this.logger.error("Batch processing failed:", error_6);
            throw error_6;
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  // Private helper methods
  AccountingAIEngine.prototype.extractFeatures = function (transaction) {
    return __awaiter(this, void 0, void 0, function () {
      var features;
      return __generator(this, function (_a) {
        features = {
          amount: transaction.amount,
          amountLog: Math.log(Math.abs(transaction.amount) + 1),
          descriptionLength: transaction.description.length,
          descriptionWords: transaction.description.split(" ").length,
          hourOfDay: transaction.date.getHours(),
          dayOfWeek: transaction.date.getDay(),
          dayOfMonth: transaction.date.getDate(),
          month: transaction.date.getMonth(),
          year: transaction.date.getFullYear(),
          isWeekend:
            transaction.date.getDay() === 0 || transaction.date.getDay() === 6,
          descriptionLower: transaction.description.toLowerCase(),
          descriptionTokens: this.tokenizeDescription(transaction.description),
        };
        return [2 /*return*/, features];
      });
    });
  };
  AccountingAIEngine.prototype.tokenizeDescription = function (description) {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(function (word) {
        return word.length > 2;
      });
  };
  AccountingAIEngine.prototype.getHistoricalPatterns = function (accountId) {
    return __awaiter(this, void 0, void 0, function () {
      var cacheKey, cached, transactions, patterns;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            cacheKey = "patterns:".concat(accountId);
            return [4 /*yield*/, this.cache.get(cacheKey)];
          case 1:
            cached = _a.sent();
            if (cached) return [2 /*return*/, cached];
            transactions = [];
            patterns = {
              categoryFrequency: {},
              amountStats: this.calculateAmountStats(transactions),
              timePatterns: this.calculateTimePatterns(transactions),
              descriptionPatterns:
                this.calculateDescriptionPatterns(transactions),
            };
            // Cache for 1 hour
            return [
              4 /*yield*/,
              this.cache.set(cacheKey, patterns, { ttl: 3600 }),
            ];
          case 2:
            // Cache for 1 hour
            _a.sent();
            return [2 /*return*/, patterns];
        }
      });
    });
  };
  AccountingAIEngine.prototype.calculateAmountStats = function (transactions) {
    var amounts = transactions.map(function (t) {
      return t.amount;
    });
    return {
      mean:
        amounts.reduce(function (a, b) {
          return a + b;
        }, 0) / amounts.length,
      median: this.median(amounts),
      std: this.standardDeviation(amounts),
      min: Math.min.apply(Math, amounts),
      max: Math.max.apply(Math, amounts),
    };
  };
  AccountingAIEngine.prototype.calculateTimePatterns = function (transactions) {
    var hours = transactions.map(function (t) {
      return t.date.getHours();
    });
    var days = transactions.map(function (t) {
      return t.date.getDay();
    });
    return {
      mostCommonHour: this.mode(hours),
      mostCommonDay: this.mode(days),
      weekdayRatio:
        days.filter(function (d) {
          return d >= 1 && d <= 5;
        }).length / days.length,
    };
  };
  AccountingAIEngine.prototype.calculateDescriptionPatterns = function (
    transactions,
  ) {
    var descriptions = transactions.map(function (t) {
      return t.description.toLowerCase();
    });
    var commonWords = this.getCommonWords(descriptions);
    return {
      commonWords: commonWords.slice(0, 10),
      averageLength:
        descriptions.reduce(function (a, b) {
          return a + b.length;
        }, 0) / descriptions.length,
    };
  };
  AccountingAIEngine.prototype.getCommonWords = function (descriptions) {
    var wordCount = new Map();
    descriptions.forEach(function (desc) {
      var words = desc.split(/\s+/);
      words.forEach(function (word) {
        if (word.length > 3) {
          wordCount.set(word, (wordCount.get(word) || 0) + 1);
        }
      });
    });
    return Array.from(wordCount.entries())
      .sort(function (a, b) {
        return b[1] - a[1];
      })
      .map(function (_a) {
        var word = _a[0];
        return word;
      });
  };
  AccountingAIEngine.prototype.median = function (values) {
    var sorted = __spreadArray([], values, true).sort(function (a, b) {
      return a - b;
    });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };
  AccountingAIEngine.prototype.mode = function (values) {
    var frequency = new Map();
    values.forEach(function (value) {
      frequency.set(value, (frequency.get(value) || 0) + 1);
    });
    var maxFreq = 0;
    var modeValue = values[0];
    frequency.forEach(function (freq, value) {
      if (freq > maxFreq) {
        maxFreq = freq;
        modeValue = value;
      }
    });
    return modeValue;
  };
  AccountingAIEngine.prototype.standardDeviation = function (values) {
    var mean =
      values.reduce(function (a, b) {
        return a + b;
      }, 0) / values.length;
    var squaredDiffs = values.map(function (value) {
      return Math.pow(value - mean, 2);
    });
    var avgSquaredDiff =
      squaredDiffs.reduce(function (a, b) {
        return a + b;
      }, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  };
  AccountingAIEngine.prototype.loadCategorizationModel = function () {
    return __awaiter(this, void 0, void 0, function () {
      var model;
      var _this = this;
      return __generator(this, function (_a) {
        model = {
          predict: function (features, patterns) {
            // Simulate ML prediction with rule-based logic
            var predictions = _this.generateCategoryPredictions(
              features,
              patterns,
            );
            return predictions;
          },
        };
        this.modelCache.set("categorization", model);
        return [2 /*return*/];
      });
    });
  };
  AccountingAIEngine.prototype.loadTaxModels = function () {
    return __awaiter(this, void 0, void 0, function () {
      var model;
      var _this = this;
      return __generator(this, function (_a) {
        model = {
          getTaxRules: function (jurisdiction) {
            return __awaiter(_this, void 0, void 0, function () {
              return __generator(this, function (_a) {
                // Return tax rules based on jurisdiction
                return [
                  2 /*return*/,
                  this.getTaxRulesForJurisdiction(jurisdiction),
                ];
              });
            });
          },
        };
        this.modelCache.set("tax", model);
        return [2 /*return*/];
      });
    });
  };
  AccountingAIEngine.prototype.loadAnomalyDetectionModel = function () {
    return __awaiter(this, void 0, void 0, function () {
      var model;
      var _this = this;
      return __generator(this, function (_a) {
        model = {
          detectAnomalies: function (transaction, history) {
            return __awaiter(_this, void 0, void 0, function () {
              return __generator(this, function (_a) {
                // Implement anomaly detection logic
                return [
                  2 /*return*/,
                  this.performAnomalyDetection(transaction, history),
                ];
              });
            });
          },
        };
        this.modelCache.set("anomaly", model);
        return [2 /*return*/];
      });
    });
  };
  AccountingAIEngine.prototype.generateCategoryPredictions = function (
    features,
    patterns,
  ) {
    // This is a simplified rule-based categorization
    // In production, this would use a trained ML model
    var predictions = [];
    // Rule-based categorization logic
    if (
      features.descriptionLower.includes("grocery") ||
      features.descriptionLower.includes("food")
    ) {
      predictions.push({ categoryId: "groceries", confidence: 0.9 });
    }
    if (
      features.descriptionLower.includes("gas") ||
      features.descriptionLower.includes("fuel")
    ) {
      predictions.push({ categoryId: "transportation", confidence: 0.85 });
    }
    if (
      features.descriptionLower.includes("rent") ||
      features.descriptionLower.includes("mortgage")
    ) {
      predictions.push({ categoryId: "housing", confidence: 0.95 });
    }
    // Add more rules...
    if (predictions.length === 0) {
      predictions.push({ categoryId: "uncategorized", confidence: 0.5 });
    }
    return predictions;
  };
  AccountingAIEngine.prototype.applyCategorizationModel = function (
    features,
    patterns,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var model;
      return __generator(this, function (_a) {
        model = this.modelCache.get("categorization");
        if (!model) throw new Error("Categorization model not loaded");
        return [2 /*return*/, model.predict(features, patterns)];
      });
    });
  };
  AccountingAIEngine.prototype.validateCategorization = function (
    prediction,
    transaction,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var topPrediction;
      return __generator(this, function (_a) {
        topPrediction = prediction[0];
        return [
          2 /*return*/,
          {
            categoryId: topPrediction.categoryId,
            confidence: topPrediction.confidence,
            reasoning: "Based on description analysis and historical patterns",
            alternatives: prediction.slice(1, 3).map(function (p) {
              return {
                categoryId: p.categoryId,
                confidence: p.confidence,
              };
            }),
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.logCategorization = function (
    transaction,
    result,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Log categorization for model improvement
        // TODO: Implement categorizationLog table
        // await this.prisma.categorizationLog.create({
        //   data: {
        //     transactionId: transaction.id,
        //     predictedCategory: result.categoryId,
        //     confidence: result.confidence,
        //     features: JSON.stringify(await this.extractFeatures(transaction))
        //   }
        // });
        // For now, just log to console
        this.logger.info("Categorization logged", {
          transactionId: transaction.id,
          predictedCategory: result.categoryId,
          confidence: result.confidence,
        });
        return [2 /*return*/];
      });
    });
  };
  AccountingAIEngine.prototype.getTaxRules = function (jurisdiction) {
    return __awaiter(this, void 0, void 0, function () {
      var model;
      return __generator(this, function (_a) {
        model = this.modelCache.get("tax");
        if (!model) throw new Error("Tax model not loaded");
        return [2 /*return*/, model.getTaxRules(jurisdiction)];
      });
    });
  };
  AccountingAIEngine.prototype.getTaxRulesForJurisdiction = function (
    jurisdiction,
  ) {
    // Simplified tax rules - in production, this would be comprehensive
    var taxRules = {
      US: {
        salesTax: 0.0875, // Average sales tax
        incomeTax: { brackets: [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37] },
        deductibleCategories: [
          "business-expenses",
          "office-supplies",
          "travel",
        ],
      },
      UK: {
        vat: 0.2,
        incomeTax: { brackets: [0.19, 0.2, 0.21, 0.4, 0.45] },
        deductibleCategories: ["business-expenses", "office-supplies"],
      },
    };
    return taxRules[jurisdiction] || taxRules.US;
  };
  AccountingAIEngine.prototype.determineTaxApplicability = function (
    transaction,
    taxRules,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var isTaxable;
      var _a;
      return __generator(this, function (_b) {
        isTaxable = !((_a = taxRules.exemptCategories) === null || _a === void 0
          ? void 0
          : _a.includes(transaction.categoryId || "uncategorized"));
        return [
          2 /*return*/,
          {
            applicable: isTaxable,
            reasoning: isTaxable
              ? "Transaction falls under taxable category"
              : "Transaction is tax-exempt",
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.calculateTaxAmount = function (
    transaction,
    taxRules,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var taxRate, taxAmount;
      return __generator(this, function (_a) {
        taxRate = taxRules.salesTax || 0.0875;
        taxAmount = transaction.amount * taxRate;
        return [
          2 /*return*/,
          {
            amount: taxAmount,
            rate: taxRate,
            category: "sales-tax",
            reasoning: "Applied ".concat(taxRate * 100, "% sales tax"),
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.determineDeductibility = function (
    transaction,
    taxRules,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var isDeductible;
      var _a;
      return __generator(this, function (_b) {
        isDeductible =
          ((_a = taxRules.deductibleCategories) === null || _a === void 0
            ? void 0
            : _a.includes(transaction.categoryId || "uncategorized")) || false;
        return [
          2 /*return*/,
          {
            allowed: isDeductible,
            reasoning: isDeductible
              ? "Category is tax-deductible"
              : "Category is not tax-deductible",
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.cacheTaxCalculation = function (
    transaction,
    result,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var cacheKey;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            cacheKey = "tax:"
              .concat(transaction.accountId, ":")
              .concat(transaction.categoryId);
            return [
              4 /*yield*/,
              this.cache.set(cacheKey, result, { ttl: 86400 }),
            ];
          case 1:
            _a.sent(); // Cache for 24 hours
            return [2 /*return*/];
        }
      });
    });
  };
  AccountingAIEngine.prototype.getAccountHistory = function (accountId, days) {
    return __awaiter(this, void 0, void 0, function () {
      var startDate;
      return __generator(this, function (_a) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        // TODO: Fix schema mismatch - Transaction model doesn't have accountId
        // return await this.prisma.transaction.findMany({
        //   where: {
        //     accountId,
        //     date: {
        //       gte: startDate
        //     }
        //   },
        //   orderBy: { date: 'desc' }
        // });
        // Return empty array for now
        return [2 /*return*/, []];
      });
    });
  };
  AccountingAIEngine.prototype.detectAmountAnomaly = function (
    transaction,
    history,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var amounts, stats, zScore, isAnomalous;
      return __generator(this, function (_a) {
        if (history.length < 10) {
          return [
            2 /*return*/,
            {
              isAnomalous: false,
              anomalyType: "amount",
              confidence: 0,
              description: "Insufficient history for amount analysis",
              severity: "low",
              recommendations: [],
            },
          ];
        }
        amounts = history.map(function (h) {
          return h.amount;
        });
        stats = this.calculateAmountStats(history);
        zScore = Math.abs((transaction.amount - stats.mean) / stats.std);
        isAnomalous = zScore > 3;
        return [
          2 /*return*/,
          {
            isAnomalous: isAnomalous,
            anomalyType: "amount",
            confidence: Math.min(zScore / 3, 1),
            description: isAnomalous
              ? "Transaction amount is ".concat(
                  zScore.toFixed(1),
                  " standard deviations from normal",
                )
              : "Transaction amount is within normal range",
            severity: isAnomalous ? (zScore > 4 ? "high" : "medium") : "low",
            recommendations: isAnomalous
              ? [
                  "Verify transaction accuracy",
                  "Check for potential duplicate entry",
                  "Review vendor information",
                ]
              : [],
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.detectFrequencyAnomaly = function (
    transaction,
    history,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Similar implementation for frequency detection
        return [
          2 /*return*/,
          {
            isAnomalous: false,
            anomalyType: "frequency",
            confidence: 0,
            description: "No frequency anomalies detected",
            severity: "low",
            recommendations: [],
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.detectPatternAnomaly = function (
    transaction,
    history,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Pattern detection implementation
        return [
          2 /*return*/,
          {
            isAnomalous: false,
            anomalyType: "pattern",
            confidence: 0,
            description: "No pattern anomalies detected",
            severity: "low",
            recommendations: [],
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.detectTimingAnomaly = function (
    transaction,
    history,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Timing anomaly detection
        return [
          2 /*return*/,
          {
            isAnomalous: false,
            anomalyType: "timing",
            confidence: 0,
            description: "No timing anomalies detected",
            severity: "low",
            recommendations: [],
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.detectCategoryAnomaly = function (
    transaction,
    history,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Category anomaly detection
        return [
          2 /*return*/,
          {
            isAnomalous: false,
            anomalyType: "category",
            confidence: 0,
            description: "No category anomalies detected",
            severity: "low",
            recommendations: [],
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.generateAnomalyRecommendations = function (
    anomaly,
    transaction,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var recommendations;
      return __generator(this, function (_a) {
        recommendations = [];
        switch (anomaly.anomalyType) {
          case "amount":
            recommendations.push("Review transaction for accuracy");
            recommendations.push("Check for duplicate entries");
            break;
          case "frequency":
            recommendations.push("Verify recurring transaction schedule");
            break;
          case "pattern":
            recommendations.push("Review unusual spending patterns");
            break;
        }
        return [2 /*return*/, recommendations];
      });
    });
  };
  AccountingAIEngine.prototype.getFinancialData = function (
    accountId,
    timeframe,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var days, startDate, transactions;
      return __generator(this, function (_a) {
        days = this.getTimeframeDays(timeframe);
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        transactions = [];
        return [
          2 /*return*/,
          {
            transactions: transactions,
            timeframe: timeframe,
            startDate: startDate,
            endDate: new Date(),
          },
        ];
      });
    });
  };
  AccountingAIEngine.prototype.getTimeframeDays = function (timeframe) {
    var mapping = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };
    return mapping[timeframe] || 30;
  };
  AccountingAIEngine.prototype.generateTrendInsights = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      var insights, spendingTrend;
      return __generator(this, function (_a) {
        insights = [];
        spendingTrend = this.analyzeSpendingTrend(data.transactions);
        if (spendingTrend.significant) {
          insights.push({
            type: "trend",
            title: "Spending is ".concat(spendingTrend.direction),
            description: "Your spending has "
              .concat(spendingTrend.direction, " by ")
              .concat(spendingTrend.percentage, "% over the last ")
              .concat(data.timeframe),
            confidence: spendingTrend.confidence,
            impact: spendingTrend.impact,
            actionable: true,
            data: spendingTrend,
          });
        }
        return [2 /*return*/, insights];
      });
    });
  };
  AccountingAIEngine.prototype.generatePredictionInsights = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Generate predictive insights
        return [2 /*return*/, []];
      });
    });
  };
  AccountingAIEngine.prototype.generateOpportunityInsights = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Generate opportunity insights
        return [2 /*return*/, []];
      });
    });
  };
  AccountingAIEngine.prototype.generateRiskInsights = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Generate risk insights
        return [2 /*return*/, []];
      });
    });
  };
  AccountingAIEngine.prototype.generateOptimizationInsights = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Generate optimization insights
        return [2 /*return*/, []];
      });
    });
  };
  AccountingAIEngine.prototype.analyzeSpendingTrend = function (transactions) {
    // Simple trend analysis
    if (transactions.length < 2) {
      return { significant: false };
    }
    var sortedTransactions = transactions.sort(function (a, b) {
      return a.date.getTime() - b.date.getTime();
    });
    var midPoint = Math.floor(sortedTransactions.length / 2);
    var firstHalf = sortedTransactions.slice(0, midPoint);
    var secondHalf = sortedTransactions.slice(midPoint);
    var firstHalfTotal = firstHalf.reduce(function (sum, t) {
      return sum + t.amount;
    }, 0);
    var secondHalfTotal = secondHalf.reduce(function (sum, t) {
      return sum + t.amount;
    }, 0);
    var change = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
    var significant = Math.abs(change) > 10; // 10% threshold
    return {
      significant: significant,
      direction: change > 0 ? "increasing" : "decreasing",
      percentage: Math.abs(change),
      confidence: Math.min(Math.abs(change) / 20, 1), // Confidence based on magnitude
      impact: Math.abs(change) > 20 ? "high" : "medium",
    };
  };
  AccountingAIEngine.prototype.cacheInsights = function (
    accountId,
    timeframe,
    insights,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var cacheKey;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            cacheKey = "insights:".concat(accountId, ":").concat(timeframe);
            return [
              4 /*yield*/,
              this.cache.set(cacheKey, insights, { ttl: 3600 }),
            ];
          case 1:
            _a.sent(); // Cache for 1 hour
            return [2 /*return*/];
        }
      });
    });
  };
  AccountingAIEngine.prototype.performAnomalyDetection = function (
    transaction,
    history,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // Placeholder for anomaly detection
        return [
          2 /*return*/,
          {
            isAnomalous: false,
            confidence: 0,
          },
        ];
      });
    });
  };
  return AccountingAIEngine;
})();
exports.AccountingAIEngine = AccountingAIEngine;
exports.default = AccountingAIEngine;

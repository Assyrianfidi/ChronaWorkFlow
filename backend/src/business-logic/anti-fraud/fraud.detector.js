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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudMonitoringService = exports.FraudDetector = void 0;
var logger_js_1 = require("../../utils/logger.js");
var FraudDetector = /** @class */ (function () {
    function FraudDetector() {
    }
    /**
     * Initialize fraud detection rules
     */
    FraudDetector.initializeRules = function () {
        this.rules = [
            // Rule 1: Unusually large transaction
            {
                id: 'LARGE_AMOUNT',
                name: 'Unusually Large Transaction',
                description: 'Transaction amount is significantly higher than user average',
                enabled: true,
                severity: 'high',
                action: 'flag',
                checkFunction: this.checkLargeAmount.bind(this)
            },
            // Rule 2: Rapid successive transactions
            {
                id: 'RAPID_TRANSACTIONS',
                name: 'Rapid Successive Transactions',
                description: 'Multiple transactions in short time period',
                enabled: true,
                severity: 'medium',
                action: 'monitor',
                checkFunction: this.checkRapidTransactions.bind(this)
            },
            // Rule 3: Unusual location
            {
                id: 'UNUSUAL_LOCATION',
                name: 'Transaction from Unusual Location',
                description: 'Transaction from location not normally used by user',
                enabled: true,
                severity: 'medium',
                action: 'flag',
                checkFunction: this.checkUnusualLocation.bind(this)
            },
            // Rule 4: Unusual device
            {
                id: 'UNUSUAL_DEVICE',
                name: 'Transaction from Unusual Device',
                description: 'Transaction from device not normally used by user',
                enabled: true,
                severity: 'medium',
                action: 'flag',
                checkFunction: this.checkUnusualDevice.bind(this)
            },
            // Rule 5: Round number amount (potential money laundering)
            {
                id: 'ROUND_AMOUNT',
                name: 'Round Number Transaction',
                description: 'Transaction amount is a round number (potential structuring)',
                enabled: true,
                severity: 'low',
                action: 'monitor',
                checkFunction: this.checkRoundAmount.bind(this)
            },
            // Rule 6: High velocity transactions
            {
                id: 'HIGH_VELOCITY',
                name: 'High Velocity Transactions',
                description: 'Many transactions exceeding normal frequency',
                enabled: true,
                severity: 'high',
                action: 'block',
                checkFunction: this.checkHighVelocity.bind(this)
            },
            // Rule 7: New account high value
            {
                id: 'NEW_ACCOUNT_HIGH_VALUE',
                name: 'High Value Transaction from New Account',
                description: 'Large transaction from recently created account',
                enabled: true,
                severity: 'critical',
                action: 'block',
                checkFunction: this.checkNewAccountHighValue.bind(this)
            },
            // Rule 8: Suspicious merchant category
            {
                id: 'SUSPICIOUS_MERCHANT',
                name: 'Transaction with Suspicious Merchant',
                description: 'Transaction with merchant category flagged as high risk',
                enabled: true,
                severity: 'medium',
                action: 'flag',
                checkFunction: this.checkSuspiciousMerchant.bind(this)
            },
            // Rule 9: Multiple failed transactions
            {
                id: 'MULTIPLE_FAILED',
                name: 'Multiple Failed Transactions',
                description: 'Multiple failed transaction attempts',
                enabled: true,
                severity: 'high',
                action: 'block',
                checkFunction: this.checkMultipleFailed.bind(this)
            },
            // Rule 10: Account takeover pattern
            {
                id: 'ACCOUNT_TAKEOVER',
                name: 'Potential Account Takeover',
                description: 'Multiple indicators of account takeover',
                enabled: true,
                severity: 'critical',
                action: 'block',
                checkFunction: this.checkAccountTakeover.bind(this)
            }
        ];
    };
    /**
     * Analyze transaction for fraud
     */
    FraudDetector.analyzeTransaction = function (currentTransaction, historicalPatterns) {
        return __awaiter(this, void 0, void 0, function () {
            var alerts, highestSeverity, userProfile, _i, _a, rule, alert_1, riskScore, blocked;
            return __generator(this, function (_b) {
                this.initializeRules();
                alerts = [];
                highestSeverity = 'low';
                userProfile = this.getUserProfile(currentTransaction.userId, historicalPatterns);
                // Run all enabled rules
                for (_i = 0, _a = this.rules; _i < _a.length; _i++) {
                    rule = _a[_i];
                    if (!rule.enabled)
                        continue;
                    try {
                        alert_1 = rule.checkFunction(historicalPatterns, currentTransaction);
                        if (alert_1) {
                            alerts.push(alert_1);
                            // Track highest severity
                            if (this.getSeverityLevel(alert_1.severity) > this.getSeverityLevel(highestSeverity)) {
                                highestSeverity = alert_1.severity;
                            }
                        }
                    }
                    catch (error) {
                        console.error("Error in fraud rule ".concat(rule.id, ":"), error);
                    }
                }
                riskScore = this.calculateRiskScore(alerts, userProfile);
                blocked = alerts.some(function (alert) { return alert.action === 'block'; });
                // Log fraud analysis
                logger_js_1.logger.warn('Suspicious activity detected', {
                    transactionId: currentTransaction.timestamp.getTime().toString(),
                    amount: currentTransaction.amount,
                    riskScore: riskScore,
                    alertsCount: alerts.length,
                    blocked: blocked,
                    highestSeverity: highestSeverity
                });
                return [2 /*return*/, {
                        approved: !blocked,
                        alerts: alerts,
                        riskScore: riskScore
                    }];
            });
        });
    };
    /**
     * Fraud rule implementations
     */
    FraudDetector.checkLargeAmount = function (patterns, current) {
        var userPatterns = patterns.filter(function (p) { return p.userId === current.userId; });
        if (userPatterns.length < 5)
            return null; // Not enough history
        var avgAmount = userPatterns.reduce(function (sum, p) { return sum + p.amount; }, 0) / userPatterns.length;
        var threshold = avgAmount * 5; // 5x average
        if (current.amount > threshold) {
            return {
                id: "ALERT_".concat(Date.now(), "_LARGE"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'LARGE_AMOUNT',
                severity: 'high',
                description: "Transaction amount $".concat(current.amount, " is ").concat(Math.round(current.amount / avgAmount), "x user average"),
                confidence: Math.min(0.9, (current.amount / avgAmount - 5) / 10),
                detectedAt: new Date(),
                metadata: {
                    avgAmount: avgAmount,
                    threshold: threshold,
                    ratio: current.amount / avgAmount
                },
                action: 'flag'
            };
        }
        return null;
    };
    FraudDetector.checkRapidTransactions = function (patterns, current) {
        var userPatterns = patterns.filter(function (p) {
            return p.userId === current.userId &&
                p.accountId === current.accountId;
        });
        // Check for transactions in last 5 minutes
        var fiveMinutesAgo = new Date(current.timestamp.getTime() - 5 * 60 * 1000);
        var recentTransactions = userPatterns.filter(function (p) { return p.timestamp > fiveMinutesAgo; });
        if (recentTransactions.length >= 3) {
            return {
                id: "ALERT_".concat(Date.now(), "_RAPID"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'RAPID_TRANSACTIONS',
                severity: 'medium',
                description: "".concat(recentTransactions.length, " transactions in last 5 minutes"),
                confidence: Math.min(0.8, recentTransactions.length / 5),
                detectedAt: new Date(),
                metadata: {
                    recentCount: recentTransactions.length,
                    timeframe: '5 minutes'
                },
                action: 'monitor'
            };
        }
        return null;
    };
    FraudDetector.checkUnusualLocation = function (patterns, current) {
        if (!current.location)
            return null;
        var userPatterns = patterns.filter(function (p) { return p.userId === current.userId && p.location; });
        var locations = __spreadArray([], new Set(userPatterns.map(function (p) { return p.location; })), true);
        if (locations.length > 0 && !locations.includes(current.location)) {
            return {
                id: "ALERT_".concat(Date.now(), "_LOCATION"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'UNUSUAL_LOCATION',
                severity: 'medium',
                description: "Transaction from new location: ".concat(current.location),
                confidence: 0.7,
                detectedAt: new Date(),
                metadata: {
                    newLocation: current.location,
                    usualLocations: locations
                },
                action: 'flag'
            };
        }
        return null;
    };
    FraudDetector.checkUnusualDevice = function (patterns, current) {
        if (!current.device)
            return null;
        var userPatterns = patterns.filter(function (p) { return p.userId === current.userId && p.device; });
        var devices = __spreadArray([], new Set(userPatterns.map(function (p) { return p.device; })), true);
        if (devices.length > 0 && !devices.includes(current.device)) {
            return {
                id: "ALERT_".concat(Date.now(), "_DEVICE"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'UNUSUAL_DEVICE',
                severity: 'medium',
                description: "Transaction from new device: ".concat(current.device),
                confidence: 0.6,
                detectedAt: new Date(),
                metadata: {
                    newDevice: current.device,
                    usualDevices: devices
                },
                action: 'flag'
            };
        }
        return null;
    };
    FraudDetector.checkRoundAmount = function (patterns, current) {
        // Check if amount is a round number (e.g., 1000, 5000, 10000)
        var isRoundNumber = current.amount >= 1000 &&
            current.amount % 1000 === 0 &&
            current.amount.toString().length <= 5;
        if (isRoundNumber) {
            return {
                id: "ALERT_".concat(Date.now(), "_ROUND"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'ROUND_AMOUNT',
                severity: 'low',
                description: "Round number transaction: $".concat(current.amount),
                confidence: 0.4,
                detectedAt: new Date(),
                metadata: {
                    amount: current.amount
                },
                action: 'monitor'
            };
        }
        return null;
    };
    FraudDetector.checkHighVelocity = function (patterns, current) {
        var userPatterns = patterns.filter(function (p) {
            return p.userId === current.userId &&
                p.timestamp > new Date(current.timestamp.getTime() - 24 * 60 * 60 * 1000);
        } // Last 24 hours
        );
        // More than 50 transactions in 24 hours
        if (userPatterns.length > 50) {
            return {
                id: "ALERT_".concat(Date.now(), "_VELOCITY"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'HIGH_VELOCITY',
                severity: 'high',
                description: "".concat(userPatterns.length, " transactions in last 24 hours"),
                confidence: Math.min(0.9, userPatterns.length / 100),
                detectedAt: new Date(),
                metadata: {
                    transactionCount: userPatterns.length,
                    timeframe: '24 hours'
                },
                action: 'block'
            };
        }
        return null;
    };
    FraudDetector.checkNewAccountHighValue = function (patterns, current) {
        var userPatterns = patterns.filter(function (p) { return p.userId === current.userId; });
        if (userPatterns.length === 0 && current.amount > 5000) {
            return {
                id: "ALERT_".concat(Date.now(), "_NEW_HIGH"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'NEW_ACCOUNT_HIGH_VALUE',
                severity: 'critical',
                description: "High value transaction ($".concat(current.amount, ") from new account"),
                confidence: 0.8,
                detectedAt: new Date(),
                metadata: {
                    amount: current.amount,
                    isFirstTransaction: true
                },
                action: 'block'
            };
        }
        return null;
    };
    FraudDetector.checkSuspiciousMerchant = function (patterns, current) {
        if (!current.merchantCategory)
            return null;
        var suspiciousCategories = [
            'CRYPTOCURRENCY_EXCHANGE',
            'GAMBLING',
            'MONEY_TRANSFER',
            'PRECIOUS_METALS',
            'CASH_ADVANCE'
        ];
        if (suspiciousCategories.includes(current.merchantCategory)) {
            return {
                id: "ALERT_".concat(Date.now(), "_MERCHANT"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'SUSPICIOUS_MERCHANT',
                severity: 'medium',
                description: "Transaction with suspicious merchant: ".concat(current.merchantCategory),
                confidence: 0.6,
                detectedAt: new Date(),
                metadata: {
                    merchantCategory: current.merchantCategory
                },
                action: 'flag'
            };
        }
        return null;
    };
    FraudDetector.checkMultipleFailed = function (patterns, current) {
        // This would need access to failed transaction attempts
        // For now, return null as we don't have that data
        return null;
    };
    FraudDetector.checkAccountTakeover = function (patterns, current) {
        var suspiciousIndicators = 0;
        // Check for multiple risk factors
        if (current.location && current.device) {
            var userPatterns = patterns.filter(function (p) { return p.userId === current.userId; });
            var locations = __spreadArray([], new Set(userPatterns.map(function (p) { return p.location; }).filter(Boolean)), true);
            var devices = __spreadArray([], new Set(userPatterns.map(function (p) { return p.device; }).filter(Boolean)), true);
            if (!locations.includes(current.location))
                suspiciousIndicators++;
            if (!devices.includes(current.device))
                suspiciousIndicators++;
        }
        if (current.amount > 10000)
            suspiciousIndicators++;
        if (suspiciousIndicators >= 2) {
            return {
                id: "ALERT_".concat(Date.now(), "_TAKEOVER"),
                userId: current.userId,
                accountId: current.accountId,
                alertType: 'ACCOUNT_TAKEOVER',
                severity: 'critical',
                description: "Multiple indicators of account takeover (".concat(suspiciousIndicators, " risk factors)"),
                confidence: 0.8,
                detectedAt: new Date(),
                metadata: {
                    suspiciousIndicators: suspiciousIndicators,
                    factors: {
                        unusualLocation: current.location && !patterns.some(function (p) { return p.location === current.location; }),
                        unusualDevice: current.device && !patterns.some(function (p) { return p.device === current.device; }),
                        highAmount: current.amount > 10000
                    }
                },
                action: 'block'
            };
        }
        return null;
    };
    /**
     * Helper methods
     */
    FraudDetector.getUserProfile = function (userId, patterns) {
        if (this.userProfiles.has(userId)) {
            return this.userProfiles.get(userId);
        }
        var userPatterns = patterns.filter(function (p) { return p.userId === userId; });
        var avgAmount = userPatterns.length > 0
            ? userPatterns.reduce(function (sum, p) { return sum + p.amount; }, 0) / userPatterns.length
            : 0;
        var locations = __spreadArray([], new Set(userPatterns.map(function (p) { return p.location; }).filter(Boolean)), true);
        var devices = __spreadArray([], new Set(userPatterns.map(function (p) { return p.device; }).filter(Boolean)), true);
        var merchants = __spreadArray([], new Set(userPatterns.map(function (p) { return p.merchantCategory; }).filter(Boolean)), true);
        var profile = {
            userId: userId,
            avgTransactionAmount: avgAmount,
            transactionFrequency: userPatterns.length / Math.max(1, userPatterns.length > 0 ? 30 : 30), // per day
            usualLocations: locations.filter(Boolean),
            usualDevices: devices.filter(Boolean),
            usualMerchants: merchants.filter(Boolean),
            accountAge: userPatterns.length > 0
                ? (Date.now() - Math.min.apply(Math, userPatterns.map(function (p) { return p.timestamp.getTime(); }))) / (1000 * 60 * 60 * 24)
                : 0,
            riskScore: 0.5 // Default medium risk
        };
        this.userProfiles.set(userId, profile);
        return profile;
    };
    FraudDetector.calculateRiskScore = function (alerts, profile) {
        if (alerts.length === 0)
            return profile.riskScore * 0.5; // Reduce risk with no alerts
        var severityWeights = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
        var maxSeverity = Math.max.apply(Math, alerts.map(function (a) { return severityWeights[a.severity]; }));
        return Math.min(1, profile.riskScore + maxSeverity * 0.5);
    };
    FraudDetector.getSeverityLevel = function (severity) {
        var levels = { low: 1, medium: 2, high: 3, critical: 4 };
        return levels[severity] || 0;
    };
    /**
     * Public API methods
     */
    FraudDetector.addCustomRule = function (rule) {
        this.rules.push(rule);
    };
    FraudDetector.enableRule = function (ruleId) {
        var rule = this.rules.find(function (r) { return r.id === ruleId; });
        if (rule)
            rule.enabled = true;
    };
    FraudDetector.disableRule = function (ruleId) {
        var rule = this.rules.find(function (r) { return r.id === ruleId; });
        if (rule)
            rule.enabled = false;
    };
    FraudDetector.getActiveRules = function () {
        return this.rules.filter(function (r) { return r.enabled; });
    };
    FraudDetector.rules = [];
    FraudDetector.userProfiles = new Map();
    return FraudDetector;
}());
exports.FraudDetector = FraudDetector;
/**
 * Fraud monitoring service
 */
var FraudMonitoringService = /** @class */ (function () {
    function FraudMonitoringService() {
    }
    FraudMonitoringService.recordAlert = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.alerts.push(alert);
                        // Log the fraud alert
                        logger_js_1.logger.warn('Fraud alert recorded', {
                            alertId: alert.id,
                            alertType: alert.alertType,
                            severity: alert.severity,
                            confidence: alert.confidence,
                            action: alert.action,
                            userId: alert.userId
                        });
                        if (!(alert.severity === 'critical')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.triggerCriticalAlert(alert)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    FraudMonitoringService.triggerCriticalAlert = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real system, this would send notifications to security team
                console.error('CRITICAL FRAUD ALERT:', alert);
                logger_js_1.logger.error('Critical fraud alert', {
                    alertId: alert.id,
                    userId: alert.userId,
                    description: alert.description
                });
                return [2 /*return*/];
            });
        });
    };
    FraudMonitoringService.getAlertsForUser = function (userId, limit) {
        if (limit === void 0) { limit = 50; }
        return this.alerts
            .filter(function (a) { return a.userId === userId; })
            .sort(function (a, b) { return b.detectedAt.getTime() - a.detectedAt.getTime(); })
            .slice(0, limit);
    };
    FraudMonitoringService.getAlertsBySeverity = function (severity, limit) {
        if (limit === void 0) { limit = 100; }
        return this.alerts
            .filter(function (a) { return a.severity === severity; })
            .sort(function (a, b) { return b.detectedAt.getTime() - a.detectedAt.getTime(); })
            .slice(0, limit);
    };
    FraudMonitoringService.alerts = [];
    return FraudMonitoringService;
}());
exports.FraudMonitoringService = FraudMonitoringService;

"use strict";
/**
 * Event Bus Implementation
 * Simple event emitter for inter-module communication
 */
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
exports.EventBus = void 0;
var EventBus = /** @class */ (function () {
    function EventBus() {
        this.events = new Map();
    }
    /**
     * Subscribe to an event
     */
    EventBus.prototype.on = function (event, handler) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(handler);
    };
    /**
     * Subscribe to an event once
     */
    EventBus.prototype.once = function (event, handler) {
        var _this = this;
        var onceHandler = function (data) {
            handler(data);
            _this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    };
    /**
     * Unsubscribe from an event
     */
    EventBus.prototype.off = function (event, handler) {
        var handlers = this.events.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.events.delete(event);
            }
        }
    };
    /**
     * Emit an event
     */
    EventBus.prototype.emit = function (event, data) {
        return __awaiter(this, void 0, void 0, function () {
            var handlers, promises;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        handlers = this.events.get(event);
                        if (!handlers) return [3 /*break*/, 2];
                        promises = Array.from(handlers).map(function (handler) {
                            try {
                                return Promise.resolve(handler(data));
                            }
                            catch (error) {
                                console.error("Error in event handler for ".concat(event, ":"), error);
                                return Promise.resolve();
                            }
                        });
                        return [4 /*yield*/, Promise.all(promises)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove all event listeners
     */
    EventBus.prototype.removeAllListeners = function (event) {
        if (event) {
            this.events.delete(event);
        }
        else {
            this.events.clear();
        }
    };
    /**
     * Get the number of listeners for an event
     */
    EventBus.prototype.listenerCount = function (event) {
        var _a;
        return ((_a = this.events.get(event)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    };
    /**
     * Get all event names
     */
    EventBus.prototype.eventNames = function () {
        return Array.from(this.events.keys());
    };
    return EventBus;
}());
exports.EventBus = EventBus;
exports.default = EventBus;

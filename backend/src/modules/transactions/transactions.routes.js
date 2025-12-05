"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var transactions_controller_js_1 = require("./transactions.controller.js");
var router = (0, express_1.Router)();
// Simple routes without complex middleware for testing
router.get('/', transactions_controller_js_1.transactionsController.list);
router.post('/', transactions_controller_js_1.transactionsController.create);
exports.default = router;

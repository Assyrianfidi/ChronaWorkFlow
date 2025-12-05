"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var accounts_controller_js_1 = require("./accounts.controller.js");
var router = (0, express_1.Router)();
// Simple routes without complex middleware for testing
router.get('/', accounts_controller_js_1.accountsController.list);
router.post('/', accounts_controller_js_1.accountsController.create);
router.patch('/:id', accounts_controller_js_1.accountsController.update);
router.post('/:id/balance', accounts_controller_js_1.accountsController.adjustBalance);
exports.default = router;

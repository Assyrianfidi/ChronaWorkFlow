"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Test currency precision directly
var financial_calculator_1 = require("./src/business-logic/calculations/financial.calculator");
// Access the private method using bracket notation
var getCurrencyPrecision = financial_calculator_1.FinancialCalculator.getCurrencyPrecision;
console.log('JPY Precision:', getCurrencyPrecision('JPY'));
console.log('USD Precision:', getCurrencyPrecision('USD'));
console.log('EUR Precision:', getCurrencyPrecision('EUR'));
var result = financial_calculator_1.FinancialCalculator.convertCurrency(100, 'USD', 'JPY', 110.123);
console.log('Conversion result:', result);

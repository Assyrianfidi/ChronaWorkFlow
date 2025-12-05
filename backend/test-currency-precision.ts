// Test currency precision directly
import { FinancialCalculator } from './src/business-logic/calculations/financial.calculator';

// Access the private method using bracket notation
const getCurrencyPrecision = (FinancialCalculator as any).getCurrencyPrecision;

console.log('JPY Precision:', getCurrencyPrecision('JPY'));
console.log('USD Precision:', getCurrencyPrecision('USD'));
console.log('EUR Precision:', getCurrencyPrecision('EUR'));

const result = FinancialCalculator.convertCurrency(100, 'USD', 'JPY', 110.123);
console.log('Conversion result:', result);

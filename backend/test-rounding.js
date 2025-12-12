// Simple test for rounding function
function roundToPrecision(value, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

function getCurrencyPrecision(currency) {
  const precisions = {
    USD: 2,
    EUR: 2,
    GBP: 2,
    JPY: 0,
    CHF: 2,
    CAD: 2,
    AUD: 2,
    CNY: 2,
    INR: 2,
    BTC: 8,
  };
  return precisions[currency] || 2;
}

// Test JPY conversion
const amount = 100;
const exchangeRate = 110.123;
const convertedAmount = amount * exchangeRate;
const precision = getCurrencyPrecision("JPY");
const result = roundToPrecision(convertedAmount, precision);

console.log("Amount:", amount);
console.log("Exchange rate:", exchangeRate);
console.log("Converted amount:", convertedAmount);
console.log("Precision for JPY:", precision);
console.log("Factor:", Math.pow(10, precision));
console.log(
  "Rounded value:",
  Math.round(convertedAmount * Math.pow(10, precision)),
);
console.log("Final result:", result);
console.log("Expected: 11012");

// Test with precision 0 explicitly
const precisionZero = 0;
const resultZero = roundToPrecision(convertedAmount, precisionZero);
console.log("\nWith explicit precision 0:");
console.log("Factor:", Math.pow(10, precisionZero));
console.log(
  "Rounded value:",
  Math.round(convertedAmount * Math.pow(10, precisionZero)),
);
console.log("Final result:", resultZero);

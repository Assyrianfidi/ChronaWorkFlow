"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var financial_calculator_1 = require("../../business-logic/calculations/financial.calculator");
describe("Financial Calculator", function () {
  describe("convertCurrency", function () {
    it("should convert currency correctly", function () {
      var result = financial_calculator_1.FinancialCalculator.convertCurrency(
        100,
        "USD",
        "EUR",
        0.85,
      );
      expect(result).toBe(85.0);
    });
    it("should round to correct precision", function () {
      var result = financial_calculator_1.FinancialCalculator.convertCurrency(
        100,
        "USD",
        "JPY",
        110.123,
      );
      expect(result).toBe(11012); // JPY has 0 decimal places, rounds 11012.3 to 11012
    });
    it("should reject negative amounts", function () {
      expect(function () {
        return financial_calculator_1.FinancialCalculator.convertCurrency(
          -100,
          "USD",
          "EUR",
          0.85,
        );
      }).toThrow("Cannot convert negative amounts");
    });
    it("should reject zero or negative exchange rate", function () {
      expect(function () {
        return financial_calculator_1.FinancialCalculator.convertCurrency(
          100,
          "USD",
          "EUR",
          0,
        );
      }).toThrow("Exchange rate must be positive");
      expect(function () {
        return financial_calculator_1.FinancialCalculator.convertCurrency(
          100,
          "USD",
          "EUR",
          -0.5,
        );
      }).toThrow("Exchange rate must be positive");
    });
  });
  describe("calculateTax", function () {
    it("should calculate tax correctly", function () {
      var result = financial_calculator_1.FinancialCalculator.calculateTax(
        100,
        0.08,
      );
      expect(result).toEqual({
        amount: 100,
        taxRate: 0.08,
        taxAmount: 8.0,
        totalAmount: 108.0,
        taxType: "STANDARD",
      });
    });
    it("should handle zero tax rate", function () {
      var result = financial_calculator_1.FinancialCalculator.calculateTax(
        100,
        0,
      );
      expect(result).toEqual({
        amount: 100,
        taxRate: 0,
        taxAmount: 0.0,
        totalAmount: 100.0,
        taxType: "STANDARD",
      });
    });
    it("should reject negative amounts", function () {
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateTax(
          -100,
          0.08,
        );
      }).toThrow("Cannot calculate tax on negative amount");
    });
    it("should reject tax rate outside 0-1 range", function () {
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateTax(
          100,
          -0.1,
        );
      }).toThrow("Tax rate must be between 0 and 1 (0-100%)");
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateTax(
          100,
          1.5,
        );
      }).toThrow("Tax rate must be between 0 and 1 (0-100%)");
    });
  });
  describe("calculateInterest", function () {
    it("should calculate compound interest correctly", function () {
      var result = financial_calculator_1.FinancialCalculator.calculateInterest(
        1000,
        0.05,
        365,
        "daily",
      );
      expect(result.interestAmount).toBeCloseTo(51.27, 2);
      expect(result.totalAmount).toBeCloseTo(1051.27, 2);
    });
    it("should calculate simple interest correctly", function () {
      var result =
        financial_calculator_1.FinancialCalculator.calculateSimpleInterest(
          1000,
          0.05,
          365,
        );
      expect(result.interestAmount).toBe(50.0);
      expect(result.totalAmount).toBe(1050.0);
    });
    it("should reject negative parameters", function () {
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateInterest(
          -1000,
          0.05,
          365,
        );
      }).toThrow("Principal cannot be negative");
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateInterest(
          1000,
          -0.05,
          365,
        );
      }).toThrow("Interest rate cannot be negative");
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateInterest(
          1000,
          0.05,
          -365,
        );
      }).toThrow("Period cannot be negative");
    });
  });
  describe("calculateBalanceSummary", function () {
    it("should calculate balance summary correctly", function () {
      var result =
        financial_calculator_1.FinancialCalculator.calculateBalanceSummary(
          1000,
          200,
          100,
          50,
        );
      expect(result).toEqual({
        accountBalance: 1000,
        availableBalance: 850, // 1000 - 200 - 50 + 100
        pendingDebits: 200,
        pendingCredits: 100,
        holdAmount: 50,
      });
    });
    it("should handle zero pending amounts", function () {
      var result =
        financial_calculator_1.FinancialCalculator.calculateBalanceSummary(
          1000,
        );
      expect(result.availableBalance).toBe(1000);
    });
  });
  describe("calculateTransactionFee", function () {
    it("should calculate fixed fee only", function () {
      var fee =
        financial_calculator_1.FinancialCalculator.calculateTransactionFee(
          100,
          {
            fixedFee: 2.5,
          },
        );
      expect(fee).toBe(2.5);
    });
    it("should calculate percentage fee only", function () {
      var fee =
        financial_calculator_1.FinancialCalculator.calculateTransactionFee(
          100,
          {
            percentageFee: 0.02,
          },
        );
      expect(fee).toBe(2.0);
    });
    it("should calculate combined fee", function () {
      var fee =
        financial_calculator_1.FinancialCalculator.calculateTransactionFee(
          100,
          {
            fixedFee: 1.0,
            percentageFee: 0.02,
          },
        );
      expect(fee).toBe(3.0);
    });
    it("should apply minimum fee", function () {
      var fee =
        financial_calculator_1.FinancialCalculator.calculateTransactionFee(10, {
          fixedFee: 0.5,
          percentageFee: 0.01,
          minFee: 2.0,
        });
      expect(fee).toBe(2.0); // 0.50 + 0.10 = 0.60, but min is 2.00
    });
    it("should apply maximum fee", function () {
      var fee =
        financial_calculator_1.FinancialCalculator.calculateTransactionFee(
          10000,
          {
            percentageFee: 0.05,
            maxFee: 25.0,
          },
        );
      expect(fee).toBe(25.0); // 500.00, but max is 25.00
    });
  });
  describe("calculateConversionWithSpread", function () {
    it("should calculate conversion with spread", function () {
      var result =
        financial_calculator_1.FinancialCalculator.calculateConversionWithSpread(
          100,
          1.2,
          0.02,
        );
      expect(result.buyRate).toBeCloseTo(1.188, 6);
      expect(result.sellRate).toBeCloseTo(1.212, 6);
      expect(result.convertedAmount).toBeCloseTo(121.2, 2);
    });
  });
  describe("calculateMonthlyPayment", function () {
    it("should calculate loan payment correctly", function () {
      var result =
        financial_calculator_1.FinancialCalculator.calculateMonthlyPayment(
          100000,
          0.05,
          360,
        );
      expect(result.monthlyPayment).toBeCloseTo(536.82, 2);
      expect(result.totalPayment).toBeCloseTo(193255.78, 2);
      expect(result.totalInterest).toBeCloseTo(93255.78, 2);
    });
    it("should handle zero interest loan", function () {
      var result =
        financial_calculator_1.FinancialCalculator.calculateMonthlyPayment(
          12000,
          0,
          12,
        );
      expect(result.monthlyPayment).toBe(1000.0);
      expect(result.totalPayment).toBe(12000.0);
      expect(result.totalInterest).toBe(0.0);
    });
    it("should reject invalid parameters", function () {
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateMonthlyPayment(
          -1000,
          0.05,
          360,
        );
      }).toThrow("Invalid loan parameters");
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateMonthlyPayment(
          1000,
          -0.05,
          360,
        );
      }).toThrow("Invalid loan parameters");
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateMonthlyPayment(
          1000,
          0.05,
          -12,
        );
      }).toThrow("Invalid loan parameters");
    });
  });
  describe("calculateAmortizationSchedule", function () {
    it("should generate amortization schedule", function () {
      var schedule =
        financial_calculator_1.FinancialCalculator.calculateAmortizationSchedule(
          1000,
          0.12,
          12,
        );
      expect(schedule).toHaveLength(12);
      // Check first payment
      var firstPayment = schedule[0];
      expect(firstPayment.month).toBe(1);
      expect(firstPayment.payment).toBeGreaterThan(0);
      expect(firstPayment.principal).toBeGreaterThan(0);
      expect(firstPayment.interest).toBeGreaterThan(0);
      expect(firstPayment.balance).toBeLessThan(1000);
      // Check last payment
      var lastPayment = schedule[11];
      expect(lastPayment.month).toBe(12);
      expect(lastPayment.balance).toBe(0);
    });
  });
  describe("calculateNPV", function () {
    it("should calculate NPV correctly", function () {
      var cashFlows = [-1000, 300, 300, 300, 300];
      var npv = financial_calculator_1.FinancialCalculator.calculateNPV(
        cashFlows,
        0.1,
      );
      expect(npv).toBeCloseTo(-49.04, 2);
    });
  });
  describe("calculateIRR", function () {
    it("should calculate IRR correctly", function () {
      var cashFlows = [-1000, 300, 300, 300, 300];
      var irr = financial_calculator_1.FinancialCalculator.calculateIRR(
        cashFlows,
        0.1,
      );
      expect(irr).toBeCloseTo(0.0771, 4);
    });
    it("should throw if IRR calculation fails to converge", function () {
      var cashFlows = [0]; // Single zero - won't converge
      expect(function () {
        return financial_calculator_1.FinancialCalculator.calculateIRR(
          cashFlows,
        );
      }).toThrow("IRR calculation failed to converge");
    });
  });
});
describe("FinancialCalculations", function () {
  describe("convertCurrency", function () {
    it("should be an alias to FinancialCalculator.convertCurrency", function () {
      var result = financial_calculator_1.FinancialCalculations.convertCurrency(
        100,
        "USD",
        "EUR",
        0.85,
      );
      expect(result).toBe(85.0);
    });
  });
  describe("calculateTotalWithFees", function () {
    it("should calculate total with fees", function () {
      var result =
        financial_calculator_1.FinancialCalculations.calculateTotalWithFees(
          100,
          {
            fixedFee: 2.5,
            percentageFee: 0.01,
          },
        );
      expect(result).toEqual({
        subtotal: 100,
        fee: 3.5,
        total: 103.5,
      });
    });
    it("should handle no fees", function () {
      var result =
        financial_calculator_1.FinancialCalculations.calculateTotalWithFees(
          100,
          {},
        );
      expect(result).toEqual({
        subtotal: 100,
        fee: 0,
        total: 100,
      });
    });
  });
  describe("calculateLoanDetails", function () {
    it("should provide complete loan details", function () {
      var result =
        financial_calculator_1.FinancialCalculations.calculateLoanDetails(
          100000,
          0.05,
          360,
        );
      expect(result).toHaveProperty("monthlyPayment");
      expect(result).toHaveProperty("totalPayment");
      expect(result).toHaveProperty("totalInterest");
      expect(result).toHaveProperty("schedule");
      expect(result.schedule).toHaveLength(360);
    });
  });
});

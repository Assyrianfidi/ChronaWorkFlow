import { 
  FinancialCalculator,
  FinancialCalculations
} from '../../business-logic/calculations/financial.calculator';

describe('Financial Calculator', () => {
  describe('convertCurrency', () => {
    it('should convert currency correctly', () => {
      const result = FinancialCalculator.convertCurrency(100, 'USD', 'EUR', 0.85);
      expect(result).toBe(85.00);
    });

    it('should round to correct precision', () => {
      const result = FinancialCalculator.convertCurrency(100, 'USD', 'JPY', 110.123);
      expect(result).toBe(11012); // JPY has 0 decimal places, rounds 11012.3 to 11012
    });

    it('should reject negative amounts', () => {
      expect(() => FinancialCalculator.convertCurrency(-100, 'USD', 'EUR', 0.85))
        .toThrow('Cannot convert negative amounts');
    });

    it('should reject zero or negative exchange rate', () => {
      expect(() => FinancialCalculator.convertCurrency(100, 'USD', 'EUR', 0))
        .toThrow('Exchange rate must be positive');
      
      expect(() => FinancialCalculator.convertCurrency(100, 'USD', 'EUR', -0.5))
        .toThrow('Exchange rate must be positive');
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', () => {
      const result = FinancialCalculator.calculateTax(100, 0.08);
      expect(result).toEqual({
        amount: 100,
        taxRate: 0.08,
        taxAmount: 8.00,
        totalAmount: 108.00,
        taxType: 'STANDARD'
      });
    });

    it('should handle zero tax rate', () => {
      const result = FinancialCalculator.calculateTax(100, 0);
      expect(result).toEqual({
        amount: 100,
        taxRate: 0,
        taxAmount: 0.00,
        totalAmount: 100.00,
        taxType: 'STANDARD'
      });
    });

    it('should reject negative amounts', () => {
      expect(() => FinancialCalculator.calculateTax(-100, 0.08))
        .toThrow('Cannot calculate tax on negative amount');
    });

    it('should reject tax rate outside 0-1 range', () => {
      expect(() => FinancialCalculator.calculateTax(100, -0.1))
        .toThrow('Tax rate must be between 0 and 1 (0-100%)');
      
      expect(() => FinancialCalculator.calculateTax(100, 1.5))
        .toThrow('Tax rate must be between 0 and 1 (0-100%)');
    });
  });

  describe('calculateInterest', () => {
    it('should calculate compound interest correctly', () => {
      const result = FinancialCalculator.calculateInterest(1000, 0.05, 365, 'daily');
      expect(result.interestAmount).toBeCloseTo(51.27, 2);
      expect(result.totalAmount).toBeCloseTo(1051.27, 2);
    });

    it('should calculate simple interest correctly', () => {
      const result = FinancialCalculator.calculateSimpleInterest(1000, 0.05, 365);
      expect(result.interestAmount).toBe(50.00);
      expect(result.totalAmount).toBe(1050.00);
    });

    it('should reject negative parameters', () => {
      expect(() => FinancialCalculator.calculateInterest(-1000, 0.05, 365))
        .toThrow('Principal cannot be negative');
      
      expect(() => FinancialCalculator.calculateInterest(1000, -0.05, 365))
        .toThrow('Interest rate cannot be negative');
      
      expect(() => FinancialCalculator.calculateInterest(1000, 0.05, -365))
        .toThrow('Period cannot be negative');
    });
  });

  describe('calculateBalanceSummary', () => {
    it('should calculate balance summary correctly', () => {
      const result = FinancialCalculator.calculateBalanceSummary(1000, 200, 100, 50);
      expect(result).toEqual({
        accountBalance: 1000,
        availableBalance: 850, // 1000 - 200 - 50 + 100
        pendingDebits: 200,
        pendingCredits: 100,
        holdAmount: 50
      });
    });

    it('should handle zero pending amounts', () => {
      const result = FinancialCalculator.calculateBalanceSummary(1000);
      expect(result.availableBalance).toBe(1000);
    });
  });

  describe('calculateTransactionFee', () => {
    it('should calculate fixed fee only', () => {
      const fee = FinancialCalculator.calculateTransactionFee(100, {
        fixedFee: 2.50
      });
      expect(fee).toBe(2.50);
    });

    it('should calculate percentage fee only', () => {
      const fee = FinancialCalculator.calculateTransactionFee(100, {
        percentageFee: 0.02
      });
      expect(fee).toBe(2.00);
    });

    it('should calculate combined fee', () => {
      const fee = FinancialCalculator.calculateTransactionFee(100, {
        fixedFee: 1.00,
        percentageFee: 0.02
      });
      expect(fee).toBe(3.00);
    });

    it('should apply minimum fee', () => {
      const fee = FinancialCalculator.calculateTransactionFee(10, {
        fixedFee: 0.50,
        percentageFee: 0.01,
        minFee: 2.00
      });
      expect(fee).toBe(2.00); // 0.50 + 0.10 = 0.60, but min is 2.00
    });

    it('should apply maximum fee', () => {
      const fee = FinancialCalculator.calculateTransactionFee(10000, {
        percentageFee: 0.05,
        maxFee: 25.00
      });
      expect(fee).toBe(25.00); // 500.00, but max is 25.00
    });
  });

  describe('calculateConversionWithSpread', () => {
    it('should calculate conversion with spread', () => {
      const result = FinancialCalculator.calculateConversionWithSpread(100, 1.2, 0.02);
      expect(result.buyRate).toBeCloseTo(1.188, 6);
      expect(result.sellRate).toBeCloseTo(1.212, 6);
      expect(result.convertedAmount).toBeCloseTo(121.20, 2);
    });
  });

  describe('calculateMonthlyPayment', () => {
    it('should calculate loan payment correctly', () => {
      const result = FinancialCalculator.calculateMonthlyPayment(100000, 0.05, 360);
      expect(result.monthlyPayment).toBeCloseTo(536.82, 2);
      expect(result.totalPayment).toBeCloseTo(193255.78, 2);
      expect(result.totalInterest).toBeCloseTo(93255.78, 2);
    });

    it('should handle zero interest loan', () => {
      const result = FinancialCalculator.calculateMonthlyPayment(12000, 0, 12);
      expect(result.monthlyPayment).toBe(1000.00);
      expect(result.totalPayment).toBe(12000.00);
      expect(result.totalInterest).toBe(0.00);
    });

    it('should reject invalid parameters', () => {
      expect(() => FinancialCalculator.calculateMonthlyPayment(-1000, 0.05, 360))
        .toThrow('Invalid loan parameters');
      
      expect(() => FinancialCalculator.calculateMonthlyPayment(1000, -0.05, 360))
        .toThrow('Invalid loan parameters');
      
      expect(() => FinancialCalculator.calculateMonthlyPayment(1000, 0.05, -12))
        .toThrow('Invalid loan parameters');
    });
  });

  describe('calculateAmortizationSchedule', () => {
    it('should generate amortization schedule', () => {
      const schedule = FinancialCalculator.calculateAmortizationSchedule(1000, 0.12, 12);
      expect(schedule).toHaveLength(12);
      
      // Check first payment
      const firstPayment = schedule[0];
      expect(firstPayment.month).toBe(1);
      expect(firstPayment.payment).toBeGreaterThan(0);
      expect(firstPayment.principal).toBeGreaterThan(0);
      expect(firstPayment.interest).toBeGreaterThan(0);
      expect(firstPayment.balance).toBeLessThan(1000);
      
      // Check last payment
      const lastPayment = schedule[11];
      expect(lastPayment.month).toBe(12);
      expect(lastPayment.balance).toBe(0);
    });
  });

  describe('calculateNPV', () => {
    it('should calculate NPV correctly', () => {
      const cashFlows = [-1000, 300, 300, 300, 300];
      const npv = FinancialCalculator.calculateNPV(cashFlows, 0.1);
      expect(npv).toBeCloseTo(-49.04, 2);
    });
  });

  describe('calculateIRR', () => {
    it('should calculate IRR correctly', () => {
      const cashFlows = [-1000, 300, 300, 300, 300];
      const irr = FinancialCalculator.calculateIRR(cashFlows, 0.1);
      expect(irr).toBeCloseTo(0.0771, 4);
    });

    it('should throw if IRR calculation fails to converge', () => {
      const cashFlows = [0]; // Single zero - won't converge
      expect(() => FinancialCalculator.calculateIRR(cashFlows))
        .toThrow('IRR calculation failed to converge');
    });
  });
});

describe('FinancialCalculations', () => {
  describe('convertCurrency', () => {
    it('should be an alias to FinancialCalculator.convertCurrency', () => {
      const result = FinancialCalculations.convertCurrency(100, 'USD', 'EUR', 0.85);
      expect(result).toBe(85.00);
    });
  });

  describe('calculateTotalWithFees', () => {
    it('should calculate total with fees', () => {
      const result = FinancialCalculations.calculateTotalWithFees(100, {
        fixedFee: 2.50,
        percentageFee: 0.01
      });
      
      expect(result).toEqual({
        subtotal: 100,
        fee: 3.50,
        total: 103.50
      });
    });

    it('should handle no fees', () => {
      const result = FinancialCalculations.calculateTotalWithFees(100, {});
      
      expect(result).toEqual({
        subtotal: 100,
        fee: 0,
        total: 100
      });
    });
  });

  describe('calculateLoanDetails', () => {
    it('should provide complete loan details', () => {
      const result = FinancialCalculations.calculateLoanDetails(100000, 0.05, 360);
      
      expect(result).toHaveProperty('monthlyPayment');
      expect(result).toHaveProperty('totalPayment');
      expect(result).toHaveProperty('totalInterest');
      expect(result).toHaveProperty('schedule');
      expect(result.schedule).toHaveLength(360);
    });
  });
});

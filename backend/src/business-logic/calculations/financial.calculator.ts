/**
 * Financial Calculator - Placeholder Implementation
 * TODO: Implement full financial calculations
 */

export class FinancialCalculator {
  static convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate: number = 1,
  ): number {
    if (amount < 0) {
      throw new Error('Cannot convert negative amounts');
    }
    if (exchangeRate <= 0) {
      throw new Error('Exchange rate must be positive');
    }

    if (fromCurrency === toCurrency) {
      return this.roundToPrecision(amount, this.getCurrencyPrecision(toCurrency));
    }

    const converted = amount * exchangeRate;
    return this.roundToPrecision(converted, this.getCurrencyPrecision(toCurrency));
  }

  static calculateTax(
    amount: number,
    taxRate: number,
    taxType: 'STANDARD' | 'REDUCED' | 'ZERO' = 'STANDARD',
  ) {
    if (amount < 0) {
      throw new Error('Cannot calculate tax on negative amount');
    }
    if (taxRate < 0 || taxRate > 1) {
      throw new Error('Tax rate must be between 0 and 1 (0-100%)');
    }

    const taxAmount = this.roundToPrecision(amount * taxRate, 2);
    const totalAmount = this.roundToPrecision(amount + taxAmount, 2);

    return {
      amount,
      taxRate,
      taxAmount,
      totalAmount,
      taxType,
    };
  }

  static calculateSimpleInterest(principal: number, annualRate: number, days: number) {
    if (principal < 0) {
      throw new Error('Principal cannot be negative');
    }
    if (annualRate < 0) {
      throw new Error('Interest rate cannot be negative');
    }
    if (days < 0) {
      throw new Error('Period cannot be negative');
    }

    const years = days / 365;
    const interestAmount = this.roundToPrecision(principal * annualRate * years, 2);
    const totalAmount = this.roundToPrecision(principal + interestAmount, 2);

    return {
      principal,
      rate: annualRate,
      period: days,
      interestAmount,
      totalAmount,
    };
  }

  static calculateInterest(
    principal: number,
    annualRate: number,
    days: number,
    frequency: 'daily' | 'monthly' | 'yearly' = 'yearly',
  ) {
    if (principal < 0) {
      throw new Error('Principal cannot be negative');
    }
    if (annualRate < 0) {
      throw new Error('Interest rate cannot be negative');
    }
    if (days < 0) {
      throw new Error('Period cannot be negative');
    }

    const years = days / 365;
    const compoundsPerYear =
      frequency === 'daily' ? 365 : frequency === 'monthly' ? 12 : 1;

    const total = principal * Math.pow(1 + annualRate / compoundsPerYear, compoundsPerYear * years);
    const interestAmount = this.roundToPrecision(total - principal, 2);
    const totalAmount = this.roundToPrecision(total, 2);

    return {
      principal,
      rate: annualRate,
      period: days,
      frequency,
      interestAmount,
      totalAmount,
    };
  }

  static calculateBalanceSummary(
    accountBalance: number,
    pendingDebits: number = 0,
    pendingCredits: number = 0,
    holdAmount: number = 0,
  ) {
    const availableBalance =
      accountBalance - pendingDebits - holdAmount + pendingCredits;

    return {
      accountBalance,
      availableBalance,
      pendingDebits,
      pendingCredits,
      holdAmount,
    };
  }

  static calculateTransactionFee(
    amount: number,
    feeStructure: {
      fixedFee?: number;
      percentageFee?: number;
      minFee?: number;
      maxFee?: number;
    },
  ): number {
    let fee = 0;

    if (feeStructure.fixedFee) {
      fee += feeStructure.fixedFee;
    }
    if (feeStructure.percentageFee) {
      fee += amount * feeStructure.percentageFee;
    }

    if (feeStructure.minFee && fee < feeStructure.minFee) {
      fee = feeStructure.minFee;
    }
    if (feeStructure.maxFee && fee > feeStructure.maxFee) {
      fee = feeStructure.maxFee;
    }

    return this.roundToPrecision(fee, 2);
  }

  static calculateConversionWithSpread(
    amount: number,
    baseRate: number,
    spreadPercentage: number = 0.01,
  ): { buyRate: number; sellRate: number; convertedAmount: number } {
    const buyRate = baseRate * (1 - spreadPercentage / 2);
    const sellRate = baseRate * (1 + spreadPercentage / 2);
    const convertedAmount = amount * sellRate;

    return {
      buyRate: this.roundToPrecision(buyRate, 6),
      sellRate: this.roundToPrecision(sellRate, 6),
      convertedAmount: this.roundToPrecision(convertedAmount, 2),
    };
  }

  static calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    months: number,
  ): { monthlyPayment: number; totalPayment: number; totalInterest: number } {
    if (principal <= 0 || annualRate < 0 || months <= 0) {
      throw new Error('Invalid loan parameters');
    }

    const monthlyRate = annualRate / 12;
    let monthlyPayment: number;

    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment =
        (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - principal;

    return {
      monthlyPayment: this.roundToPrecision(monthlyPayment, 2),
      totalPayment: this.roundToPrecision(totalPayment, 2),
      totalInterest: this.roundToPrecision(totalInterest, 2),
    };
  }

  static calculateAmortizationSchedule(
    principal: number,
    annualRate: number,
    months: number,
  ) {
    const { monthlyPayment } = this.calculateMonthlyPayment(
      principal,
      annualRate,
      months,
    );

    const monthlyRate = annualRate / 12;
    let balance = principal;
    const schedule: Array<{
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }> = [];

    for (let month = 1; month <= months; month++) {
      const interestPayment = this.roundToPrecision(balance * monthlyRate, 2);
      const principalPayment = this.roundToPrecision(
        monthlyPayment - interestPayment,
        2,
      );
      balance = this.roundToPrecision(balance - principalPayment, 2);

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    if (schedule.length > 0) {
      schedule[schedule.length - 1].balance = 0;
    }

    return schedule;
  }

  static calculateNPV(cashFlows: number[], discountRate: number): number {
    let npv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + discountRate, i);
    }
    return this.roundToPrecision(npv, 2);
  }

  static calculateIRR(cashFlows: number[], guess: number = 0.1): number {
    const maxIterations = 100;
    const tolerance = 1e-6;

    if (cashFlows.length === 0 || cashFlows.every((cf) => cf === 0)) {
      throw new Error('IRR calculation failed to converge');
    }

    let rate = guess;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let j = 0; j < cashFlows.length; j++) {
        npv += cashFlows[j] / Math.pow(1 + rate, j);
        dnpv += (-j * cashFlows[j]) / Math.pow(1 + rate, j + 1);
      }

      if (Math.abs(npv) < tolerance) {
        return this.roundToPrecision(rate, 6);
      }

      if (Math.abs(dnpv) < tolerance) {
        break;
      }

      rate = rate - npv / dnpv;
    }

    throw new Error('IRR calculation failed to converge');
  }

  private static roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  private static getCurrencyPrecision(currency: string): number {
    const precisions: Record<string, number> = {
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

    return Object.prototype.hasOwnProperty.call(precisions, currency)
      ? precisions[currency]
      : 2;
  }
}

export const FinancialCalculations = {
  convertCurrency: (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRate: number,
  ) =>
    FinancialCalculator.convertCurrency(
      amount,
      fromCurrency,
      toCurrency,
      exchangeRate,
    ),

  calculateTotalWithFees: (
    amount: number,
    feeStructure: {
      fixedFee?: number;
      percentageFee?: number;
      minFee?: number;
      maxFee?: number;
    },
  ) => {
    const fee = FinancialCalculator.calculateTransactionFee(amount, feeStructure);
    return {
      subtotal: amount,
      fee,
      total: amount + fee,
    };
  },

  calculateLoanDetails: (principal: number, annualRate: number, months: number) => {
    const paymentDetails = FinancialCalculator.calculateMonthlyPayment(
      principal,
      annualRate,
      months,
    );
    const schedule = FinancialCalculator.calculateAmortizationSchedule(
      principal,
      annualRate,
      months,
    );

    return {
      ...paymentDetails,
      schedule,
    };
  },
};

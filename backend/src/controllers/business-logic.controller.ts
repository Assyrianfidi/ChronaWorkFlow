import { Request, Response, NextFunction } from "express";
import { businessLogicService } from "../business-logic/business.logic.service.js";
import { logger } from "../utils/logger.js";
import { ApiError, ErrorCodes } from "../utils/errorHandler.js";
import { Role } from "@prisma/client";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: Role;
      };
    }
  }
}

/**
 * Business Logic Controller
 * Handles all business logic operations
 */

export const processTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id.toString();
    const {
      fromAccountId,
      toAccountId,
      amount,
      currency,
      description,
      reference,
      metadata,
    } = req.body;

    // Get request context for fraud detection
    const context = {
      // ipAddress moved to metadata
      device: req.headers["user-agent"],
      location: req.headers["x-location"] as string,
      merchantCategory: metadata?.merchantCategory,
    };

    const result = await businessLogicService.processTransaction(
      {
        fromAccountId,
        toAccountId,
        amount,
        currency,
        description,
        reference,
        metadata,
      },
      userId,
      context,
    );

    logger.info("Transaction processed", {
      event: "TRANSACTION_PROCESSED",
      userId,
      transactionId: result.transactionId,
      success: result.success,
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result,
        message: "Transaction processed successfully",
        warnings: result.warnings,
        fraudAlerts: result.fraudAlerts,
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: "TRANSACTION_FAILED",
          message: result.error || "Transaction processing failed",
        },
      });
    }
  } catch (error: any) {
    logger.error("Transaction processing failed", {
      event: "TRANSACTION_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const getAccountSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id.toString();
    const { accountId } = req.params;

    const summary = await businessLogicService.getAccountSummary(
      accountId,
      userId,
    );

    logger.info("Account summary retrieved", {
      event: "ACCOUNT_SUMMARY_RETRIEVED",
      userId,
      accountId,
      balance: summary.balance,
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error("Account summary retrieval failed", {
      event: "ACCOUNT_SUMMARY_ERROR",
      userId: req.user?.id,
      accountId: req.params.accountId,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const calculateLoanDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { principal, annualRate, months } = req.body;

    const loanDetails = await businessLogicService.calculateLoanDetails(
      principal,
      annualRate,
      months,
    );

    logger.info("Loan details calculated", {
      event: "LOAN_DETAILS_CALCULATED",
      userId: req.user?.id,
      principal,
      annualRate,
      months,
    });

    res.json({
      success: true,
      data: loanDetails,
    });
  } catch (error: any) {
    logger.error("Loan calculation failed", {
      event: "LOAN_CALCULATION_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const convertCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    const conversion = await businessLogicService.convertCurrency(
      amount,
      fromCurrency,
      toCurrency,
    );

    logger.info("Currency converted", {
      event: "CURRENCY_CONVERTED",
      userId: req.user?.id,
      amount,
      fromCurrency,
      toCurrency,
      convertedAmount: conversion.convertedAmount,
    });

    res.json({
      success: true,
      data: conversion,
    });
  } catch (error: any) {
    logger.error("Currency conversion failed", {
      event: "CURRENCY_CONVERSION_ERROR",
      userId: req.user?.id,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const getTransactionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.id.toString();
    const { accountId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const history = await businessLogicService.getTransactionHistory(
      userId,
      accountId,
      Number(limit),
      Number(offset),
    );

    logger.info("Transaction history retrieved", {
      event: "TRANSACTION_HISTORY_RETRIEVED",
      userId,
      accountId,
      limit,
      offset,
      count: history.length,
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    logger.error("Transaction history retrieval failed", {
      event: "TRANSACTION_HISTORY_ERROR",
      userId: req.user?.id,
      accountId: req.params.accountId,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const healthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const health = await businessLogicService.healthCheck();

    res.json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    logger.error("Business logic health check failed", {
      event: "BUSINESS_LOGIC_HEALTH_CHECK_ERROR",
      error: (error as Error).message,
    });
    next(error);
  }
};

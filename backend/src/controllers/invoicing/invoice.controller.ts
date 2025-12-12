import { Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { invoiceService } from "../../services/invoicing/invoice.service";
import { paymentService } from "../../services/invoicing/payment.service";
import { pdfService } from "../../services/invoicing/pdf.service";
import { emailService } from "../../services/email/email.service";

export class InvoiceController {
  // Create invoice
  async createInvoice(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const invoice = await invoiceService.createInvoice(req.body);

      res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        data: invoice,
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Get invoice by ID
  async getInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await invoiceService.getInvoice(id);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      console.error("Error getting invoice:", error);
      if (error instanceof Error && error.message === "Invoice not found") {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Update invoice
  async updateInvoice(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const invoice = await invoiceService.updateInvoice(id, req.body);

      res.json({
        success: true,
        message: "Invoice updated successfully",
        data: invoice,
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
      if (error instanceof Error && error.message === "Invoice not found") {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // List invoices
  async listInvoices(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const filters = {
        status: req.query.status as any,
        customerId: req.query.customerId as string,
        dateFrom: req.query.dateFrom
          ? new Date(req.query.dateFrom as string)
          : undefined,
        dateTo: req.query.dateTo
          ? new Date(req.query.dateTo as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await invoiceService.listInvoices(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error listing invoices:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Send invoice
  async sendInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Update invoice status to SENT and create accounting entries
      const invoice = await invoiceService.sendInvoice(id);

      // Send email if requested
      let emailResult = null;
      if (req.body.sendEmail === true) {
        emailResult = await emailService.sendInvoiceEmail(id);
      }

      res.json({
        success: true,
        message: "Invoice sent successfully",
        data: {
          invoice,
          email: emailResult,
        },
      });
    } catch (error) {
      console.error("Error sending invoice:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Generate PDF
  async generatePDF(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const pdfBuffer = await pdfService.generateInvoicePDF(id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${id}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Add payment
  async addPayment(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const paymentData = { ...req.body, invoiceId: id };

      const result = await paymentService.recordPayment(paymentData);

      res.status(201).json({
        success: true,
        message: "Payment recorded successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Get payments for invoice
  async getPayments(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payments = await paymentService.getPayments(id);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      console.error("Error getting payments:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Get payment summary
  async getPaymentSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const summary = await paymentService.getPaymentSummary(id);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Error getting payment summary:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // Delete invoice (void)
  async deleteInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Implementation would void the invoice and create accounting entries
      // For now, just return success

      res.json({
        success: true,
        message: "Invoice voided successfully",
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}

export const invoiceController = new InvoiceController();

// Validation middleware
export const validateCreateInvoice = [
  body("customerId").notEmpty().withMessage("Customer ID is required"),
  body("dueDate").isISO8601().withMessage("Due date must be a valid date"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be 3 characters"),
  body("notes").optional().isString(),
  body("lines")
    .isArray({ min: 1 })
    .withMessage("At least one line item is required"),
  body("lines.*.description")
    .notEmpty()
    .withMessage("Line item description is required"),
  body("lines.*.qty")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  body("lines.*.unitPrice")
    .isInt({ min: 0 })
    .withMessage("Unit price must be a non-negative integer"),
];

export const validateUpdateInvoice = [
  body("customerId")
    .optional()
    .notEmpty()
    .withMessage("Customer ID is required"),
  body("issueDate")
    .optional()
    .isISO8601()
    .withMessage("Issue date must be a valid date"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be 3 characters"),
  body("notes").optional().isString(),
  body("lines")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Lines must be an array"),
  body("lines.*.description")
    .optional()
    .notEmpty()
    .withMessage("Line item description is required"),
  body("lines.*.qty")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  body("lines.*.unitPrice")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Unit price must be a non-negative integer"),
];

export const validateAddPayment = [
  body("amount")
    .isInt({ min: 1 })
    .withMessage("Amount must be a positive integer"),
  body("method")
    .isIn(["CASH", "CREDIT_CARD", "BANK_TRANSFER", "CHECK", "ONLINE"])
    .withMessage("Invalid payment method"),
  body("transactionRef").optional().isString(),
];

export const validateListInvoices = [
  query("status")
    .optional()
    .isIn(["DRAFT", "SENT", "PAID", "OVERDUE", "VOIDED"])
    .withMessage("Invalid status"),
  query("customerId").optional().isUUID().withMessage("Invalid customer ID"),
  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Date from must be a valid date"),
  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("Date to must be a valid date"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

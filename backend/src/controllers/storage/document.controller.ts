import { Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { documentService } from "../../services/storage/document.service";
import { logger } from "../../utils/logger.js";

// Extend Request interface to include file
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
  file?: Express.Multer.File;
}

export class DocumentController {
  // Upload document
  async uploadDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const { category, description } = req.body;
      const userId = req.user.id;

      const result = await documentService.uploadDocument(req.file.buffer, {
        userId: userId.toString(),
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category: category || "other",
        description,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error uploading document:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to upload document",
      });
    }
  }

  // Download document
  async downloadDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { documentId } = req.params;
      const userId = req.user.id;

      const { file, mimeType, fileName } =
        await documentService.downloadDocument(documentId, userId.toString());

      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      res.send(file);
    } catch (error) {
      logger.error("Error downloading document:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to download document",
      });
    }
  }

  // List documents
  async listDocuments(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { category, page = "1", limit = "20" } = req.query;
      const userId = (req as any).user.id;

      const result = await documentService.listDocuments(
        userId.toString(),
        category as string,
        parseInt(page as string),
        parseInt(limit as string),
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error listing documents:", error);
      res.status(500).json({
        success: false,
        message: "Failed to list documents",
      });
    }
  }

  // Delete document
  async deleteDocument(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { documentId } = req.params;
      const userId = (req as any).user.id;

      await documentService.deleteDocument(documentId, userId.toString());

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting document:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete document",
      });
    }
  }

  // Update document
  async updateDocument(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { documentId } = req.params;
      const { fileName, description, category } = req.body;
      const userId = (req as any).user.id;

      await documentService.updateDocument(documentId, userId.toString(), {
        fileName,
        description,
        category,
      });

      res.json({
        success: true,
        message: "Document updated successfully",
      });
    } catch (error) {
      logger.error("Error updating document:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update document",
      });
    }
  }

  // Get document statistics
  async getDocumentStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const stats = await documentService.getDocumentStats(userId.toString());

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting document stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get document statistics",
      });
    }
  }
}

export const documentController = new DocumentController();

// Validation middleware
export const validateUploadDocument = [
  body("category")
    .optional()
    .isIn(["invoice", "receipt", "contract", "other"])
    .withMessage("Invalid category"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];

export const validateUpdateDocument = [
  body("fileName")
    .optional()
    .isString()
    .withMessage("File name must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("category")
    .optional()
    .isIn(["invoice", "receipt", "contract", "other"])
    .withMessage("Invalid category"),
];

export const validateListDocuments = [
  query("category")
    .optional()
    .isIn(["INVOICE", "RECEIPT", "CONTRACT", "OTHER"])
    .withMessage("Invalid category"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

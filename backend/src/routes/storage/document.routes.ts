import { Router } from "express";
import multer from "multer";
import {
  documentController,
  validateUploadDocument,
  validateUpdateDocument,
  validateListDocuments,
} from "../../controllers/storage/document.controller";
import { auth } from "../../middleware/auth";

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// POST /api/documents/upload - Upload document
router.post(
  "/upload",
  upload.single("file"),
  validateUploadDocument,
  documentController.uploadDocument.bind(documentController),
);

// GET /api/documents - List documents
router.get(
  "/",
  validateListDocuments,
  documentController.listDocuments.bind(documentController),
);

// GET /api/documents/stats - Get document statistics
router.get(
  "/stats",
  documentController.getDocumentStats.bind(documentController),
);

// GET /api/documents/:documentId/download - Download document
router.get(
  "/:documentId/download",
  documentController.downloadDocument.bind(documentController),
);

// PUT /api/documents/:documentId - Update document
router.put(
  "/:documentId",
  validateUpdateDocument,
  documentController.updateDocument.bind(documentController),
);

// DELETE /api/documents/:documentId - Delete document
router.delete(
  "/:documentId",
  documentController.deleteDocument.bind(documentController),
);

export default router;

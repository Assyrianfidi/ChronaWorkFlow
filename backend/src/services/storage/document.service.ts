import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

const prisma = new PrismaClient();

export interface DocumentData {
  userId: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: 'invoice' | 'receipt' | 'contract' | 'other';
  description?: string;
}

export class DocumentService {
  private uploadDir: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private allowedMimeTypes: string[] = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'documents'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'invoices'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'receipts'), { recursive: true });
    }
  }

  // Upload document
  async uploadDocument(
    file: Buffer,
    metadata: DocumentData
  ): Promise<{ id: string; url: string }> {
    try {
      // Validate file size
      if (metadata.size > this.maxFileSize) {
        throw new Error('File size exceeds maximum limit of 10MB');
      }

      // Validate MIME type
      if (!this.allowedMimeTypes.includes(metadata.mimeType)) {
        throw new Error('File type not allowed');
      }

      // Generate unique filename
      const fileExtension = path.extname(metadata.fileName);
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      
      // Determine upload path based on category
      const categoryDir = metadata.category === 'invoice' ? 'invoices' : 
                         metadata.category === 'receipt' ? 'receipts' : 'documents';
      const uploadPath = path.join(this.uploadDir, categoryDir, uniqueFileName);

      // Save file to disk
      await fs.writeFile(uploadPath, file);

      // Map category to enum values
      const categoryMap: Record<string, 'INVOICE' | 'RECEIPT' | 'CONTRACT' | 'OTHER'> = {
        'invoice': 'INVOICE',
        'receipt': 'RECEIPT', 
        'contract': 'CONTRACT',
        'other': 'OTHER'
      };

      // Save document record to database
      const document = await prisma.document.create({
        data: {
          userId: parseInt(metadata.userId),
          fileName: metadata.fileName,
          originalName: metadata.fileName,
          mimeType: metadata.mimeType,
          size: metadata.size,
          category: categoryMap[metadata.category] || 'OTHER',
          filePath: uploadPath,
          description: metadata.description,
        },
      });

      logger.info(`Document uploaded: ${document.id} by user ${metadata.userId}`);
      
      return {
        id: document.id,
        url: `/api/documents/${document.id}/download`,
      };
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw error;
    }
  }

  // Download document
  async downloadDocument(documentId: string, userId: string): Promise<{
    file: Buffer;
    mimeType: string;
    fileName: string;
  }> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId: parseInt(userId),
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const file = await fs.readFile(document.filePath);

      return {
        file,
        mimeType: document.mimeType,
        fileName: document.originalName,
      };
    } catch (error) {
      logger.error('Error downloading document:', error);
      throw error;
    }
  }

  // List documents for user
  async listDocuments(
    userId: string,
    category?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    documents: Array<{
      id: string;
      fileName: string;
      mimeType: string;
      size: number;
      category: string;
      createdAt: Date;
      description?: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const whereClause: any = { userId: parseInt(userId) };
      
      if (category) {
        whereClause.category = category.toUpperCase();
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: whereClause,
          select: {
            id: true,
            fileName: true,
            originalName: true,
            mimeType: true,
            size: true,
            category: true,
            createdAt: true,
            description: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.document.count({ where: whereClause }),
      ]);

      return {
        documents: documents.map((doc: any) => ({
          ...doc,
          fileName: doc.originalName,
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error listing documents:', error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId: parseInt(userId),
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete file from disk
      await fs.unlink(document.filePath);

      // Delete database record
      await prisma.document.delete({
        where: { id: documentId },
      });

      logger.info(`Document deleted: ${documentId} by user ${userId}`);
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  // Update document metadata
  async updateDocument(
    documentId: string,
    userId: string,
    updates: {
      fileName?: string;
      description?: string;
      category?: string;
    }
  ): Promise<void> {
    try {
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId: parseInt(userId),
        },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      const updateData: any = {};
      
      if (updates.fileName) {
        updateData.originalName = updates.fileName;
      }
      
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }
      
      if (updates.category) {
        updateData.category = updates.category.toUpperCase();
        
        // Move file to new category directory if needed
        const newCategoryDir = updates.category === 'invoice' ? 'invoices' : 
                              updates.category === 'receipt' ? 'receipts' : 'documents';
        const newPath = path.join(this.uploadDir, newCategoryDir, path.basename(document.filePath));
        
        await fs.rename(document.filePath, newPath);
        updateData.filePath = newPath;
      }

      await prisma.document.update({
        where: { id: documentId },
        data: updateData,
      });

      logger.info(`Document updated: ${documentId} by user ${userId}`);
    } catch (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
  }

  // Get document statistics
  async getDocumentStats(userId: string): Promise<{
    totalDocuments: number;
    totalSize: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const stats = await prisma.document.groupBy({
        by: ['category'],
        where: { userId: parseInt(userId) },
        _count: { id: true },
        _sum: { size: true },
      });

      const totalDocuments = stats.reduce((sum: number, stat: any) => sum + stat._count.id, 0);
      const totalSize = stats.reduce((sum: number, stat: any) => sum + (stat._sum.size || 0), 0);
      
      const byCategory = stats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.category] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalDocuments,
        totalSize,
        byCategory,
      };
    } catch (error) {
      logger.error('Error getting document stats:', error);
      throw error;
    }
  }
}

export const documentService = new DocumentService();

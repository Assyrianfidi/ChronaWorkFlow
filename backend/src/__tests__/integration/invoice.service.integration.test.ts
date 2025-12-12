import { InvoiceService } from "../../services/invoice.service";
import { prisma } from "../../utils/prisma";
import { ApiError } from "../../utils/errors";
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { PrismaClient, Invoice, InvoiceItem } from "@prisma/client";

// Mock data
const mockInvoice: Invoice = {
  id: "1",
  customerId: "cust-123",
  issueDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  status: "DRAFT",
  subtotal: 1000,
  tax: 200,
  total: 1200,
  notes: "Test invoice",
  companyId: "company-123",
  invoiceNumber: "INV-001",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockInvoiceItems: InvoiceItem[] = [
  {
    id: "item-1",
    invoiceId: "1",
    description: "Test Item 1",
    quantity: 2,
    unitPrice: 500,
    amount: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Create a mock Prisma client with proper typing
const mockPrisma = {
  $transaction: jest.fn(),
  invoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  invoiceItem: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock the Prisma client
jest.mock("../../utils/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock the generateInvoiceNumber method
const mockGenerateInvoiceNumber = jest.fn().mockResolvedValue("INV-001");

// Create a partial mock of the InvoiceService class
jest.mock("../../services/invoice.service", () => ({
  InvoiceService: jest.fn().mockImplementation(() => {
    return {
      ...jest.requireActual("../../services/invoice.service")
        .InvoiceService.prototype,
      generateInvoiceNumber: mockGenerateInvoiceNumber,
    };
  }),
}));
        generateInvoiceNumber: mockGenerateInvoiceNumber,
      };
    }),
  };
});

describe("InvoiceService Integration Tests", () => {
  let invoiceService: InvoiceService;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a new instance of the service for each test
    invoiceService = new InvoiceService();

    // Set up default mock implementations
    const mockTransaction = {
      invoice: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      invoiceItem: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockTransaction);
    });
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe("createInvoice", () => {
    it("should create a new invoice with items", async () => {
      try {
        // Setup mocks
        mockPrisma.invoice.create.mockResolvedValue(mockInvoice);
        mockPrisma.invoiceItem.createMany.mockResolvedValue({ count: 1 });
        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockInvoiceItems);

        // Mock the generateInvoiceNumber method
        const generateInvoiceNumberSpy = jest
          .spyOn(InvoiceService.prototype as any, "generateInvoiceNumber")
          .mockResolvedValue("INV-001");

        const invoiceData = {
          customerId: "cust-123",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "DRAFT" as const,
          subtotal: 1000,
          tax: 200,
          total: 1200,
          notes: "Test invoice",
          companyId: "company-123",
          items: [
            {
              description: "Test Item 1",
              quantity: 2,
              unitPrice: 500,
              amount: 1000,
            },
          ],
        };

        const result = await invoiceService.createInvoice(invoiceData);

        // Verify generateInvoiceNumber was called with the correct companyId
        expect(generateInvoiceNumberSpy).toHaveBeenCalledWith("company-123");

        // Verify transaction was called
        expect(mockPrisma.$transaction).toHaveBeenCalled();

        // Verify invoice was created with correct data (excluding items)
        const { items, ...invoiceDataWithoutItems } = invoiceData;
        expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
          data: {
            ...invoiceDataWithoutItems,
            invoiceNumber: "INV-001",
          },
        });

        // Verify items were created
        expect(mockPrisma.invoiceItem.createMany).toHaveBeenCalledWith({
          data: [
            {
              description: "Test Item 1",
              quantity: 2,
              unitPrice: 500,
              amount: 1000,
              invoiceId: "1",
            },
          ],
        });

        // Verify the result
        expect(result).toEqual({
          ...mockInvoice,
          items: mockInvoiceItems,
        });

        // Verify findMany was called to get the created items
        expect(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith({
          where: { invoiceId: "1" },
        });
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });
  });

  describe("updateInvoice", () => {
    it("should update an existing invoice", async () => {
      try {
        const updatedInvoice = {
          ...mockInvoice,
          status: "SENT" as const,
          notes: "Updated test invoice",
          updatedAt: new Date(),
        };

        // Setup mocks
        mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
        mockPrisma.invoice.update.mockResolvedValue(updatedInvoice);
        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockInvoiceItems);

        const updateData = {
          status: "SENT" as const,
          notes: "Updated test invoice",
        };

        const result = await invoiceService.updateInvoice("1", updateData);

        // Verify the invoice was found using the transaction
        expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
          where: { id: "1" },
        });

        // Verify the update was called with correct data using the transaction
        expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
          where: { id: "1" },
          data: {
            ...updateData,
            updatedAt: expect.any(Date),
          },
        });

        // Verify items were fetched using the transaction
        expect(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith({
          where: { invoiceId: "1" },
        });

        // Verify the result
        expect(result).toEqual({
          ...updatedInvoice,
          items: mockInvoiceItems,
        });
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });

    it("should throw an error if invoice not found", async () => {
      try {
        // Setup mock
        mockPrisma.invoice.findUnique.mockResolvedValue(null);

        // Test and verify
        await expect(
          invoiceService.updateInvoice("nonexistent-id", { status: "SENT" }),
        ).rejects.toThrow(ApiError);

        // Verify the error details
        try {
          await invoiceService.updateInvoice("nonexistent-id", {
            status: "SENT",
          });
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).statusCode).toBe(404);
          expect((error as ApiError).message).toBe("Invoice not found");
        }
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });
  });

  describe("deleteInvoice", () => {
    it("should delete an invoice and its items", async () => {
      try {
        // Setup mocks
        mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
        mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 1 });
        mockPrisma.invoice.delete.mockResolvedValue(mockInvoice);

        await invoiceService.deleteInvoice("1");

        // Verify the invoice was found
        expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
          where: { id: "1" },
        });

        // Verify items were deleted
        expect(mockPrisma.invoiceItem.deleteMany).toHaveBeenCalledWith({
          where: { invoiceId: "1" },
        });

        // Verify the invoice was deleted
        expect(mockPrisma.invoice.delete).toHaveBeenCalledWith({
          where: { id: "1" },
        });
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });

    it("should throw an error if invoice not found", async () => {
      try {
        // Setup mock
        mockPrisma.invoice.findUnique.mockResolvedValue(null);

        // Test and verify
        await expect(
          invoiceService.deleteInvoice("nonexistent-id"),
        ).rejects.toThrow(ApiError);

        // Verify the error details
        try {
          await invoiceService.deleteInvoice("nonexistent-id");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).statusCode).toBe(404);
          expect((error as ApiError).message).toBe("Invoice not found");
        }
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });
  });

  describe("getInvoiceById", () => {
    it("should return an invoice with items", async () => {
      try {
        // Setup mocks
        mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockInvoiceItems);

        const result = await invoiceService.getInvoiceById("1");

        // Verify the invoice was found
        expect(mockPrisma.invoice.findUnique).toHaveBeenCalledWith({
          where: { id: "1" },
        });

        // Verify items were fetched
        expect(mockPrisma.invoiceItem.findMany).toHaveBeenCalledWith({
          where: { invoiceId: "1" },
        });

        // Verify the result
        expect(result).toEqual({
          ...mockInvoice,
          items: mockInvoiceItems,
        });
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });

    it("should throw an error if invoice not found", async () => {
      try {
        // Setup mock
        mockPrisma.invoice.findUnique.mockResolvedValue(null);

        // Test and verify
        await expect(
          invoiceService.getInvoiceById("nonexistent-id"),
        ).rejects.toThrow(ApiError);
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });
  });

  describe("getInvoicesByCompany", () => {
    it("should return paginated invoices for a company", async () => {
      try {
        const mockInvoices = [mockInvoice];
        const totalCount = 1;

        // Setup mocks
        mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);
        mockPrisma.invoice.count.mockResolvedValue(totalCount);

        const result = await invoiceService.getInvoicesByCompany(
          "company-123",
          1,
          10,
        );

        // Verify the query
        expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith({
          where: { companyId: "company-123" },
          skip: 0, // (page - 1) * limit = (1 - 1) * 10 = 0
          take: 10,
          orderBy: { createdAt: "desc" },
        });

        // Verify the count
        expect(mockPrisma.invoice.count).toHaveBeenCalledWith({
          where: { companyId: "company-123" },
        });

        // Verify the result
        expect(result).toEqual({
          data: mockInvoices,
          meta: {
            total: totalCount,
            page: 1,
            totalPages: 1,
            limit: 10,
          },
        });
      } catch (error) {
        console.error("Error:", error);
        throw error;
      }
    });
  });
});

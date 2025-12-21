import { ApiError } from "../../utils/errors";

// Mock data
const mockInvoice: any = {
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

const mockInvoiceItems: any[] = [
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

var mockPrisma: any;

// Mock the Prisma client
jest.mock("../../utils/prisma", () => {
  mockPrisma = {
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
  };

  return { prisma: mockPrisma };
});

describe("InvoiceService Integration Tests", () => {
  let InvoiceServiceCtor: typeof import("../../services/invoice.service").InvoiceService;
  let invoiceService: InstanceType<typeof import("../../services/invoice.service").InvoiceService>;

  beforeAll(async () => {
    ({ InvoiceService: InvoiceServiceCtor } = await import(
      "../../services/invoice.service"
    ));
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create a new instance of the service for each test
    invoiceService = new InvoiceServiceCtor();

    // Ensure the tx object uses the same spies configured on mockPrisma
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(mockPrisma as any);
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
        const createdInvoice: any = {
          id: "1",
          invoiceNumber: "INV-001",
          date: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          totalAmount: 1200,
          status: "DRAFT",
          companyId: "company-123",
          clientId: "cust-123",
        };

        mockPrisma.invoice.create.mockResolvedValue(createdInvoice);
        mockPrisma.invoiceItem.createMany.mockResolvedValue({ count: 1 } as any);
        mockPrisma.invoiceItem.findMany.mockResolvedValue(mockInvoiceItems as any);

        // Mock the generateInvoiceNumber method
        const generateInvoiceNumberSpy = jest
          .spyOn(InvoiceServiceCtor.prototype as any, "generateInvoiceNumber")
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
        expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
          data: {
            invoiceNumber: "INV-001",
            date: invoiceData.issueDate,
            dueDate: invoiceData.dueDate,
            totalAmount: invoiceData.total,
            status: invoiceData.status,
            companyId: invoiceData.companyId,
            clientId: invoiceData.customerId,
          },
        });

        // Verify items were created
        expect(mockPrisma.invoiceItem.createMany).toHaveBeenCalledWith({
          data: [
            {
              description: "Test Item 1",
              quantity: 2,
              unitPrice: 500,
              totalAmount: 1000,
              invoiceId: "1",
              accountId: "default-account-id",
            },
          ],
        });

        // Verify the result
        expect(result).toEqual({
          ...createdInvoice,
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

export {};

// Mock Prisma client first
const mockPrisma = {
  account: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock("../utils/prisma", () => ({
  prisma: mockPrisma,
}));

jest.mock("../utils/errors", () => ({
  ApiError: jest.fn().mockImplementation((statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.name = "ApiError";
    return error;
  }),
}));

import { accountsService } from "../modules/accounts/accounts.service.js";
import { accountsController } from "../modules/accounts/accounts.controller.js";
import { Request, Response, NextFunction } from "express";

describe("Accounts Module", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: {
        id: "test-user-id",
        email: "test@example.com",
        role: "USER",
        isActive: true,
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterAll(async () => {
    await mockPrisma.$disconnect();
  });

  describe("AccountsService", () => {
    describe("list", () => {
      it("should list accounts for a company", async () => {
        const mockAccounts = [
          {
            id: "1",
            code: "1000",
            name: "Cash",
            type: "ASSET",
            companyId: "company-1",
          },
        ];
        mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

        const result = await accountsService.list("company-1");

        expect(result).toEqual(mockAccounts);
        expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
          where: { companyId: "company-1" },
          orderBy: { code: "asc" },
        });
      });
    });

    describe("create", () => {
      it("should create a new account", async () => {
        const accountData = {
          companyId: "550e8400-e29b-41d4-a716-446655440000",
          code: "1000",
          name: "Cash",
          type: "ASSET",
        };
        const mockAccount = { id: "1", ...accountData };
        mockPrisma.account.create.mockResolvedValue(mockAccount);

        const result = await accountsService.create(accountData);

        expect(result).toEqual(mockAccount);
        expect(mockPrisma.account.create).toHaveBeenCalledWith({
          data: accountData,
        });
      });
    });

    describe("update", () => {
      it("should update an account", async () => {
        const updateData = { name: "Updated Cash" };
        const mockAccount = { id: "1", name: "Updated Cash" };
        mockPrisma.account.update.mockResolvedValue(mockAccount);

        const result = await accountsService.update("1", updateData);

        expect(result).toEqual(mockAccount);
        expect(mockPrisma.account.update).toHaveBeenCalledWith({
          where: { id: "1" },
          data: { ...updateData, updatedAt: expect.any(String) },
        });
      });
    });

    describe("adjustBalance", () => {
      it("should adjust account balance", async () => {
        const mockAccount = { id: "1", balance: 100 };
        mockPrisma.account.update.mockResolvedValue(mockAccount);

        const result = await accountsService.adjustBalance("1", 50);

        expect(result).toEqual(mockAccount);
        expect(mockPrisma.account.update).toHaveBeenCalledWith({
          where: { id: "1" },
          data: { balance: { increment: 50 } },
        });
      });

      it("should throw error for NaN amount", async () => {
        await expect(accountsService.adjustBalance("1", NaN)).rejects.toThrow();
      });
    });
  });

  describe("AccountsController", () => {
    describe("list", () => {
      it("should return accounts list", async () => {
        mockRequest.query = {
          companyId: "550e8400-e29b-41d4-a716-446655440000",
        };
        const mockAccounts = [{ id: "1", code: "1000", name: "Cash" }];
        mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

        await accountsController.list(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockAccounts,
        });
      });

      it("should handle validation errors", async () => {
        mockRequest.query = {};

        await accountsController.list(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(nextFunction).toHaveBeenCalled();
      });
    });

    describe("create", () => {
      it("should create and return account", async () => {
        const accountData = {
          companyId: "550e8400-e29b-41d4-a716-446655440000",
          code: "1000",
          name: "Cash",
          type: "ASSET",
        };
        mockRequest.body = accountData;
        const mockAccount = { id: "1", ...accountData };
        mockPrisma.account.create.mockResolvedValue(mockAccount);

        await accountsController.create(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockAccount,
        });
      });
    });

    describe("update", () => {
      it("should update and return account", async () => {
        const updateData = { name: "Updated Cash" };
        mockRequest.params = { id: "1" };
        mockRequest.body = updateData;
        const mockAccount = { id: "1", ...updateData };
        mockPrisma.account.update.mockResolvedValue(mockAccount);

        await accountsController.update(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockAccount,
        });
      });
    });

    describe("adjustBalance", () => {
      it("should adjust account balance", async () => {
        mockRequest.params = { id: "1" };
        mockRequest.body = { amount: 50 };
        const mockAccount = { id: "1", balance: 150 };
        mockPrisma.account.update.mockResolvedValue(mockAccount);

        await accountsController.adjustBalance(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: true,
          data: mockAccount,
        });
      });
    });
  });
});

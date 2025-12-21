import request from "supertest";

const store = {
  userIdSeq: 1,
  usersByEmail: new Map<string, any>(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const createRefreshTokenMock = jest.fn();
const getRefreshTokenExpiryMock = jest.fn();
const logAuthEventMock = jest.fn();

jest.mock("../utils/prisma", () => ({ prisma: mockPrisma }));

jest.mock("../services/refreshToken.service", () => ({
  RefreshTokenService: {
    createRefreshToken: createRefreshTokenMock,
    getRefreshTokenExpiry: getRefreshTokenExpiryMock,
  },
}));

jest.mock("../services/auditLogger.service", () => ({
  __esModule: true,
  default: {
    logAuthEvent: logAuthEventMock,
  },
}));

let app: any;

beforeAll(async () => {
  const express = (await import("express")).default;
  const { authRoutes } = await import("../routes/auth.routes");
  const { errorHandler, notFound } = await import("../middleware/errorHandler");

  app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use(notFound);
  app.use(errorHandler);
});

beforeEach(() => {
  store.userIdSeq = 1;
  store.usersByEmail.clear();
  jest.clearAllMocks();

  mockPrisma.user.findUnique.mockImplementation(async ({ where }: any) => {
    if (!where) return null;
    if (where.email) return store.usersByEmail.get(where.email) ?? null;
    return null;
  });

  mockPrisma.user.create.mockImplementation(async ({ data }: any) => {
    const id = store.userIdSeq++;
    const user = {
      id,
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };
    store.usersByEmail.set(user.email, user);
    return user;
  });

  mockPrisma.user.update.mockImplementation(async ({ where, data }: any) => {
    const user = [...store.usersByEmail.values()].find((u) => u.id === where?.id);
    if (!user) return null;
    Object.assign(user, data, { updatedAt: new Date() });
    return user;
  });

  mockPrisma.refreshToken.create.mockResolvedValue({ id: 1 });
  mockPrisma.refreshToken.findFirst.mockResolvedValue(null);
  mockPrisma.refreshToken.delete.mockResolvedValue({});
  mockPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

  createRefreshTokenMock.mockResolvedValue("test-refresh-token");
  getRefreshTokenExpiryMock.mockImplementation(() => 30);
  logAuthEventMock.mockResolvedValue(undefined);
});

describe("POST /api/auth/register", () => {
  it("should register a new user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "password",
      name: "Test User",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body?.data?.user).toBeTruthy();
  });

  it("should return 400 for invalid data", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "invalid-email",
      password: "short",
    });

    expect(response.statusCode).toBe(400);
  });
});

import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let jwtVerifyMock: any;
let JsonWebTokenErrorCtor: new (...args: any[]) => Error;
let TokenExpiredErrorCtor: new (...args: any[]) => Error;

const mockPrisma = { user: { findUnique: vi.fn() } };

vi.mock("../utils/prisma", () => ({ prisma: mockPrisma }));

vi.mock("jsonwebtoken", () => {
  class TokenExpiredError extends Error {}
  class JsonWebTokenError extends Error {}
  TokenExpiredErrorCtor = TokenExpiredError;
  JsonWebTokenErrorCtor = JsonWebTokenError;
  jwtVerifyMock = vi.fn();
  return {
    __esModule: true,
    default: { verify: jwtVerifyMock, TokenExpiredError, JsonWebTokenError },
    verify: jwtVerifyMock,
    TokenExpiredError,
    JsonWebTokenError,
  };
});

vi.mock("../config/config", () => ({ config: { jwt: { secret: "test-secret" } } }));
vi.mock("../utils/logger.js", () => ({ logger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

let auth: (req: any, res: any, next: any) => Promise<void>;
let ApiError: any;
let ErrorCodes: any;

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("auth middleware", () => {
  beforeAll(async () => {
    ({ auth } = await import("../middleware/auth.ts"));
    ({ ApiError, ErrorCodes } = await import("../utils/errorHandler"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    jwtVerifyMock.mockImplementation(() => ({ id: 1 }));
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "e",
      name: "n",
      role: "USER",
      isActive: true,
    });
  });

  it("bypasses public paths", async () => {
    const next = vi.fn();
    await auth({ path: "/api/health", headers: {}, cookies: {}, query: {} }, makeRes(), next);
    expect(jwtVerifyMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("errors when missing token", async () => {
    const next = vi.fn();
    await auth({ path: "/api/x", headers: {}, cookies: {}, query: {} }, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next.mock.calls[0][0] as any).statusCode).toBe(401);
    expect((next.mock.calls[0][0] as any).code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it("treats malformed Authorization header as missing token", async () => {
    const next = vi.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bear token" }, cookies: {}, query: {} }, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next.mock.calls[0][0] as any).statusCode).toBe(401);
  });

  it("returns INVALID_TOKEN for invalid JWT", async () => {
    jwtVerifyMock.mockImplementationOnce(() => { throw new JsonWebTokenErrorCtor("bad"); });
    const next = vi.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next.mock.calls[0][0] as any).statusCode).toBe(401);
    expect((next.mock.calls[0][0] as any).code).toBe(ErrorCodes.INVALID_TOKEN);
  });

  it("returns TOKEN_EXPIRED for expired JWT", async () => {
    jwtVerifyMock.mockImplementationOnce(() => { throw new TokenExpiredErrorCtor("expired"); });
    const next = vi.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next.mock.calls[0][0] as any).statusCode).toBe(401);
    expect((next.mock.calls[0][0] as any).code).toBe(ErrorCodes.TOKEN_EXPIRED);
  });

  it("errors when user is missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const next = vi.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next.mock.calls[0][0] as any).statusCode).toBe(401);
  });

  it("errors when user is deactivated", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: "e", name: "n", role: "USER", isActive: false });
    const next = vi.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, makeRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect((next.mock.calls[0][0] as any).statusCode).toBe(401);
    expect((next.mock.calls[0][0] as any).code).toBe(ErrorCodes.ACCOUNT_DEACTIVATED);
  });

  it("attaches req.user on success", async () => {
    const req: any = { path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} };
    const next = vi.fn();
    await auth(req, makeRes(), next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});

export {};

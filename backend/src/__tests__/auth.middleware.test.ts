var jwtVerifyMock: jest.Mock;
var JsonWebTokenErrorCtor: new (...args: any[]) => Error;
var TokenExpiredErrorCtor: new (...args: any[]) => Error;

const mockPrisma = { user: { findUnique: jest.fn() } };

jest.mock("../utils/prisma", () => ({ prisma: mockPrisma }));

jest.mock("jsonwebtoken", () => {
  class TokenExpiredError extends Error {}
  class JsonWebTokenError extends Error {}
  TokenExpiredErrorCtor = TokenExpiredError;
  JsonWebTokenErrorCtor = JsonWebTokenError;
  jwtVerifyMock = jest.fn();
  return {
    __esModule: true,
    default: { verify: jwtVerifyMock, TokenExpiredError, JsonWebTokenError },
    verify: jwtVerifyMock,
    TokenExpiredError,
    JsonWebTokenError,
  };
});

jest.mock("../config/config", () => ({ config: { jwt: { secret: "test-secret" } } }));
jest.mock("../utils/logger.js", () => ({ logger: { error: jest.fn(), warn: jest.fn(), debug: jest.fn() } }));

let auth: (req: any, res: any, next: any) => Promise<void>;
let ApiError: any;
let ErrorCodes: any;

describe("auth middleware", () => {
  beforeAll(async () => {
    ({ auth } = await import("../middleware/auth"));
    ({ ApiError, ErrorCodes } = await import("../utils/errorHandler"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jwtVerifyMock.mockImplementation(() => ({ id: 1 }));
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: "e", name: "n", role: "USER", isActive: true });
  });

  it("bypasses public paths", async () => {
    const next = jest.fn();
    await auth({ path: "/api/health", headers: {}, cookies: {}, query: {} }, {}, next);
    expect(jwtVerifyMock).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("errors when missing token", async () => {
    const next = jest.fn();
    await auth({ path: "/api/x", headers: {}, cookies: {}, query: {} }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it("treats malformed Authorization header as missing token", async () => {
    const next = jest.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bear token" }, cookies: {}, query: {} }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it("returns INVALID_TOKEN for invalid JWT", async () => {
    jwtVerifyMock.mockImplementationOnce(() => { throw new JsonWebTokenErrorCtor("bad"); });
    const next = jest.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(ErrorCodes.INVALID_TOKEN);
  });

  it("returns TOKEN_EXPIRED for expired JWT", async () => {
    jwtVerifyMock.mockImplementationOnce(() => { throw new TokenExpiredErrorCtor("expired"); });
    const next = jest.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(ErrorCodes.TOKEN_EXPIRED);
  });

  it("errors when user is missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    const next = jest.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it("errors when user is deactivated", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: "e", name: "n", role: "USER", isActive: false });
    const next = jest.fn();
    await auth({ path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(ErrorCodes.ACCOUNT_DEACTIVATED);
  });

  it("attaches req.user on success", async () => {
    const req: any = { path: "/api/x", headers: { authorization: "Bearer t" }, cookies: {}, query: {} };
    const next = jest.fn();
    await auth(req, {}, next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });
});

export {};

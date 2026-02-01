import { Request, Response } from "express";
import { RateLimiter } from "../utils/rateLimiter";
import { CacheEngine } from "../utils/cacheEngine";
import { vi } from "vitest";

vi.mock("../utils/cacheEngine", () => ({
  CacheEngine: {
    checkRateLimit: vi.fn(),
    exists: vi.fn(),
    incr: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

const cacheMock = CacheEngine as unknown as {
  checkRateLimit: jest.Mock;
  exists: jest.Mock;
  incr: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
};

const createRequest = (userId: number | string) =>
  ({ user: { id: userId }, ip: "127.0.0.1" } as unknown as Request);

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    cacheMock.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60_000,
    });
    cacheMock.exists.mockResolvedValue(false);
  });

  describe("perUserLimit", () => {
    it("allows requests within limits", async () => {
      const req = createRequest(1);
      const res = { set: jest.fn().mockReturnThis() } as unknown as Response;
      const next = jest.fn();

      await RateLimiter.perUserLimit("auth")(req, res, next);

      expect(cacheMock.checkRateLimit).toHaveBeenCalledWith("user:1:auth", 5, 60);
      expect(res.set).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it("throws ApiError with retry message when limit is exceeded", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000);

      const resetTime = Date.now() + 12_345;
      cacheMock.checkRateLimit.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetTime,
      });

      const req = createRequest(2);
      const res = { set: vi.fn().mockReturnThis() } as unknown as Response;
      const next = vi.fn();

      await expect(
        RateLimiter.perUserLimit("auth")(req, res, next),
      ).rejects.toThrow(
        `Rate limit exceeded for auth. Try again in ${Math.ceil(
          (resetTime - Date.now()) / 1000,
        )} seconds.`,
      );
      expect(res.set).toHaveBeenCalledWith({
        "X-RateLimit-Limit": 5,
        "X-RateLimit-Remaining": 0,
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("burstControl", () => {
    const makeReq = () => createRequest("user1");

    it("activates cooldown when burst limit exceeded", async () => {
      cacheMock.exists.mockResolvedValue(false);
      let burstCount = 0;
      cacheMock.incr.mockImplementation(async () => ++burstCount);

      const middleware = RateLimiter.burstControl(2, 5);
      await middleware(makeReq(), {} as Response, vi.fn());
      await middleware(makeReq(), {} as Response, vi.fn());

      await expect(
        middleware(makeReq(), {} as Response, vi.fn()),
      ).rejects.toThrow("Burst limit exceeded. Cooldown activated for 5 seconds.");

      expect(cacheMock.set).toHaveBeenCalledWith("cooldown:user1", true, 5);
      expect(cacheMock.del).toHaveBeenCalledWith("burst:user1");
    });

    it("allows requests after cooldown expires", async () => {
      let inCooldown = true;
      cacheMock.exists.mockImplementation(async () => inCooldown);
      cacheMock.incr.mockResolvedValue(0 as any);

      const middleware = RateLimiter.burstControl(1, 2);
      await expect(
        middleware(makeReq(), {} as Response, vi.fn()),
      ).rejects.toThrow("Too many requests. Please wait before trying again.");

      inCooldown = false;
      await middleware(makeReq(), {} as Response, vi.fn());
    });

    it("fails closed when cache backend errors", async () => {
      cacheMock.exists.mockRejectedValueOnce(new Error('cache_down'));
      const middleware = RateLimiter.burstControl(1, 2);
      await expect(middleware(makeReq(), {} as Response, vi.fn())).rejects.toThrow('cache_down');
    });
  });

  describe("fail-closed behavior", () => {
    it("fails closed when rate limit backend errors", async () => {
      cacheMock.checkRateLimit.mockRejectedValueOnce(new Error('cache_down'));

      const req = createRequest(1);
      const res = { set: vi.fn().mockReturnThis() } as unknown as Response;
      const next = vi.fn();

      await expect(RateLimiter.perUserLimit("auth")(req, res, next)).rejects.toThrow('cache_down');
      expect(next).not.toHaveBeenCalled();
    });
  });
});

import request from "supertest";
import express from "express";
import applySecurityMiddlewares, {
  authRateLimiter,
  sensitiveRouteLimiter,
} from "../../middleware/security";

describe("Security Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();

    // Apply security middleware first
    applySecurityMiddlewares(app);

    // Add test routes BEFORE applying specific rate limiters
    app.get("/test", (req, res) => res.json({ message: "test" }));
    app.post("/test", (req, res) => res.json(req.body));

    // Apply auth rate limiter to auth routes
    app.use("/api/v1/auth/login", authRateLimiter);
    app.use("/api/v1/auth/register", authRateLimiter);
    app.use("/api/v1/accounts", sensitiveRouteLimiter);
    app.use("/api/v1/transactions", sensitiveRouteLimiter);

    // Add auth routes after rate limiters
    app.post("/api/v1/auth/login", (req, res) => res.json({ success: true }));
    app.post("/api/v1/auth/register", (req, res) =>
      res.json({ success: true }),
    );
    app.post("/api/v1/accounts", (req, res) => res.json({ success: true }));
    app.post("/api/v1/transactions", (req, res) => res.json({ success: true }));
  });

  describe("Rate Limiting", () => {
    it("should allow normal requests", async () => {
      const response = await request(app).get("/test");
      expect(response.status).toBe(200);
    });

    it("should limit auth login attempts to 5 per minute", async () => {
      const promises = [];
      for (let i = 0; i < 7; i++) {
        promises.push(
          request(app)
            .post("/api/v1/auth/login")
            .send({ email: "test@example.com", password: "password" }),
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 200).length;
      const rateLimitCount = results.filter((r) => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(5);
      expect(rateLimitCount).toBeGreaterThan(0);
    });

    it("should limit auth register attempts to 5 per minute", async () => {
      const promises = [];
      for (let i = 0; i < 7; i++) {
        promises.push(
          request(app)
            .post("/api/v1/auth/register")
            .send({ email: `test${i}@example.com`, password: "password" }),
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 200).length;
      const rateLimitCount = results.filter((r) => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(5);
      expect(rateLimitCount).toBeGreaterThan(0);
    });

    it("should limit sensitive operations to 10 per 30 seconds", async () => {
      const promises = [];
      for (let i = 0; i < 12; i++) {
        promises.push(
          request(app).post("/api/v1/accounts").send({ name: "Test Account" }),
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 200).length;
      const rateLimitCount = results.filter((r) => r.status === 429).length;

      expect(successCount).toBeLessThanOrEqual(10);
      expect(rateLimitCount).toBeGreaterThan(0);
    });
  });

  describe("CORS Enforcement", () => {
    it("should allow requests from allowed origin", async () => {
      process.env.ALLOWED_ORIGINS = "http://localhost:3000";

      const response = await request(app)
        .get("/test")
        .set("Origin", "http://localhost:3000");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:3000",
      );
    });

    it("should reject requests from disallowed origin", async () => {
      process.env.ALLOWED_ORIGINS = "http://localhost:3000";

      const response = await request(app)
        .get("/test")
        .set("Origin", "http://malicious-site.com");

      expect(response.status).not.toBe(200);
    });
  });

  describe("JSON Content Type Enforcement", () => {
    it("should allow application/json content type", async () => {
      const response = await request(app)
        .post("/test")
        .set("Content-Type", "application/json")
        .send({ test: "data" });

      expect(response.status).toBe(200);
    });

    it("should reject text/html content type", async () => {
      const response = await request(app)
        .post("/test")
        .set("Content-Type", "text/html")
        .send("<html>test</html>");

      expect(response.status).toBe(415);
    });

    it("should reject XML content type", async () => {
      const response = await request(app)
        .post("/test")
        .set("Content-Type", "application/xml")
        .send("<xml>test</xml>");

      expect(response.status).toBe(415);
    });
  });

  describe("Body Size Limits", () => {
    it("should accept requests under 100kb", async () => {
      const smallData = { data: "x".repeat(1000) }; // ~1kb
      const response = await request(app).post("/test").send(smallData);

      expect(response.status).toBe(200);
    });

    it("should reject requests over 100kb", async () => {
      const largeData = { data: "x".repeat(102400) }; // ~100kb
      const response = await request(app).post("/test").send(largeData);

      expect(response.status).toBe(413);
    });
  });

  describe("XSS Payload Blocking", () => {
    it("should sanitize XSS payloads in JSON", async () => {
      const xssPayload = {
        message: '<script>alert("xss")</script>',
        comment: '<iframe src="javascript:alert(1)"></iframe>',
      };

      const response = await request(app).post("/test").send(xssPayload);

      expect(response.status).toBe(200);
      expect(response.body.message).not.toContain("<script>");
      expect(response.body.comment).not.toContain("<iframe>");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/test");

      expect(response.headers["x-frame-options"]).toBeDefined();
      expect(response.headers["x-content-type-options"]).toBeDefined();
      expect(response.headers["x-xss-protection"]).toBeDefined();
    });
  });
});

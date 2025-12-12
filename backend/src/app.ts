import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
// @ts-ignore
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
// @ts-ignore
import compression from "compression";
import { config } from "./config/config.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRoutes } from "./routes/auth.routes.js";
import reportRoutes from "./routes/report.routes.js";
import userRoutes from "./routes/user.routes.js";
import accountsRoutes from "./modules/accounts/accounts.routes.js";
import transactionsRoutes from "./modules/transactions/transactions.routes.js";

const app = express();

// 1) GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "trusted-cdn.com"],
        // Add other CSP directives as needed
      },
    },
    crossOriginEmbedderPolicy: false, // Required for some features
  }),
);

// Enable CORS with specific origin and credentials
app.use(
  cors({
    origin: "http://localhost:3000", // TODO: Fix config.clientUrl reference
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);

// Development logging
if (config.env === "development") {
  import("morgan").then((morgan) => {
    app.use(morgan.default("dev"));
  });
}

// Limit requests from same API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply rate limiting to API routes
app.use("/api", apiLimiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Cookie parser with secret
app.use(cookieParser(config.jwt.secret));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
// TODO: Implement xss middleware
// app.use(xss());

// Request logging
// TODO: Implement requestLogger middleware
// app.use(requestLogger);

// Prevent parameter pollution with whitelist
app.use(
  hpp({
    whitelist: [
      // Add parameters to whitelist for parameter pollution protection
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// Compression middleware (gzip)
app.use(compression());

// Request time middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestTime = new Date().toISOString();
  next();
});

// 2) ROUTES
app.use("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "unknown",
    database: "connection_check_skipped",
  });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/accounts", accountsRoutes);
app.use("/api/v1/transactions", transactionsRoutes);

// Handle 404 - Not Found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Security headers
app.disable("x-powered-by");

// Trust first proxy (if behind a reverse proxy like Nginx)
app.set("trust proxy", 1);

export default app;

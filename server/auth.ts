import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { BusinessUser, AdminUser, businessLoginSchema, adminLoginSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: 'business' | 'admin';
      businessId?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "chrona-workflow-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Business user authentication strategy
  passport.use('business', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async (email, password, done) => {
    try {
      const user = await storage.getBusinessUserByEmail(email);
      if (!user || !user.isActive) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Transform to Express.User format
      const sessionUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: 'business' as const,
        businessId: user.businessId,
      };

      return done(null, sessionUser);
    } catch (error) {
      return done(error);
    }
  }));

  // Admin user authentication strategy
  passport.use('admin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async (email, password, done) => {
    try {
      const user = await storage.getAdminUserByEmail(email);
      if (!user || !user.isActive) {
        return done(null, false, { message: 'Invalid admin credentials' });
      }
      
      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid admin credentials' });
      }

      // Transform to Express.User format
      const sessionUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: 'admin' as const,
      };

      return done(null, sessionUser);
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, { id: user.id, userType: user.userType });
  });

  passport.deserializeUser(async (data: { id: string; userType: string }, done) => {
    try {
      let user;
      if (data.userType === 'business') {
        const businessUser = await storage.getBusinessUser(data.id);
        if (businessUser) {
          user = {
            id: businessUser.id,
            email: businessUser.email,
            firstName: businessUser.firstName,
            lastName: businessUser.lastName,
            userType: 'business' as const,
            businessId: businessUser.businessId,
          };
        }
      } else if (data.userType === 'admin') {
        const adminUser = await storage.getAdminUser(data.id);
        if (adminUser) {
          user = {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            userType: 'admin' as const,
          };
        }
      }
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  // Business registration
  app.post("/api/business/register", async (req, res, next) => {
    try {
      const { businessName, email, password, firstName, lastName, phone, address, industry } = req.body;

      // Check if business email already exists
      const existingBusiness = await storage.getBusinessByEmail(email);
      if (existingBusiness) {
        return res.status(400).json({ message: "Business email already exists" });
      }

      // Check if user email already exists
      const existingUser = await storage.getBusinessUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User email already exists" });
      }

      // Create business
      const business = await storage.createBusiness({
        name: businessName,
        email,
        phone,
        address,
        industry,
      });

      // Create business admin user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createBusinessUser({
        businessId: business.id,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
      });

      // Auto-login the user
      const sessionUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: 'business' as const,
        businessId: user.businessId,
      };

      req.login(sessionUser, (err) => {
        if (err) return next(err);
        res.status(201).json({
          user: sessionUser,
          business: {
            id: business.id,
            name: business.name,
            email: business.email,
          },
        });
      });
    } catch (error) {
      console.error('Business registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Business login
  app.post("/api/business/login", (req, res, next) => {
    const validation = businessLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    passport.authenticate('business', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ user });
      });
    })(req, res, next);
  });

  // Admin login
  app.post("/api/admin/login", (req, res, next) => {
    const validation = adminLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    passport.authenticate('admin', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ user });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }
    res.json({ user: req.user });
  });

  // Create first admin user (for initial setup)
  app.post("/api/admin/create-first", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if any admin users exist
      const existingAdmin = await storage.getAdminUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin user already exists" });
      }

      // Create first admin user
      const hashedPassword = await hashPassword(password);
      const admin = await storage.createAdminUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
      });

      res.status(201).json({ 
        message: "First admin user created successfully",
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
        }
      });
    } catch (error) {
      console.error('Admin creation error:', error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// Middleware to check if user is a business user
export function isBusinessUser(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.userType === 'business') {
    return next();
  }
  res.status(403).json({ message: "Business user access required" });
}

// Middleware to check if user is an admin
export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.userType === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}

export { hashPassword, comparePasswords };
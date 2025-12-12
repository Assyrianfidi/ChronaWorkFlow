// @ts-ignore
const jwt = require("jsonwebtoken");
const { PrismaClientSingleton } = require('../lib/prisma');
import { ApiError } from "./error.middleware";

const prisma = PrismaClientSingleton.getInstance();

// Protect routes
export const protect = async (req: any, res: any, next: any) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
  }
  // Set token from cookie
  else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return next(new ApiError(401, "Not authorized to access this route"));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new ApiError(401, "User no longer exists or is inactive"));
    }

    req.user = user;
    next();
  } catch (err) {
    return next(new ApiError(401, "Not authorized to access this route"));
  }
};

// Grant access to specific roles
export const authorize = (...roles: any) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `User role ${req.user.role} is not authorized to access this route`,
        ),
      );
    }
    next();
  };
};

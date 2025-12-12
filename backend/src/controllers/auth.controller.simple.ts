import { Request, Response } from "express";

// Mock users for demo
const mockUsers = {
  "admin@accubooks.com": {
    password: "admin123",
    user: {
      id: "1",
      name: "Admin User",
      email: "admin@accubooks.com",
      role: "ADMIN",
    },
  },
  "manager@accubooks.com": {
    password: "manager123",
    user: {
      id: "2",
      name: "Manager User",
      email: "manager@accubooks.com",
      role: "MANAGER",
    },
  },
  "user@accubooks.com": {
    password: "user123",
    user: {
      id: "3",
      name: "Regular User",
      email: "user@accubooks.com",
      role: "USER",
    },
  },
  "auditor@accubooks.com": {
    password: "auditor123",
    user: {
      id: "4",
      name: "Auditor User",
      email: "auditor@accubooks.com",
      role: "AUDITOR",
    },
  },
  "inventory@accubooks.com": {
    password: "inventory123",
    user: {
      id: "5",
      name: "Inventory Manager",
      email: "inventory@accubooks.com",
      role: "INVENTORY_MANAGER",
    },
  },
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Simple Auth: Login attempt for:", email);

    const mockUser = mockUsers[email as keyof typeof mockUsers];

    if (!mockUser || mockUser.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate mock token
    const token = `simple-jwt-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("✅ Simple Auth: Login successful for:", email);

    res.status(200).json({
      success: true,
      data: {
        user: mockUser.user,
        accessToken: token,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error("❌ Simple Auth: Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    console.log("🔐 Simple Auth: Registration attempt for:", email);

    // Generate mock user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role: role || "USER",
    };

    // Generate mock token
    const token = `simple-jwt-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("✅ Simple Auth: Registration successful for:", email);

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        accessToken: token,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    console.error("❌ Simple Auth: Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // Mock user from token - in real app this would decode JWT
    const mockUser = {
      id: "1",
      name: "Admin User",
      email: "admin@accubooks.com",
      role: "ADMIN",
    };

    res.status(200).json({
      success: true,
      data: { user: mockUser },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user info",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    console.log("🔐 Simple Auth: Logout");
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    console.log("🔐 Simple Auth: Forgot password for:", email);

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process forgot password",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    console.log("🔐 Simple Auth: Reset password");
    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    console.log("🔐 Simple Auth: Email verification");
    res.status(200).json({
      success: true,
      message: "Email has been verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify email",
    });
  }
};

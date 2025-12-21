import { User, type Account } from '../types/user';

const mockAccount: Account = {
  id: "acc_123",
  provider: "credentials",
  providerAccountId: "cred_123",
  type: "credentials",
  userId: "1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const testUser: User = {
  id: "1",
  name: "Test User",
  email: "test@example.com",
  role: "USER",
  emailVerified: new Date(),
  image: null,
  accounts: [mockAccount],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const testAdmin: User = {
  ...testUser,
  id: "2",
  email: "admin@example.com",
  role: "ADMIN",
  accounts: [
    {
      ...mockAccount,
      id: "acc_456",
      userId: "2",
    },
  ],
};

export const mockSession = {
  data: {
    user: testUser,
    expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  status: "authenticated",
};

export const mockAdminSession = {
  ...mockSession,
  data: {
    ...mockSession.data,
    user: testAdmin,
  },
};

export const mockUnauthenticatedSession = {
  data: null,
  status: "unauthenticated",
};

export const mockLoadingSession = {
  data: undefined,
  status: "loading",
};

// Mock API responses
export const mockApiResponses = {
  login: {
    success: {
      user: testUser,
      token: "test-token",
    },
    error: {
      error: "Invalid credentials",
      message: "Invalid email or password",
    },
  },
  register: {
    success: {
      user: testUser,
      message: "Registration successful",
    },
    error: {
      error: "Validation error",
      message: "Email already in use",
    },
  },
  profile: {
    success: {
      ...testUser,
      name: "Updated Name",
    },
  },
};

// Mock form data
export const mockFormData = {
  login: {
    email: "test@example.com",
    password: "password123",
  },
  register: {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
    confirmPassword: "password123",
  },
  profile: {
    name: "Updated Name",
    email: "updated@example.com",
  },
};

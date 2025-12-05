// Import the service and dependencies
import { AuthService } from '../services/auth.service.js';
import { prisma } from '../utils/prisma.js';
import { ApiError } from '../utils/errors.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the dependencies
jest.mock('../utils/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@example.com' }),
  default: {
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn().mockReturnValue({ userId: 'test-user', email: 'test@example.com' }),
  },
  __esModule: true,
}));

// Get the mock functions
const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockSign = jwt.sign as jest.Mock;

// Setup the mock implementations
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mocks
  mockHash.mockResolvedValue('hashedPassword');
  mockCompare.mockResolvedValue(true);
  mockSign.mockReturnValue('test-token');
});


describe('AuthService', () => {
  let authService: AuthService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Create a new instance of AuthService before each test
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock data
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Mock prisma.user.findUnique to return null (user doesn't exist)
      mockFindUnique.mockResolvedValueOnce(null);
      
      // Create a complete user object that matches the Prisma model
      const createdUser = {
        id: 1,
        email: userData.email,
        name: userData.name,
        password: 'hashedPassword',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock prisma.user.create to return the created user
      mockCreate.mockResolvedValueOnce(createdUser);

      // Call the register method
      const result = await authService.register(userData);

      // Verify the results
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: 'hashedPassword',
          name: userData.name,
        },
      });

      // Verify the returned user doesn't include the password
      const { password, ...expectedUser } = createdUser;
      expect(result).toEqual(expectedUser);
    });

    it('should throw an error if user already exists', async () => {
      // Mock prisma.user.findUnique to return a user (user already exists)
      mockFindUnique.mockResolvedValue({
        ...mockUser,
        password: 'hashedPassword',
      });

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      // Verify that the register method throws an error
      await expect(authService.register(userData)).rejects.toThrow(
        'User already exists'
      );
      
      // Verify the error is an instance of ApiError with status code 400
      try {
        await authService.register(userData);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
        }
      }
    });
  });

  describe('login', () => {
    it('should login a user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Create a complete user object that matches the Prisma model
      const mockUserWithPassword = {
        id: 1,
        email: credentials.email,
        name: 'Test User',
        password: 'hashedPassword',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Set up the mocks
      mockFindUnique.mockResolvedValueOnce(mockUserWithPassword);
      mockCompare.mockResolvedValueOnce(true);
      mockSign.mockReturnValueOnce('test-token');
      

      // Call the login method
      const result = await authService.login(credentials);

      // Verify the results
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        mockUserWithPassword.password
      );

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      const { password, ...userWithoutPassword } = mockUserWithPassword;
      expect(result).toEqual({
        ...userWithoutPassword,
        token: 'test-token',
      });
    });

    it('should throw an error for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Mock prisma.user.findUnique to return a user with hashed password
      mockFindUnique.mockResolvedValueOnce({
        ...mockUser,
        password: 'hashedPassword',
      });
      
      // Mock bcrypt.compare to return false (invalid password)
      mockCompare.mockResolvedValueOnce(false);

      // Verify that the login method throws an error
      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid credentials'
      );
      
      // Verify the error is an instance of ApiError with status code 401
      try {
        await authService.login(credentials);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
        }
      }
    });
  });
});

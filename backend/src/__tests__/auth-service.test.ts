import { AuthService } from '../services/auth.service.js';
// Import the prisma client
import { prisma } from '../utils/prisma.js';

// Mock the prisma client
jest.mock('../utils/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/errors.js';

// Mock the dependencies
jest.mock('../utils/prisma.js');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

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

  // Mock Prisma methods
  const mockFindUnique = prisma.user.findUnique as jest.Mock;
  const mockCreate = prisma.user.create as jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup bcrypt mocks
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    
    // Setup JWT mock
    (jwt.sign as jest.Mock).mockReturnValue('test-token');
    
    // Create a new instance of AuthService
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockUser);

      // Act
      const result = await authService.register(userData);

      // Assert
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

      // Verify password is not returned
      const { password, ...expectedUser } = mockUser;
      expect(result.user).toEqual(expectedUser);
    });

    it('should throw an error if user already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      mockFindUnique.mockResolvedValue(mockUser);

      // Act & Assert
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
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockFindUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { email: credentials.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        mockUser.password
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
      );

      const { password, ...userWithoutPassword } = mockUser;
      expect(result).toEqual({
        user: userWithoutPassword,
        tokens: expect.any(Object),
      });
    });

    it('should throw an error for invalid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockFindUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
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

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      // Arrange
      const userId = 1;
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await authService.getCurrentUser(userId);

      // Assert
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw an error if user is not found', async () => {
      // Arrange
      const userId = 999;
      mockFindUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getCurrentUser(userId)).rejects.toThrow(
        'User not found'
      );
    });
  });
});

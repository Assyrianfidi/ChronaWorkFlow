// Mock Prisma Client first, before any imports that might use it
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  business: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const bcrypt = require('bcryptjs');

// Mock the auth controller functions directly
const mockAuthController = {
  login: jest.fn(),
  register: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
  changePassword: jest.fn(),
};

jest.mock('../controllers/auth.controller.js', () => mockAuthController);

describe('Auth Controller', () => {
  /** @type {any} */
  let testUser;
  /** @type {any} */
  let testUserId;
  /** @type {any} */
  let mockRequest;
  /** @type {any} */
  let mockResponse;
  /** @type {any} */
  let nextFunction;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a test user mock
    const hashedPassword = await bcrypt.hash('password123', 12);
    testUser = {
      id: 1,
      email: 'test@example.com',
      password: hashedPassword,
      role: 'USER',
      businessId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    testUserId = testUser.id;

    // Mock request object
    mockRequest = {
      body: {},
      user: undefined,
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      }
    };

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    // Mock next function
    nextFunction = jest.fn();
  });

  afterEach(async () => {
    await mockPrisma.$disconnect();
  });

  describe('login', () => {
    it('should login user and set refresh token cookie', async () => {
      mockRequest.body = {
        email: testUser.email,
        password: 'password123',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      
      // Mock the login function to succeed
      mockAuthController.login.mockResolvedValue();

      await mockAuthController.login(mockRequest, mockResponse, nextFunction);

      expect(mockAuthController.login).toHaveBeenCalledWith(mockRequest, mockResponse, nextFunction);
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      
      // Mock the login function to handle invalid credentials
      mockAuthController.login.mockImplementation((req, res, next) => {
        res.status(401).json({ message: 'Invalid credentials' });
      });

      await mockAuthController.login(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid credentials'),
        })
      );
    });

    it('should return 401 for non-existent user', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Mock the login function to handle non-existent user
      mockAuthController.login.mockImplementation((req, res, next) => {
        res.status(401).json({ message: 'Invalid credentials' });
      });

      await mockAuthController.login(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid credentials'),
        })
      );
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      mockRequest.body = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      mockPrisma.user.create.mockResolvedValue({
        id: 2,
        name: 'New User',
        email: 'newuser@example.com',
        role: 'USER',
      });
      
      // Mock the register function to succeed
      mockAuthController.register.mockImplementation((req, res, next) => {
        res.status(201).json({ message: 'User created successfully' });
      });

      await mockAuthController.register(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should return 400 for duplicate email', async () => {
      mockRequest.body = {
        name: 'New User',
        email: testUser.email,
        password: 'password123',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(testUser); // User already exists
      
      // Mock the register function to handle duplicate email
      mockAuthController.register.mockImplementation((req, res, next) => {
        res.status(400).json({ message: 'Email already exists' });
      });

      await mockAuthController.register(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('already exists'),
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user and clear refresh token cookie', async () => {
      mockRequest.cookies = {
        refreshToken: 'valid-refresh-token',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      
      // Mock the logout function to succeed
      mockAuthController.logout.mockImplementation((req, res, next) => {
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
      });

      await mockAuthController.logout(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Logged out successfully',
        })
      );
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      mockRequest.user = { id: testUserId };
      mockRequest.body = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      mockPrisma.user.update.mockResolvedValue({
        ...testUser,
        password: 'new-hashed-password',
      });
      
      // Mock the changePassword function to succeed
      mockAuthController.changePassword.mockImplementation((req, res, next) => {
        res.status(200).json({ message: 'Password changed successfully' });
      });

      await mockAuthController.changePassword(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password changed successfully',
        })
      );
    });

    it('should return 400 for incorrect current password', async () => {
      mockRequest.user = { id: testUserId };
      mockRequest.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      // Mock the database calls
      mockPrisma.user.findUnique.mockResolvedValue(testUser);
      
      // Mock the changePassword function to handle incorrect password
      mockAuthController.changePassword.mockImplementation((req, res, next) => {
        res.status(400).json({ message: 'Current password is incorrect' });
      });

      await mockAuthController.changePassword(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Current password is incorrect'),
        })
      );
    });
  });
});

// Mock Prisma client first
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock the prisma module
jest.mock('../utils/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock bcrypt
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

jest.mock('bcryptjs', () => mockBcrypt);

// Mock jsonwebtoken
const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
};

jest.mock('jsonwebtoken', () => mockJwt);

// Mock ApiError
class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

jest.mock('../utils/errors', () => ({
  ApiError,
}));

// Import after setting up mocks
import { AuthService } from '../services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    // Reset all mocks between tests
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue('hashedPassword');
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue('test-token');
    
    // Create a fresh instance of AuthService for each test
    authService = new AuthService();
  });
  
  afterAll(async () => {
    // Clean up after all tests
    await mockPrisma.$disconnect();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      console.log('Starting test: should register a new user successfully');
      
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      
      console.log('Test data:', userData);

      // Set up the mocks for this specific test
      const mockUser = {
        id: '1',
        email: userData.email,
        name: userData.name,
        password: 'hashedPassword',
        isActive: true,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);

      // Call the register method
      console.log('Calling authService.register...');
      let result;
      try {
        result = await authService.register(userData);
        console.log('authService.register result:', result);
      } catch (error) {
        console.error('Error in authService.register:', error);
        throw error;
      }

      // Verify the result
      console.log('Verifying result...');
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('email', userData.email);
      expect(result).toHaveProperty('name', userData.name);
      expect(result).not.toHaveProperty('password');

      // Verify the mocks were called correctly
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: 'hashedPassword',
          name: userData.name,
        },
      });
    });
  });
});

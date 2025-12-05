// Mock implementation of auth middleware for testing
const auth = (req, res, next) => {
  // Set a mock admin user
  req.user = {
    id: 1,
    email: 'test-admin@example.com',
    name: 'Test Admin',
    role: 'ADMIN',
    isActive: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  next();
};

// Mock implementation of authorizeRoles middleware for testing
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // In test environment, always allow access
    next();
  };
};

module.exports = {
  auth,
  authorizeRoles
};

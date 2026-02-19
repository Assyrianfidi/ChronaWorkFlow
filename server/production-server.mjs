/**
 * Production Server - ES Module
 * Unified ES Module implementation for ChronaWorkFlow
 * Compatible with package.json "type": "module"
 */

const message = [
  'ARCHIVED RUNTIME: server/production-server.mjs',
  '------------------------------------------------------------',
  'This runtime has been disabled as part of non-destructive backend consolidation.',
  'Canonical backend entrypoint is: node server/app.mjs',
  'Canonical backend implementation is: backend/server.js',
  '------------------------------------------------------------',
].join('\n');

console.error(message);
process.exit(1);

// Authentication endpoints - COMPLETELY ISOLATED
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log(`🔐 Login attempt for: ${email}`);
    
    // Check if this is the owner account
    if (email === (process.env.OWNER_EMAIL || 'ceo@chronaworkflow.com').toLowerCase()) {
      // In production, verify password hash with bcrypt
      // const isValidPassword = await bcrypt.compare(password, hashedPassword);
      // For now, accept any password for owner account
      const isValidPassword = true;
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate a mock JWT token
      const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      return res.json({
        success: true,
        data: {
          user: {
            id: 'owner-1',
            email: email,
            name: 'SkyLabs Enterprise',
            role: 'OWNER',
            permissions: ['*']
          },
          accessToken: mockToken,
          refreshToken: mockToken,
          expiresIn: '7d'
        }
      });
    }
    
    // For other emails, create a customer account
    const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        user: {
          id: 'customer-1',
          email: email,
          name: email.split('@')[0],
          role: 'CUSTOMER',
          permissions: ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read']
        },
        accessToken: mockToken,
        refreshToken: mockToken,
        expiresIn: '7d'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    console.log(`🔐 Registration for: ${email}`);
    
    // Create mock user
    const mockToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        user: {
          id: 'new-user-1',
          email: email,
          name: name,
          role: 'CUSTOMER',
          permissions: ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read']
        },
        accessToken: mockToken,
        refreshToken: mockToken,
        expiresIn: '7d'
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email] = decoded.split(':');
    
    if (email === (process.env.OWNER_EMAIL || 'ceo@chronaworkflow.com').toLowerCase()) {
      return res.json({
        success: true,
        data: {
          id: 'owner-1',
          email: email,
          name: 'SkyLabs Enterprise',
          role: 'OWNER',
          permissions: ['*']
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: 'customer-1',
        email: email,
        name: email.split('@')[0],
        role: 'CUSTOMER',
        permissions: ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read']
      }
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Generate new tokens (mock implementation)
    const decoded = Buffer.from(refreshToken, 'base64').toString('utf-8');
    const [email] = decoded.split(':');
    const newAccessToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: refreshToken,
        expiresIn: '7d'
      }
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email] = decoded.split(':');
    
    if (email === (process.env.OWNER_EMAIL || 'ceo@chronaworkflow.com').toLowerCase()) {
      return res.json({
        success: true,
        data: {
          id: 'owner-1',
          email: email,
          name: 'SkyLabs Enterprise',
          role: 'OWNER',
          permissions: ['*'],
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: 'customer-1',
        email: email,
        name: email.split('@')[0],
        role: 'CUSTOMER',
        permissions: ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read'],
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Mock business data endpoints
app.get('/api/owner/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 150,
      activeSubscriptions: 89,
      monthlyRevenue: 12450,
      totalRevenue: 89750,
      growthRate: 12.5
    }
  });
});

app.get('/api/owner/plans', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'plan-1',
        name: 'Starter',
        price: 29,
        features: ['Basic Dashboard', '10 Users', 'Email Support'],
        active: true
      },
      {
        id: 'plan-2',
        name: 'Professional',
        price: 99,
        features: ['Advanced Dashboard', '50 Users', 'Priority Support', 'API Access'],
        active: true
      },
      {
        id: 'plan-3',
        name: 'Enterprise',
        price: 299,
        features: ['Full Dashboard', 'Unlimited Users', '24/7 Support', 'Custom Features'],
        active: true
      }
    ]
  });
});

app.get('/api/owner/subscriptions', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        revenue: 348
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        planId: 'plan-2',
        status: 'active',
        startDate: '2024-02-01',
        endDate: '2025-01-31',
        revenue: 1188
      }
    ]
  });
});

// Mock accounts endpoints
app.get('/api/accounts', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'acc-1',
        code: '100',
        name: 'Cash',
        type: 'asset',
        balance: '50000.00',
        isActive: true
      },
      {
        id: 'acc-2',
        code: '200',
        name: 'Accounts Payable',
        type: 'liability',
        balance: '15000.00',
        isActive: true
      }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 ChronaWorkFlow ES Module Production API');
  console.log('='.repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Server: http://0.0.0.0:${PORT}`);
  console.log(`Health: http://0.0.0.0:${PORT}/api/health`);
  console.log(`CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`JWT Secret: ${JWT_SECRET ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`Owner Email: ${process.env.OWNER_EMAIL || 'ceo@chronaworkflow.com'}`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;

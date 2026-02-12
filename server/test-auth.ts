import express from 'express';
import cors from 'cors';

// Test if auth-unified router can be imported and mounted
async function testAuthRouter() {
  console.log('🧪 Testing auth router import...');
  
  try {
    const authRouter = (await import('./routes/auth-unified')).default;
    console.log('✅ Auth router imported successfully');
    
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Mount auth router
    app.use('/api/auth', authRouter);
    
    console.log('✅ Auth router mounted successfully');
    
    // Test route
    app.get('/test', (req, res) => {
      res.json({ status: 'ok', message: 'Auth test server running' });
    });
    
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Auth test server running on port ${PORT}`);
      console.log(`📝 Test endpoints:`);
      console.log(`   GET  http://localhost:${PORT}/test`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    });
    
  } catch (error) {
    console.error('❌ Auth router import failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testAuthRouter();

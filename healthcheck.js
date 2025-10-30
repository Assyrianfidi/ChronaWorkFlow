const { Client } = require('pg');
const { Redis } = require('ioredis');

// Parse database URL (postgresql://user:password@host:port/database)
const parseDbUrl = (url) => {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
};

const checkDatabase = async () => {
  const dbConfig = parseDbUrl(process.env.DATABASE_URL);
  const client = new Client({
    ...dbConfig,
    connectionTimeoutMillis: 5000,
    query_timeout: 3000,
    statement_timeout: 3000,
  });

  try {
    await client.connect();
    const res = await client.query('SELECT $1::text as status', ['OK']);
    return res.rows[0]?.status === 'OK';
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  } finally {
    await client.end().catch(console.error);
  }
};

const checkRedis = async () => {
  const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });

  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis health check failed:', error.message);
    return false;
  } finally {
    await redis.quit().catch(console.error);
  }
};

const checkHealth = async () => {
  console.log('Starting health check...');
  
  const dbHealthy = await checkDatabase();
  console.log(`Database connection: ${dbHealthy ? '✅' : '❌'}`);
  
  const redisHealthy = await checkRedis();
  console.log(`Redis connection: ${redisHealthy ? '✅' : '❌'}`);

  const isHealthy = dbHealthy && redisHealthy;
  console.log(`Health check ${isHealthy ? 'passed' : 'failed'}`);
  
  process.exit(isHealthy ? 0 : 1);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start the health check
checkHealth().catch((error) => {
  console.error('Health check error:', error);
  process.exit(1);
});

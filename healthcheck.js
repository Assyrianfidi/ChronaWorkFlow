const http = require('http');
const { Client } = require('pg');
const { createClient } = require('redis');
const { getEnv } = require('./backend/src/utils/env');

const env = getEnv();
const dbConfig = parseDbUrl(env.DATABASE_URL);
const pgClient = new Client({
  ...dbConfig,
  connectionTimeoutMillis: 5000,
  query_timeout: 3000,
  statement_timeout: 3000,
});
let redisClient;

// Initialize Redis client if REDIS_URL is set
if (env.REDIS_URL) {
  redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.error('Max Redis reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 5000);
      },
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
}

async function checkDatabase() {
  try {
    await pgClient.connect();
    const res = await pgClient.query('SELECT $1::text as status', ['OK']);
    await pgClient.end();
    return { status: 'ok' };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'error', error: error.message };
  }
}

async function checkRedis() {
  if (!redisClient) return { status: 'disabled' };

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.ping();
    return { status: 'ok' };
  } catch (error) {
    console.error('Redis health check failed:', error);
    return { status: 'error', error: error.message };
  }
}

async function healthCheck() {
  const [dbStatus, redisStatus] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);

  const isHealthy = dbStatus.status === 'ok' &&
                   (redisStatus.status === 'ok' || redisStatus.status === 'disabled');

  const statusCode = isHealthy ? 200 : 503;
  const response = {
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  };

  return { statusCode, response };
}

// Create a simple HTTP server for health checks
const server = http.createServer(async (req, res) => {
  if (req.url === '/health' || req.url === '/healthz') {
    try {
      const { statusCode, response } = await healthCheck();

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = statusCode;
      res.end(JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Health check failed:', error);
      res.statusCode = 500;
      res.end(JSON.stringify({
        status: 'error',
        error: 'Internal server error during health check',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }));
    }
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

// Handle shutdown gracefully
async function shutdown() {
  console.log('Shutting down health check server...');

  try {
    await Promise.all([
      pgClient.end(),
      redisClient?.quit()
    ].filter(Boolean));

    server.close(() => {
      console.log('Health check server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
const PORT = process.env.HEALTH_CHECK_PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Initial health check
healthCheck().then(({ statusCode, response }) => {
  console.log('Initial health check:', { statusCode, response });
}).catch(console.error);

// Parse database URL (postgresql://user:password@host:port/database)
function parseDbUrl(url) {
  const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) throw new Error('Invalid DATABASE_URL format');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
}

module.exports = { healthCheck };

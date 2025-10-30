import { logger } from '../utils/logger';

// Initialize the worker
logger.info('Worker process started');

// Example worker function
async function processJobs() {
  try {
    // Add your background job processing logic here
    logger.info('Worker is ready to process jobs');
    
    // Keep the process alive
    setInterval(() => {
      logger.debug('Worker heartbeat');
    }, 60000);
    
  } catch (error) {
    logger.error('Error in worker process:', error);
    process.exit(1);
  }
}

// Start the worker
processJobs().catch(error => {
  logger.error('Unhandled error in worker:', error);
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Graceful shutdown started');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT. Graceful shutdown started');
  process.exit(0);
});

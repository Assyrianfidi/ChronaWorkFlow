import { jobService } from './jobs/service.js';

console.log('🚀 Starting AccuBooks worker service...');

async function startWorker() {
  try {
    await jobService.initialize();
    console.log('✅ Worker service initialized successfully');

    // Keep the worker running
    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down worker...');
      await jobService.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('🛑 SIGINT received, shutting down worker...');
      await jobService.shutdown();
      process.exit(0);
    });

    console.log('👷 Worker is running and ready to process jobs...');
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

startWorker();

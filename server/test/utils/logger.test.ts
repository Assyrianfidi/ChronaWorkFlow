import { describe, it, expect } from 'vitest';
import { logger } from '../utils/logger';

describe('Logger', () => {
  it('should log messages correctly', () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

    logger.info('Test message');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]: Test message')
    );

    consoleSpy.mockRestore();
  });

  it('should handle error logging', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    logger.error('Test error');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]: Test error')
    );

    consoleSpy.mockRestore();
  });

  it('should store logs', () => {
    logger.info('Test log');

    const logs = logger.getLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[logs.length - 1].message).toBe('Test log');
  });
});

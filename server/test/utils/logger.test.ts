import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../utils/logger';

describe('Logger', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    logger.clearLogs();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log messages correctly', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('Test message');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\]\sINFO:\sTest message/),
      ''
    );

    consoleSpy.mockRestore();
  });

  it('should handle error logging', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('Test error');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[.*\]\sERROR:\sTest error/),
      ''
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

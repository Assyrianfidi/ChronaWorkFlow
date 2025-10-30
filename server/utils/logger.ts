type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output based on environment
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment || level === 'error') {
      const prefix = `[${entry.timestamp}] ${level.toUpperCase()}:`;
      const formattedMessage = `${prefix} ${message}`;

      switch (level) {
        case 'error':
          console.error(formattedMessage, data || '');
          break;
        case 'warn':
          console.warn(formattedMessage, data || '');
          break;
        case 'info':
          console.info(formattedMessage, data || '');
          break;
        case 'debug':
          console.debug(formattedMessage, data || '');
          break;
      }
    }
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = level ? this.logs.filter(log => log.level === level) : this.logs;
    return filteredLogs.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
  }

  getStats(): Record<LogLevel, number> {
    return this.logs.reduce((stats, log) => {
      stats[log.level]++;
      return stats;
    }, { error: 0, warn: 0, info: 0, debug: 0 });
  }
}

export const logger = new Logger();

// Edge Runtime compatible logger for Next.js middleware
// This is a simplified logger that works in Edge Runtime environment

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

// Simple logger that works in Edge Runtime
class EdgeLogger {
  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };
    return JSON.stringify(logEntry);
  }

  error(message: string, meta?: any) {
    console.error(this.formatMessage('error', message, meta));
  }

  warn(message: string, meta?: any) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  info(message: string, meta?: any) {
    console.info(this.formatMessage('info', message, meta));
  }

  http(message: string, meta?: any) {
    console.log(this.formatMessage('http', message, meta));
  }

  debug(message: string, meta?: any) {
    console.debug(this.formatMessage('debug', message, meta));
  }
}

// Export singleton instance
export const edgeLog = new EdgeLogger();
export default edgeLog;

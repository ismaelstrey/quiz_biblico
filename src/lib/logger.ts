import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import {
  currentConfig,
  criticalEvents,
  retentionPolicy,
} from './logger.config';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const logObject: any = {
      timestamp,
      level,
      message,
    };

    if (stack) {
      logObject.stack = stack;
    }

    if (Object.keys(meta).length > 0) {
      logObject.meta = meta;
    }

    return JSON.stringify(logObject);
  })
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Configuração de transports baseada no ambiente
const transports: winston.transport[] = [];

// Console transport
if (currentConfig.console.enabled) {
  const consoleFormat = currentConfig.console.colorize
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : '';
          return currentConfig.console.timestamp
            ? `${timestamp} [${level}]: ${message} ${metaStr}`
            : `[${level}]: ${message} ${metaStr}`;
        })
      )
    : winston.format.combine(winston.format.timestamp(), winston.format.json());

  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports
if (currentConfig.file.enabled) {
  // Logs de erro
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: (currentConfig.file as any).datePattern || 'YYYY-MM-DD',
      level: 'error',
      maxSize: (currentConfig.file as any).maxSize || '20m',
      maxFiles: retentionPolicy.error,
      format: logFormat,
    })
  );

  // Logs de autenticação
  transports.push(
    new DailyRotateFile({
      filename: 'logs/auth-%DATE%.log',
      datePattern: (currentConfig.file as any).datePattern || 'YYYY-MM-DD',
      maxSize: (currentConfig.file as any).maxSize || '20m',
      maxFiles: retentionPolicy.auth,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: 'info',
    })
  );

  // Logs de quiz
  transports.push(
    new DailyRotateFile({
      filename: 'logs/quiz-%DATE%.log',
      datePattern: (currentConfig.file as any).datePattern || 'YYYY-MM-DD',
      maxSize: (currentConfig.file as any).maxSize || '20m',
      maxFiles: retentionPolicy.quiz,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: 'info',
    })
  );

  // Logs combinados
  transports.push(
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: (currentConfig.file as any).datePattern || 'YYYY-MM-DD',
      maxSize: (currentConfig.file as any).maxSize || '20m',
      maxFiles: retentionPolicy.general,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Criar instância do logger
const logger = winston.createLogger({
  levels: logLevels,
  level: currentConfig.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create structured logging functions
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  http: (message: string, meta?: any) => {
    logger.http(message, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
};

// Export logger instance for advanced usage
export { logger };
export default log;

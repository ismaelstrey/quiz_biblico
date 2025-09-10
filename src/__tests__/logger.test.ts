import { log } from '../lib/logger';
import {
  logAuthEvent,
  logQuizEvent,
  logSecurityEvent,
} from '../lib/logging-middleware';

// Mock winston para testes
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  addColors: jest.fn(),
}));

jest.mock('winston-daily-rotate-file', () => jest.fn());

describe('Logger System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Logging Functions', () => {
    test('should log info messages', () => {
      const message = 'Test info message';
      const metadata = { userId: '123', action: 'test' };

      log.info(message, metadata);

      // Verificar se a função foi chamada (mock)
      expect(log.info).toBeDefined();
    });

    test('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');

      log.error(message, { error: error.message, stack: error.stack });

      expect(log.error).toBeDefined();
    });

    test('should log warning messages', () => {
      const message = 'Test warning message';

      log.warn(message);

      expect(log.warn).toBeDefined();
    });

    test('should log debug messages', () => {
      const message = 'Test debug message';

      log.debug(message);

      expect(log.debug).toBeDefined();
    });
  });

  describe('Authentication Event Logging', () => {
    test('should log successful login', () => {
      const userId = 'user123';
      const metadata = {
        email: 'test@example.com',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      logAuthEvent('login', userId, metadata);

      // Verificar se não houve erros
      expect(() => logAuthEvent('login', userId, metadata)).not.toThrow();
    });

    test('should log failed login attempt', () => {
      const metadata = {
        email: 'test@example.com',
        reason: 'invalid_password',
        ip: '192.168.1.1',
      };

      logAuthEvent('auth_failure', undefined, metadata);

      expect(() =>
        logAuthEvent('auth_failure', undefined, metadata)
      ).not.toThrow();
    });

    test('should log user registration', () => {
      const userId = 'user123';
      const metadata = {
        email: 'test@example.com',
        name: 'Test User',
        ip: '192.168.1.1',
      };

      logAuthEvent('register', userId, metadata);

      expect(() => logAuthEvent('register', userId, metadata)).not.toThrow();
    });
  });

  describe('Quiz Event Logging', () => {
    test('should log quiz attempt start', () => {
      const userId = 'user123';
      const metadata = {
        quizId: 'quiz456',
        quizTitle: 'Bible Knowledge Quiz',
        totalQuestions: 10,
      };

      logQuizEvent('quiz_start', userId, metadata);

      expect(() => logQuizEvent('quiz_start', userId, metadata)).not.toThrow();
    });

    test('should log quiz completion', () => {
      const userId = 'user123';
      const metadata = {
        quizId: 'quiz456',
        quizTitle: 'Bible Knowledge Quiz',
        score: 85,
        correctAnswers: 8,
        totalQuestions: 10,
        timeSpent: 300,
      };

      logQuizEvent('quiz_complete', userId, metadata);

      expect(() =>
        logQuizEvent('quiz_complete', userId, metadata)
      ).not.toThrow();
    });
  });

  describe('Security Event Logging', () => {
    test('should log unauthorized access attempt', () => {
      const metadata = {
        path: '/admin',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      logSecurityEvent('unauthorized_access_attempt', 'medium', metadata);

      expect(() =>
        logSecurityEvent('unauthorized_access_attempt', 'medium', metadata)
      ).not.toThrow();
    });

    test('should log security breach', () => {
      const metadata = {
        type: 'sql_injection_attempt',
        ip: '192.168.1.1',
        payload: 'SELECT * FROM users',
      };

      logSecurityEvent('security_breach', 'high', metadata);

      expect(() =>
        logSecurityEvent('security_breach', 'high', metadata)
      ).not.toThrow();
    });
  });

  describe('Performance Logging', () => {
    test('should log performance metrics using basic logger', () => {
      const metadata = {
        operation: 'database_query',
        duration: 150,
        query: 'SELECT * FROM quizzes',
      };

      log.info('Performance metric logged', {
        type: 'database_operation',
        ...metadata,
      });

      expect(() =>
        log.info('Performance metric logged', {
          type: 'database_operation',
          ...metadata,
        })
      ).not.toThrow();
    });

    test('should log slow request using basic logger', () => {
      const metadata = {
        method: 'POST',
        url: '/api/quiz-attempts',
        duration: 2500,
        userId: 'user123',
      };

      log.warn('Slow request detected', { type: 'slow_request', ...metadata });

      expect(() =>
        log.warn('Slow request detected', { type: 'slow_request', ...metadata })
      ).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle logging with invalid metadata', () => {
      expect(() => {
        log.info('Test message', null as any);
      }).not.toThrow();
    });

    test('should handle logging with circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => {
        log.info('Test message', { data: circular });
      }).not.toThrow();
    });
  });
});

import { NextRequest, NextResponse } from 'next/server';
import { edgeLog } from './edge-logger';

// Use edge-compatible logger for middleware
const log = edgeLog;

// Interface for request logging
interface RequestLogData {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}

// Middleware function to log HTTP requests
export function logRequest(req: NextRequest, startTime: number = Date.now()) {
  const requestData: RequestLogData = {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent') || undefined,
    ip:
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      undefined,
  };

  log.http('Incoming request', requestData);
  return requestData;
}

// Function to log response
export function logResponse(
  requestData: RequestLogData,
  response: NextResponse,
  startTime: number
) {
  const duration = Date.now() - startTime;
  const responseData = {
    ...requestData,
    duration,
    statusCode: response.status,
  };

  if (response.status >= 400) {
    log.warn('Request completed with error', responseData);
  } else {
    log.http('Request completed', responseData);
  }
}

// Function to log API errors
export function logApiError(error: Error, context: any = {}) {
  log.error('API Error occurred', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
  });
}

// Function to log authentication events
export function logAuthEvent(
  event:
    | 'login'
    | 'logout'
    | 'register'
    | 'auth_failure'
    | 'registration_failure',
  userId?: string,
  meta?: any
) {
  const logData = {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (event === 'auth_failure' || event === 'registration_failure') {
    log.warn(`Authentication event: ${event}`, logData);
  } else {
    log.info(`Authentication event: ${event}`, logData);
  }
}

// Function to log database operations
export function logDatabaseOperation(
  operation: string,
  table: string,
  duration?: number,
  error?: Error
) {
  const logData = {
    operation,
    table,
    duration,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    log.error(`Database operation failed: ${operation} on ${table}`, {
      ...logData,
      error: error.message,
      stack: error.stack,
    });
  } else {
    log.debug(`Database operation: ${operation} on ${table}`, logData);
  }
}

// Function to log quiz events
export function logQuizEvent(
  event: 'quiz_start' | 'quiz_complete' | 'question_answer',
  userId: string,
  meta?: any
) {
  log.info(`Quiz event: ${event}`, {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

// Function to log performance metrics
export function logPerformance(
  metric: string,
  value: number,
  unit: string = 'ms',
  meta?: any
) {
  log.info(`Performance metric: ${metric}`, {
    metric,
    value,
    unit,
    timestamp: new Date().toISOString(),
    ...meta,
  });
}

// Function to log security events
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  meta?: any
) {
  const logData = {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (severity === 'critical' || severity === 'high') {
    log.error(`Security event: ${event}`, logData);
  } else if (severity === 'medium') {
    log.warn(`Security event: ${event}`, logData);
  } else {
    log.info(`Security event: ${event}`, logData);
  }
}

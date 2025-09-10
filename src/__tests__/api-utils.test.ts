import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withErrorHandling,
  AppError,
  ErrorType,
  sanitizeInput,
} from '../lib/api-utils';
import { validateInput } from '../lib/validation-schemas';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe('api-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(ErrorType.VALIDATION, 'Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('Error');
    });

    it('should create error with internal type', () => {
      const error = new AppError(ErrorType.INTERNAL, 'Test error', 500);

      expect(error.statusCode).toBe(500);
      expect(error.type).toBe(ErrorType.INTERNAL);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim string values', () => {
      const input = { name: '  John Doe  ', age: 25 };
      const result = sanitizeInput(input);

      expect(result.name).toBe('John Doe');
      expect(result.age).toBe(25);
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '  Jane  ',
          email: '  jane@example.com  ',
        },
        count: 10,
      };
      const result = sanitizeInput(input);

      expect(result.user.name).toBe('Jane');
      expect(result.user.email).toBe('jane@example.com');
      expect(result.count).toBe(10);
    });

    it('should handle arrays as objects', () => {
      const input = {
        tags: ['  tag1  ', '  tag2  '],
        numbers: [1, 2, 3],
      };
      const result = sanitizeInput(input);

      // Arrays are treated as objects by sanitizeInput
      expect(result.tags).toEqual({ '0': 'tag1', '1': 'tag2' });
      expect(result.numbers).toEqual({ '0': 1, '1': 2, '2': 3 });
    });

    it('should handle null and undefined values', () => {
      const input = {
        name: null,
        email: undefined,
        age: 25,
      };
      const result = sanitizeInput(input);

      expect(result.name).toBeNull();
      expect(result.email).toBeUndefined();
      expect(result.age).toBe(25);
    });
  });

  describe('validateInput', () => {
    const testSchema = z.object({
      name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      email: z.string().email('Email inválido'),
    });

    it('should validate correct input', () => {
      const validData = { name: 'João', email: 'joao@example.com' };
      const result = validateInput(testSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw ZodError for invalid input', () => {
      const invalidData = { name: 'J', email: 'invalid-email' };
      expect(() => validateInput(testSchema, invalidData)).toThrow(z.ZodError);
    });
  });

  describe('withErrorHandling', () => {
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost/test',
    } as NextRequest;

    it('should handle successful handler execution', async () => {
      const mockHandler = jest
        .fn()
        .mockResolvedValue(NextResponse.json({ success: true }));

      const wrappedHandler = withErrorHandling(mockHandler);
      const result = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined);
      expect(result).toEqual(NextResponse.json({ success: true }));
    });

    it('should handle AppError', async () => {
      const appError = new AppError(
        ErrorType.VALIDATION,
        'Validation failed',
        400
      );
      const mockHandler = jest.fn().mockRejectedValue(appError);

      const wrappedHandler = withErrorHandling(mockHandler);
      const result = await wrappedHandler(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: expect.objectContaining({
            type: ErrorType.VALIDATION,
            message: 'Validation failed',
            statusCode: 400,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        },
        { status: 400 }
      );
    });

    it('should handle generic Error', async () => {
      const genericError = new Error('Something went wrong');
      const mockHandler = jest.fn().mockRejectedValue(genericError);

      const wrappedHandler = withErrorHandling(mockHandler);
      const result = await wrappedHandler(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: expect.objectContaining({
            type: ErrorType.INTERNAL,
            message: 'Erro interno do servidor',
            statusCode: 500,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        },
        { status: 500 }
      );
    });

    it('should handle unknown error types', async () => {
      const unknownError = 'String error';
      const mockHandler = jest.fn().mockRejectedValue(unknownError);

      const wrappedHandler = withErrorHandling(mockHandler);
      const result = await wrappedHandler(mockRequest);

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: expect.objectContaining({
            type: ErrorType.INTERNAL,
            message: 'Erro interno do servidor',
            statusCode: 500,
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        },
        { status: 500 }
      );
    });

    it('should log errors', async () => {
      const appError = new AppError(ErrorType.VALIDATION, 'Test error', 400);
      const mockHandler = jest.fn().mockRejectedValue(appError);

      const wrappedHandler = withErrorHandling(mockHandler);
      await wrappedHandler(mockRequest);

      // Verify that console.error was called (logError function calls it)
      expect(console.error).toHaveBeenCalled();
    });
  });
});

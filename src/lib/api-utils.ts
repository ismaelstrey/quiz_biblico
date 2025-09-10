import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Tipos de erro padronizados
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

// Interface para erros estruturados
export interface ApiError {
  type: ErrorType;
  message: string;
  details?: any;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

// Classe personalizada para erros da API
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Função para gerar ID único da requisição
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Função para log estruturado
export function logError(error: Error | AppError, context?: any) {
  const timestamp = new Date().toISOString();
  const requestId = generateRequestId();

  const logData = {
    timestamp,
    requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        type: error.type,
        statusCode: error.statusCode,
        details: error.details,
        isOperational: error.isOperational,
      }),
    },
    context,
  };

  // Em produção, enviar para serviço de monitoramento (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar com Sentry ou outro serviço de monitoramento
    console.error('[PRODUCTION ERROR]', JSON.stringify(logData, null, 2));
  } else {
    console.error('[DEV ERROR]', logData);
  }

  return requestId;
}

// Função para tratar erros do Prisma
export function handlePrismaError(error: any): AppError {
  // Erro de registro duplicado
  if (error.code === 'P2002') {
    return new AppError(ErrorType.CONFLICT, 'Recurso já existe', 409, {
      field: error.meta?.target,
    });
  }

  // Registro não encontrado
  if (error.code === 'P2025') {
    return new AppError(ErrorType.NOT_FOUND, 'Recurso não encontrado', 404);
  }

  // Violação de constraint
  if (error.code === 'P2003') {
    return new AppError(
      ErrorType.VALIDATION,
      'Violação de integridade referencial',
      400,
      { field: error.meta?.field_name }
    );
  }

  // Erro genérico do banco
  return new AppError(ErrorType.DATABASE, 'Erro no banco de dados', 500, {
    code: error.code,
    message: error.message,
  });
}

// Função para tratar erros de validação do Zod
export function handleZodError(error: ZodError): AppError {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new AppError(ErrorType.VALIDATION, 'Dados de entrada inválidos', 400, {
    validationErrors: details,
  });
}

// Função principal para tratamento de erros
export function handleApiError(error: unknown, context?: any): NextResponse {
  const requestId = generateRequestId();
  let apiError: AppError;

  // Determinar o tipo de erro
  if (error instanceof AppError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = handleZodError(error);
  } else if (error && typeof error === 'object' && 'code' in error) {
    // Erro do Prisma
    apiError = handlePrismaError(error);
  } else if (error instanceof Error) {
    // Erro genérico
    apiError = new AppError(
      ErrorType.INTERNAL,
      'Erro interno do servidor',
      500,
      { originalMessage: error.message }
    );
  } else {
    // Erro desconhecido
    apiError = new AppError(
      ErrorType.INTERNAL,
      'Erro interno do servidor',
      500,
      { originalError: error }
    );
  }

  // Log do erro
  logError(apiError, { ...context, requestId });

  // Resposta estruturada
  const errorResponse: ApiError = {
    type: apiError.type,
    message: apiError.message,
    statusCode: apiError.statusCode,
    timestamp: new Date().toISOString(),
    requestId,
    ...(process.env.NODE_ENV === 'development' && {
      details: apiError.details,
      stack: apiError.stack,
    }),
  };

  return NextResponse.json(
    { error: errorResponse },
    { status: apiError.statusCode }
  );
}

// Wrapper para APIs com tratamento de erro automático
export function withErrorHandling(
  handler: (request: any, params?: any) => Promise<NextResponse>
) {
  return async (request: any, params?: any) => {
    try {
      return await handler(request, params);
    } catch (error) {
      return handleApiError(error, {
        method: request.method,
        url: request.url,
        params,
      });
    }
  };
}

// Utilitários para validação
export function validateRequired(value: any, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    throw new AppError(ErrorType.VALIDATION, `${fieldName} é obrigatório`, 400);
  }
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(ErrorType.VALIDATION, 'Email inválido', 400);
  }
}

export function validatePasswordStrength(password: string) {
  if (password.length < 6) {
    throw new AppError(
      ErrorType.VALIDATION,
      'Senha deve ter pelo menos 6 caracteres',
      400
    );
  }
}

// Utilitário para autenticação
export function requireAuth(session: any) {
  if (!session || !session.isAuthenticated) {
    throw new AppError(
      ErrorType.AUTHENTICATION,
      'Autenticação necessária',
      401
    );
  }
  return session;
}

// Utilitário para rate limiting (placeholder)
export function checkRateLimit(identifier: string, limit: number = 100) {
  // TODO: Implementar rate limiting real com Redis
  // Por enquanto, apenas um placeholder
  return true;
}

// Utilitário para sanitização de dados
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim();
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

// Utilitário para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || '10'))
  );
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  return { page, limit, sortBy, sortOrder };
}

export function getPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
  };
}

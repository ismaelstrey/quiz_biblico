import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createSession, validatePassword } from '@/lib/auth';
import {
  withErrorHandling,
  AppError,
  ErrorType,
  sanitizeInput,
} from '@/lib/api-utils';
import { validateInput, loginSchema } from '@/lib/validation-schemas';
import { logAuthEvent, logApiError } from '@/lib/logging-middleware';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Validar e sanitizar dados de entrada
  const rawBody = await request.json();
  const sanitizedBody = sanitizeInput(rawBody);
  const { email, password } = validateInput(loginSchema, sanitizedBody);

  // Buscar usuário
  const user = await getUserByEmail(email.toLowerCase());
  if (!user) {
    logAuthEvent('auth_failure', undefined, {
      email: email.toLowerCase(),
      reason: 'user_not_found',
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
    });
    throw new AppError(
      ErrorType.AUTHENTICATION,
      'Email ou senha incorretos',
      401
    );
  }

  // Validar senha
  const isValidPassword = await validatePassword(email.toLowerCase(), password);
  if (!isValidPassword) {
    logAuthEvent('auth_failure', user.id, {
      email: email.toLowerCase(),
      reason: 'invalid_password',
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
    });
    throw new AppError(
      ErrorType.AUTHENTICATION,
      'Email ou senha incorretos',
      401
    );
  }

  // Criar sessão
  const sessionId = await createSession(user.id);

  // Log successful login
  logAuthEvent('login', user.id, {
    email: user.email,
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  });

  // Configurar cookie e resposta
  const response = NextResponse.json(
    {
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    { status: 200 }
  );

  response.cookies.set('user-session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
});

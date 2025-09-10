import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, createSession } from '@/lib/auth';
import {
  withErrorHandling,
  AppError,
  ErrorType,
  sanitizeInput,
} from '@/lib/api-utils';
import { validateInput, registerSchema } from '@/lib/validation-schemas';
import { logAuthEvent } from '@/lib/logging-middleware';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Validar e sanitizar dados de entrada
  const rawBody = await request.json();
  const sanitizedBody = sanitizeInput(rawBody);
  const { name, email, password } = validateInput(
    registerSchema,
    sanitizedBody
  );

  // Verificar se usuário já existe
  const existingUser = await getUserByEmail(email.toLowerCase());
  if (existingUser) {
    logAuthEvent('registration_failure', undefined, {
      email: email.toLowerCase(),
      reason: 'email_already_exists',
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
    });
    throw new AppError(
      ErrorType.CONFLICT,
      'Usuário já existe com este email',
      409
    );
  }

  // Criar usuário
  const user = await createUser(name.trim(), email.toLowerCase(), password);

  // Log successful registration
  logAuthEvent('register', user.id, {
    email: user.email,
    name: user.name,
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  });

  // Criar sessão
  const sessionId = await createSession(user.id);

  // Configurar cookie e resposta
  const response = NextResponse.json(
    {
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
    { status: 201 }
  );

  response.cookies.set('user-session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
});

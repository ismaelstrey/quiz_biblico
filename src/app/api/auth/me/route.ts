import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { withErrorHandling, AppError, ErrorType } from '@/lib/api-utils';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const sessionId = request.cookies.get('user-session')?.value;

  if (!sessionId) {
    throw new AppError(ErrorType.AUTHENTICATION, 'Não autenticado', 401);
  }

  const user = await getSessionUser(sessionId);

  if (!user) {
    throw new AppError(ErrorType.AUTHENTICATION, 'Sessão inválida', 401);
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

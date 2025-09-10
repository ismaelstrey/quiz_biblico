import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { withErrorHandling } from '@/lib/api-utils';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const sessionId = request.cookies.get('user-session')?.value;

  if (sessionId) {
    await destroySession();
  }

  const response = NextResponse.json(
    { message: 'Logout realizado com sucesso' },
    { status: 200 }
  );

  // Remover cookie
  response.cookies.set('user-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
});

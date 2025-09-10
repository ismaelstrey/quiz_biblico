import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  logRequest,
  logResponse,
  logSecurityEvent,
} from './lib/logging-middleware';

// Rotas que precisam de autenticação
const protectedRoutes = ['/quiz', '/profile', '/dashboard'];

// Rotas que só usuários não autenticados podem acessar
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  // Log incoming request
  const requestData = logRequest(request, startTime);

  // Verificar se o usuário está autenticado através do cookie de sessão
  const sessionCookie = request.cookies.get('user-session');
  const isAuthenticated = !!sessionCookie?.value;

  let response: NextResponse;

  // Se está tentando acessar uma rota protegida sem estar autenticado
  if (
    protectedRoutes.some(route => pathname.startsWith(route)) &&
    !isAuthenticated
  ) {
    logSecurityEvent('unauthorized_access_attempt', 'medium', {
      path: pathname,
      ip: requestData.ip,
      userAgent: requestData.userAgent,
    });

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    response = NextResponse.redirect(loginUrl);
  }
  // Se está autenticado e tentando acessar login/register, redirecionar para home
  else if (authRoutes.includes(pathname) && isAuthenticated) {
    response = NextResponse.redirect(new URL('/', request.url));
  } else {
    response = NextResponse.next();
  }

  // Log response
  logResponse(requestData, response, startTime);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

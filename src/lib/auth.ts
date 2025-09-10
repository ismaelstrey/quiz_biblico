import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export interface AuthSession {
  user: User;
  isAuthenticated: boolean;
}

// Função para criar um usuário
export async function createUser(
  name: string,
  email: string,
  password: string
): Promise<{ id: string; name: string; email: string; password: string }> {
  if (!name && !email && !password) {
    throw new Error('Nome é obrigatório');
  }
  const hashedPassword = await bcrypt.hash(password, 12);

  const createdUser = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPassword,
    },
  });

  if (!createdUser) {
    throw new Error('Erro ao criar usuário');
  }

  return createdUser;
}

// Função para buscar usuário por email
export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user || null;
}

// Função para buscar usuário por ID
export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user
    ? {
        id: user.id,
        name: user.name || '', // Convert null to empty string to match User interface
        email: user.email,
        password: user.password,
        createdAt: user.createdAt,
      }
    : null;
}

// Função para criar sessão (salvar no cookie)
export async function createSession(userId: string): Promise<string> {
  const sessionId = `session_${userId}_${Date.now()}`;
  const cookieStore = await cookies();
  cookieStore.set('user-session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  });
  return sessionId;
}

// Função auxiliar para extrair userId do sessionId
function extractUserIdFromSession(sessionId: string): string | null {
  const parts = sessionId.split('_');
  if (parts.length >= 3 && parts[0] === 'session') {
    return parts[1];
  }
  return null;
}

// Função para obter sessão atual
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('user-session');

    if (!sessionCookie?.value) {
      return null;
    }

    const userId = extractUserIdFromSession(sessionCookie.value);
    if (!userId) {
      return null;
    }

    const user = await getUserById(userId);
    if (!user) {
      return null;
    }

    return {
      user,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
}

// Função para obter sessão do request (para API routes)
export async function getSessionFromRequest(
  request: NextRequest
): Promise<AuthSession | null> {
  try {
    const sessionCookie = request.cookies.get('user-session');

    if (!sessionCookie?.value) {
      return null;
    }

    const userId = extractUserIdFromSession(sessionCookie.value);
    if (!userId) {
      return null;
    }

    const user = await getUserById(userId);
    if (!user) {
      return null;
    }

    return {
      user,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Erro ao obter sessão do request:', error);
    return null;
  }
}

// Função para obter usuário de uma sessão pelo sessionId
export async function getSessionUser(sessionId: string): Promise<User | null> {
  try {
    const userId = extractUserIdFromSession(sessionId);
    if (!userId) {
      return null;
    }

    const user = await getUserById(userId);
    return user;
  } catch (error) {
    console.error('Erro ao obter usuário da sessão:', error);
    return null;
  }
}

// Função para destruir sessão (logout)
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('user-session');
}

// Função para validar senha
export async function validatePassword(
  email: string,
  password: string
): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user) return false;

  return await bcrypt.compare(password, user.password);
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para validar nome
export function isValidName(name: string): boolean {
  return name.trim().length >= 2;
}

// Função para validar força da senha
export function validatePasswordStrength(password: string): boolean {
  return password.length >= 6;
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/api-utils';

export const GET = withErrorHandling(async () => {
  const levels = await prisma.level.findMany({
    include: {
      _count: {
        select: { quizzes: true },
      },
    },
  });

  return NextResponse.json(levels);
});

// POST /api/levels - Criar um novo nível
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, difficulty, minScore } = body;

    if (!name || !difficulty) {
      return NextResponse.json(
        { error: 'Nome e dificuldade são obrigatórios' },
        { status: 400 }
      );
    }

    const level = await prisma.level.create({
      data: {
        name,
        description,
        difficulty,
        minScore: minScore || 0,
      },
    });

    return NextResponse.json(level, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar nível:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

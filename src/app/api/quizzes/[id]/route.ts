import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  withErrorHandling,
  AppError,
  ErrorType,
  sanitizeInput,
} from '@/lib/api-utils';
import { validateInput, idParamSchema } from '@/lib/validation-schemas';

// GET /api/quizzes/[id] - Buscar um quiz específico
export const GET = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    // Validar e sanitizar parâmetro ID
    const resolvedParams = await params;
    const sanitizedParams = sanitizeInput(resolvedParams);
    const { id } = validateInput(idParamSchema, sanitizedParams);

    const quiz = await prisma.quiz.findUnique({
      where: {
        id,
      },
      include: {
        level: true,
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      throw new AppError(ErrorType.NOT_FOUND, 'Quiz não encontrado', 404);
    }

    return NextResponse.json(quiz);
  }
);

// PUT /api/quizzes/[id] - Atualizar um quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, levelId, isActive } = body;

    const quiz = await prisma.quiz.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        levelId,
        isActive,
      },
      include: {
        level: true,
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Erro ao atualizar quiz:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/quizzes/[id] - Deletar um quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.quiz.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: 'Quiz deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar quiz:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

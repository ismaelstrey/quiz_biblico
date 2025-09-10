import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, sanitizeInput } from '@/lib/api-utils';
import {
  validateQueryParams,
  validateInput,
  quizFiltersWithPaginationSchema,
  createQuizSchema,
} from '@/lib/validation-schemas';

// GET /api/quizzes - Listar todos os quizzes
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Validar parâmetros de consulta
  const {
    levelId,
    page = 1,
    limit = 10,
  } = validateQueryParams(quizFiltersWithPaginationSchema, searchParams);

  const offset = (page - 1) * limit;

  const quizzes = await prisma.quiz.findMany({
    where: {
      isActive: true,
      ...(levelId && { levelId }),
    },
    skip: offset,
    take: limit,
    include: {
      level: true,
      questions: {
        include: {
          answers: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const total = await prisma.quiz.count({
    where: {
      isActive: true,
      ...(levelId && { levelId }),
    },
  });

  return NextResponse.json({
    quizzes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST /api/quizzes - Criar um novo quiz
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const sanitizedBody = sanitizeInput(body);
  const { title, description, levelId, isActive } = validateInput(
    createQuizSchema,
    sanitizedBody
  );

  // Extrair questions do body (não faz parte do createQuizSchema)
  const { questions } = sanitizedBody;

  if (!title || !levelId) {
    return NextResponse.json(
      { error: 'Título e nível são obrigatórios' },
      { status: 400 }
    );
  }

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      levelId,
      isActive,
      questions: {
        create:
          questions?.map((q: any) => ({
            questionText: q.questionText,
            questionType: q.questionType || 'MULTIPLE_CHOICE',
            difficulty: q.difficulty || 1,
            bibleVerse: q.bibleVerse,
            explanation: q.explanation,
            answers: {
              create: q.answers?.map((a: any) => ({
                answerText: a.answerText,
                isCorrect: a.isCorrect || false,
              })),
            },
          })) || [],
      },
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

  return NextResponse.json(quiz, { status: 201 });
});

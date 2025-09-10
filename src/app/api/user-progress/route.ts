import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { withErrorHandling, AppError, ErrorType } from '@/lib/api-utils';

// GET /api/user-progress - Buscar progresso do usuário autenticado
export const GET = withErrorHandling(async (request: NextRequest) => {
  const sessionId = request.cookies.get('user-session')?.value;

  if (!sessionId) {
    throw new AppError(ErrorType.AUTHENTICATION, 'Não autenticado', 401);
  }

  const user = await getSessionUser(sessionId);

  if (!user) {
    throw new AppError(ErrorType.NOT_FOUND, 'Usuário não encontrado', 404);
  }

  const userId = user.id;

  // Buscar progresso geral do usuário
  const userProgress = await prisma.userProgress.findMany({
    where: { userId },
    include: {
      level: {
        select: {
          id: true,
          name: true,
          difficulty: true,
          minScore: true,
        },
      },
    },
    orderBy: {
      level: {
        difficulty: 'asc',
      },
    },
  });

  // Buscar estatísticas de tentativas
  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: {
        include: {
          level: true,
          _count: {
            select: { questions: true },
          },
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });

  // Calcular estatísticas gerais
  const totalAttempts = quizAttempts.length;
  const totalScore = quizAttempts.reduce(
    (sum, attempt) => sum + attempt.score,
    0
  );
  const totalPossibleScore = quizAttempts.reduce(
    (sum, attempt) => sum + attempt.quiz._count.questions,
    0
  );
  const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0; // média das porcentagens

  // Agrupar tentativas por nível
  const attemptsByLevel = quizAttempts.reduce((acc, attempt) => {
    const levelId = attempt.quiz.level.id;
    if (!acc[levelId]) {
      acc[levelId] = {
        level: attempt.quiz.level,
        attempts: [],
        totalScore: 0,
        totalPossible: 0,
        bestScore: 0,
        averageScore: 0,
      };
    }

    acc[levelId].attempts.push(attempt);
    acc[levelId].totalScore += attempt.score;
    acc[levelId].totalPossible += attempt.quiz._count.questions;
    acc[levelId].bestScore = Math.max(
      acc[levelId].bestScore,
      attempt.score // score já é uma porcentagem (0-100)
    );

    return acc;
  }, {} as any);

  // Calcular média por nível
  Object.values(attemptsByLevel).forEach((levelData: any) => {
    levelData.averageScore =
      levelData.attempts.length > 0
        ? levelData.totalScore / levelData.attempts.length // média das porcentagens
        : 0;
  });

  return NextResponse.json({
    userProgress,
    statistics: {
      totalAttempts,
      totalScore,
      totalPossibleScore,
      averageScore: Math.round(averageScore * 100) / 100,
      attemptsByLevel: Object.values(attemptsByLevel),
    },
    recentAttempts: quizAttempts.slice(0, 10), // Últimas 10 tentativas
  });
});

// POST /api/user-progress - Atualizar progresso do usuário autenticado
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('user-session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { levelId, score, maxScore } = body;
    const userId = user.id;

    if (!levelId || score === undefined || maxScore === undefined) {
      return NextResponse.json(
        { error: 'levelId, score e maxScore são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o nível para verificar requisitos
    const level = await prisma.level.findUnique({
      where: { id: levelId },
    });

    if (!level) {
      return NextResponse.json(
        { error: 'Nível não encontrado' },
        { status: 404 }
      );
    }

    // Calcular porcentagem
    const percentage = (score / maxScore) * 100;
    const isUnlocked = percentage >= level.minScore;

    // Verificar se já existe progresso para este usuário e nível
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_levelId: {
          userId,
          levelId,
        },
      },
    });

    let userProgress;

    if (existingProgress) {
      // Atualizar apenas se a nova pontuação for melhor
      const newBestScore = Math.max(existingProgress.bestScore, score);
      const newBestPercentage = Math.max(
        existingProgress.bestPercentage,
        percentage
      );
      const newIsUnlocked = existingProgress.isUnlocked || isUnlocked;

      userProgress = await prisma.userProgress.update({
        where: {
          userId_levelId: {
            userId,
            levelId,
          },
        },
        data: {
          bestScore: newBestScore,
          bestPercentage: newBestPercentage,
          isUnlocked: newIsUnlocked,
          attemptsCount: {
            increment: 1,
          },
          lastAttemptAt: new Date(),
        },
        include: {
          level: true,
        },
      });
    } else {
      // Criar novo progresso
      userProgress = await prisma.userProgress.create({
        data: {
          userId,
          levelId,
          bestScore: score,
          bestPercentage: percentage,
          isUnlocked,
          attemptsCount: 1,
          lastAttemptAt: new Date(),
        },
        include: {
          level: true,
        },
      });
    }

    // Verificar se deve desbloquear o próximo nível
    let nextLevelUnlocked = null;
    if (isUnlocked && percentage >= level.minScore) {
      const nextLevel = await prisma.level.findFirst({
        where: {
          difficulty: level.difficulty + 1,
        },
      });

      if (nextLevel) {
        // Verificar se o usuário já tem progresso no próximo nível
        const nextLevelProgress = await prisma.userProgress.findUnique({
          where: {
            userId_levelId: {
              userId,
              levelId: nextLevel.id,
            },
          },
        });

        if (!nextLevelProgress) {
          // Criar progresso para o próximo nível (desbloqueado mas não tentado)
          nextLevelUnlocked = await prisma.userProgress.create({
            data: {
              userId,
              levelId: nextLevel.id,
              bestScore: 0,
              bestPercentage: 0,
              isUnlocked: true,
              attemptsCount: 0,
            },
            include: {
              level: true,
            },
          });
        }
      }
    }

    return NextResponse.json({
      userProgress,
      nextLevelUnlocked,
      achievements: {
        levelCompleted: isUnlocked,
        perfectScore: percentage === 100,
        firstAttempt: !existingProgress,
        nextLevelUnlocked: !!nextLevelUnlocked,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

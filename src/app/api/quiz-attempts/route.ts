import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import { logQuizEvent, logApiError } from '@/lib/logging-middleware';

// POST /api/quiz-attempts - Submeter tentativa de quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session || !session.isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, answers, timeSpent } = body;
    const userId = session.user.id;

    if (!quizId || !answers) {
      return NextResponse.json(
        { error: 'quizId e answers são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o quiz com as perguntas e respostas corretas
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz não encontrado' },
        { status: 404 }
      );
    }

    // Log quiz attempt start
    logQuizEvent('quiz_start', userId, {
      quizId,
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      timeSpent,
    });

    // Calcular pontuação
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach(question => {
      const userAnswer = answers.find(
        (answer: any) => answer.questionId === question.id
      );
      const correctAnswer = question.answers.find(a => a.isCorrect);

      if (
        userAnswer &&
        correctAnswer &&
        userAnswer.answerId === correctAnswer.id
      ) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Salvar tentativa
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        totalQuestions,
        correctAnswers,
        timeSpent: timeSpent || 0,
      },
      include: {
        quiz: {
          include: {
            level: true,
          },
        },
      },
    });

    // Log quiz completion
    logQuizEvent('quiz_complete', userId, {
      quizId,
      quizTitle: quiz.title,
      score,
      correctAnswers,
      totalQuestions,
      percentage: Math.round((correctAnswers / totalQuestions) * 100),
      timeSpent,
      level: quizAttempt.quiz.level?.name,
    });

    // Progresso do usuário agora é gerenciado pela API /api/user-progress

    return NextResponse.json(
      {
        attempt: quizAttempt,
        results: {
          score,
          correctAnswers,
          totalQuestions,
          percentage: Math.round((correctAnswers / totalQuestions) * 100),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao submeter tentativa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/quiz-attempts - Buscar tentativas do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      );
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: {
          include: {
            level: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('Erro ao buscar tentativas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

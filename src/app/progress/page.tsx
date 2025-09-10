'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Level {
  id: string;
  name: string;
  difficulty: number;
  minScore: number;
}

interface UserProgress {
  id: string;
  userId: string;
  levelId: string;
  bestScore: number;
  bestPercentage: number;
  isUnlocked: boolean;
  attemptsCount: number;
  lastAttemptAt: string | null;
  level: Level;
}

interface QuizAttempt {
  id: string;
  score: number;
  completedAt: string;
  quiz: {
    id: string;
    title: string;
    level: Level;
    _count: {
      questions: number;
    };
  };
}

interface LevelStatistics {
  level: Level;
  attempts: QuizAttempt[];
  totalScore: number;
  totalPossible: number;
  bestScore: number;
  averageScore: number;
}

interface ProgressData {
  userProgress: UserProgress[];
  statistics: {
    totalAttempts: number;
    totalScore: number;
    totalPossibleScore: number;
    averageScore: number;
    attemptsByLevel: LevelStatistics[];
  };
  recentAttempts: QuizAttempt[];
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const response = await fetch('/api/user-progress');
      if (response.ok) {
        const data = await response.json();
        setProgressData(data);
      } else if (response.status === 401) {
        // Usuário não autenticado, redirecionar para login
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Erro ao buscar dados de progresso:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800 border-green-200',
      2: 'bg-blue-100 text-blue-800 border-blue-200',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      4: 'bg-orange-100 text-orange-800 border-orange-200',
      5: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      colors[difficulty as keyof typeof colors] ||
      'bg-gray-100 text-gray-800 border-gray-200'
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Carregando progresso...</p>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>📊</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Nenhum progresso encontrado
          </h2>
          <p className='text-gray-600 mb-6'>
            Comece fazendo alguns quizzes para ver seu progresso aqui.
          </p>
          <Link
            href='/'
            className='bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors'
          >
            Fazer Quiz
          </Link>
        </div>
      </div>
    );
  }

  const { userProgress, statistics, recentAttempts } = progressData;

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                📊 Meu Progresso
              </h1>
              <p className='text-gray-600 mt-1'>
                Acompanhe seu desempenho e conquistas
              </p>
            </div>
            <Link
              href='/'
              className='bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors'
            >
              Voltar aos Quizzes
            </Link>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Estatísticas Gerais */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Estatísticas Gerais
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='text-3xl mr-4'>🎯</div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Total de Tentativas
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {statistics.totalAttempts}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='text-3xl mr-4'>⭐</div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Pontuação Total
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {statistics.totalScore}/{statistics.totalPossibleScore}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='text-3xl mr-4'>📈</div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Média Geral
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {statistics.averageScore.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='text-3xl mr-4'>🏆</div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>
                    Níveis Desbloqueados
                  </p>
                  <p className='text-2xl font-bold text-gray-900'>
                    {userProgress.filter(p => p.isUnlocked).length}/5
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Progresso por Nível */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Progresso por Nível
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {userProgress.map(progress => {
              const levelStats = statistics.attemptsByLevel.find(
                stats => stats.level.id === progress.levelId
              );

              return (
                <div
                  key={progress.id}
                  className='bg-white rounded-lg shadow-lg p-6'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div>
                      <div
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(
                          progress.level.difficulty
                        )}`}
                      >
                        {progress.level.name}
                      </div>
                      <p className='text-sm text-gray-600 mt-1'>
                        Nível {progress.level.difficulty} • Mínimo:{' '}
                        {progress.level.minScore}%
                      </p>
                    </div>
                    <div className='text-right'>
                      {progress.isUnlocked ? (
                        <span className='text-green-600 text-sm font-medium'>
                          ✓ Desbloqueado
                        </span>
                      ) : (
                        <span className='text-gray-400 text-sm font-medium'>
                          🔒 Bloqueado
                        </span>
                      )}
                    </div>
                  </div>

                  {progress.attemptsCount > 0 ? (
                    <div className='space-y-4'>
                      {/* Barra de Progresso */}
                      <div>
                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                          <span>Melhor Pontuação</span>
                          <span>{progress.bestPercentage.toFixed(1)}%</span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-3'>
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(
                              progress.bestPercentage
                            )}`}
                            style={{
                              width: `${Math.min(progress.bestPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Estatísticas */}
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <p className='text-gray-600'>Tentativas</p>
                          <p className='font-semibold'>
                            {progress.attemptsCount}
                          </p>
                        </div>
                        <div>
                          <p className='text-gray-600'>Melhor Score</p>
                          <p className='font-semibold'>{progress.bestScore}</p>
                        </div>
                        {levelStats && (
                          <>
                            <div>
                              <p className='text-gray-600'>Média do Nível</p>
                              <p className='font-semibold'>
                                {levelStats.averageScore.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className='text-gray-600'>Quizzes Feitos</p>
                              <p className='font-semibold'>
                                {levelStats.attempts.length}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {progress.lastAttemptAt && (
                        <p className='text-xs text-gray-500'>
                          Última tentativa: {formatDate(progress.lastAttemptAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className='text-center py-4'>
                      <p className='text-gray-500 text-sm'>
                        Nenhuma tentativa ainda
                      </p>
                      {progress.isUnlocked && (
                        <Link
                          href='/'
                          className='inline-block mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium'
                        >
                          Fazer primeiro quiz →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Tentativas Recentes */}
        {recentAttempts.length > 0 && (
          <section>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Tentativas Recentes
            </h2>
            <div className='bg-white rounded-lg shadow overflow-hidden'>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Quiz
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Nível
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Pontuação
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Porcentagem
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {recentAttempts.map(attempt => {
                      const percentage = attempt.score; // score já é uma porcentagem (0-100)
                      return (
                        <tr key={attempt.id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='text-sm font-medium text-gray-900'>
                              {attempt.quiz.title}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                                attempt.quiz.level.difficulty
                              )}`}
                            >
                              {attempt.quiz.level.name}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                            {attempt.score}/{attempt.quiz._count.questions}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='flex-1 mr-2'>
                                <div className='w-full bg-gray-200 rounded-full h-2'>
                                  <div
                                    className={`h-2 rounded-full ${getProgressColor(
                                      percentage
                                    )}`}
                                    style={{
                                      width: `${Math.min(percentage, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <span className='text-sm font-medium text-gray-900'>
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {formatDate(attempt.completedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

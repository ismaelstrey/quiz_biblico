'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  minScore: number;
  _count: {
    quizzes: number;
  };
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  level: Level;
  _count: {
    questions: number;
  };
}

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  useEffect(() => {
    fetchLevels();
    fetchQuizzes();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await fetch('/api/levels');
      const data = await response.json();
      setLevels(data);
    } catch (error) {
      console.error('Erro ao buscar níveis:', error);
    }
  };

  const fetchQuizzes = async (levelId?: string) => {
    try {
      const url = levelId ? `/api/quizzes?levelId=${levelId}` : '/api/quizzes';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract quizzes array from the response object
      if (data && Array.isArray(data.quizzes)) {
        setQuizzes(data.quizzes);
      } else {
        console.error('Invalid response format:', data);
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelFilter = (levelId: string) => {
    setSelectedLevel(levelId);
    setLoading(true);
    fetchQuizzes(levelId || undefined);
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800',
    };
    return (
      colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    );
  };

  if (authLoading || loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='text-center bg-white p-8 rounded-lg shadow-lg max-w-md'>
          <div className='text-6xl mb-4'>🔒</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Acesso Restrito
          </h2>
          <p className='text-gray-600 mb-6'>
            Você precisa estar autenticado para acessar os quizzes bíblicos.
          </p>
          <Link
            href='/auth'
            className='bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium'
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                📖 Bible Quiz App
              </h1>
              <p className='text-gray-600 mt-1'>
                Teste seus conhecimentos bíblicos
              </p>
            </div>
            <div className='flex space-x-4'>
              <Link
                href='/progress'
                className='bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium'
              >
                📊 Meu Progresso
              </Link>
              <Link
                href='/admin'
                className='bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium'
              >
                🔧 Painel Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Níveis */}
        <section className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-6'>
            Níveis de Dificuldade
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
            <button
              onClick={() => handleLevelFilter('')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedLevel === ''
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className='text-center'>
                <div className='text-2xl mb-2'>🎯</div>
                <h3 className='font-semibold text-gray-900'>Todos</h3>
                <p className='text-sm text-gray-600'>Ver todos os quizzes</p>
              </div>
            </button>
            {levels.map(level => (
              <button
                key={level.id}
                onClick={() => handleLevelFilter(level.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedLevel === level.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className='text-center'>
                  <div
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2 ${getDifficultyColor(
                      level.difficulty
                    )}`}
                  >
                    Nível {level.difficulty}
                  </div>
                  <h3 className='font-semibold text-gray-900'>{level.name}</h3>
                  <p className='text-sm text-gray-600 mb-2'>
                    {level.description}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {level._count.quizzes} quizzes
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Quizzes */}
        <section>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-gray-900'>
              Quizzes Disponíveis
              {selectedLevel && (
                <span className='text-lg font-normal text-gray-600 ml-2'>
                  - {levels.find(l => l.id === selectedLevel)?.name}
                </span>
              )}
            </h2>
            <p className='text-gray-600'>
              {quizzes.length} quizzes encontrados
            </p>
          </div>

          {quizzes.length === 0 ? (
            <div className='text-center py-12'>
              <div className='text-6xl mb-4'>📚</div>
              <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                Nenhum quiz encontrado
              </h3>
              <p className='text-gray-600 mb-6'>
                {selectedLevel
                  ? 'Não há quizzes disponíveis para este nível.'
                  : 'Não há quizzes disponíveis no momento.'}
              </p>
              <Link
                href='/admin'
                className='inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
              >
                Criar Novo Quiz
              </Link>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {quizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'
                >
                  <div className='p-6'>
                    <div className='flex items-start justify-between mb-4'>
                      <div
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                          quiz.level.difficulty
                        )}`}
                      >
                        {quiz.level.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {quiz._count.questions} perguntas
                      </div>
                    </div>

                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {quiz.title}
                    </h3>
                    <p className='text-gray-600 text-sm mb-4 line-clamp-2'>
                      {quiz.description}
                    </p>

                    <Link
                      href={`/quiz/${quiz.id}`}
                      className='w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-center block'
                    >
                      Iniciar Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Answer {
  id: string;
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';
  answers: Answer[];
}

interface Level {
  id: string;
  name: string;
  difficulty: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  level: Level;
  questions: Question[];
}

interface UserAnswer {
  questionId: string;
  answerId?: string;
  textAnswer?: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // const [submitted, setSubmitted] = useState(false)
  // const [result, setResult] = useState<QuizResult | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (quizId) {
      checkAuthAndFetchQuiz();
    }
  }, [quizId]);

  const checkAuthAndFetchQuiz = async () => {
    try {
      // Verificar autenticação
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        window.location.href = '/auth';
        return;
      }
      setIsAuthenticated(true);

      // Buscar quiz
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (!response.ok) {
        throw new Error('Quiz não encontrado');
      }
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      console.error('Erro ao buscar quiz:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (
    questionId: string,
    answerId?: string,
    textAnswer?: string
  ) => {
    const newAnswers = [...userAnswers];
    const existingIndex = newAnswers.findIndex(
      a => a.questionId === questionId
    );

    const answer: UserAnswer = {
      questionId,
      answerId,
      textAnswer,
    };

    if (existingIndex >= 0) {
      newAnswers[existingIndex] = answer;
    } else {
      newAnswers.push(answer);
    }

    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: userAnswers,
          timeSpent: 0, // TODO: Implement timer functionality
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao submeter quiz');
      }

      const result = await response.json();
      setScore(result.results.correctAnswers);
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      alert('Erro ao submeter quiz. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
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

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCurrentAnswer = (questionId: string) => {
    return userAnswers.find(a => a.questionId === questionId);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>❌</div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            Quiz não encontrado
          </h2>
          <p className='text-gray-600 mb-6'>
            O quiz que você está procurando não existe.
          </p>
          <Link
            href='/'
            className='bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors'
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className='max-w-4xl mx-auto px-4 py-8'>
          <div className='bg-white rounded-lg shadow-lg p-8 text-center'>
            <div className='text-6xl mb-6'>🎉</div>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              Quiz Concluído!
            </h1>

            <div className='mb-6'>
              <div
                className={`text-4xl font-bold mb-2 ${getScoreColor(
                  score,
                  quiz.questions.length
                )}`}
              >
                {score}/{quiz.questions.length}
              </div>
              <p className='text-gray-600'>
                Você acertou {Math.round((score / quiz.questions.length) * 100)}
                % das perguntas
              </p>
            </div>

            <div className='bg-gray-50 rounded-lg p-6 mb-6'>
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                {quiz.title}
              </h2>
              <div
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                  quiz.level.difficulty
                )}`}
              >
                {quiz.level.name}
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/'
                className='bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors'
              >
                Voltar ao Início
              </Link>
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setUserAnswers([]);
                  setScore(0);
                }}
                className='bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors'
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = getCurrentAnswer(currentQuestion.id);
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allQuestionsAnswered = userAnswers.length === quiz.questions.length;

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>{quiz.title}</h1>
              <div
                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${getDifficultyColor(
                  quiz.level.difficulty
                )}`}
              >
                {quiz.level.name}
              </div>
            </div>
            <div className='text-sm text-gray-600'>
              Pergunta {currentQuestionIndex + 1} de {quiz.questions.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className='bg-white border-b'>
        <div className='max-w-4xl mx-auto px-4 py-2'>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-indigo-600 h-2 rounded-full transition-all duration-300'
              style={{
                width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <main className='max-w-4xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-lg shadow-lg p-8'>
          {/* Question */}
          <div className='mb-8'>
            <h2 className='text-2xl font-semibold text-gray-900 mb-6'>
              {currentQuestion.questionText}
            </h2>

            {/* Multiple Choice */}
            {currentQuestion.questionType === 'MULTIPLE_CHOICE' && (
              <div className='space-y-3'>
                {currentQuestion.answers.map(answer => (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(currentQuestion.id, answer.id)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      currentAnswer?.answerId === answer.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className='flex items-center'>
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          currentAnswer?.answerId === answer.id
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {currentAnswer?.answerId === answer.id && (
                          <div className='w-2 h-2 bg-white rounded-full mx-auto mt-0.5'></div>
                        )}
                      </div>
                      <span className='text-gray-900'>{answer.answerText}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* True/False */}
            {currentQuestion.questionType === 'TRUE_FALSE' && (
              <div className='space-y-3'>
                {currentQuestion.answers.map(answer => (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(currentQuestion.id, answer.id)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      currentAnswer?.answerId === answer.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className='flex items-center justify-center'>
                      <span className='text-lg font-semibold text-gray-900'>
                        {answer.answerText}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Fill in the Blank */}
            {currentQuestion.questionType === 'FILL_BLANK' && (
              <div>
                <input
                  type='text'
                  value={currentAnswer?.textAnswer || ''}
                  onChange={e =>
                    handleAnswer(currentQuestion.id, undefined, e.target.value)
                  }
                  placeholder='Digite sua resposta...'
                  className='w-full p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none'
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className='flex justify-between items-center'>
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className='px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Anterior
            </button>

            <div className='text-sm text-gray-600'>
              {userAnswers.length}/{quiz.questions.length} respondidas
            </div>

            {isLastQuestion ? (
              <button
                onClick={submitQuiz}
                disabled={!allQuestionsAnswered || submitting}
                className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {submitting ? 'Enviando...' : 'Finalizar Quiz'}
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className='px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
              >
                Próxima
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: number;
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

interface GeneratedQuestion {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
}

export default function AdminPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'generate'>('quizzes');

  // Generate Questions Form
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    difficulty: 'Intermediário',
    questionCount: 5,
    questionType: 'MULTIPLE_CHOICE' as
      | 'MULTIPLE_CHOICE'
      | 'TRUE_FALSE'
      | 'MIXED',
    levelId: '',
    createQuiz: false,
    quizTitle: '',
    quizDescription: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    GeneratedQuestion[]
  >([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [levelsRes, quizzesRes] = await Promise.all([
        fetch('/api/levels'),
        fetch('/api/quizzes'),
      ]);

      const levelsData = await levelsRes.json();
      const quizzesData = await quizzesRes.json();

      setLevels(levelsData);
      setQuizzes(quizzesData.quizzes || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async () => {
    if (!generateForm.topic.trim()) {
      alert('Por favor, insira um tópico para gerar as perguntas.');
      return;
    }

    if (
      generateForm.createQuiz &&
      (!generateForm.quizTitle.trim() || !generateForm.levelId)
    ) {
      alert('Por favor, preencha o título do quiz e selecione um nível.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: generateForm.topic,
          difficulty: generateForm.difficulty,
          questionCount: generateForm.questionCount,
          questionType: generateForm.questionType,
          levelId: generateForm.createQuiz ? generateForm.levelId : undefined,
          quizTitle: generateForm.createQuiz
            ? generateForm.quizTitle
            : undefined,
          quizDescription: generateForm.createQuiz
            ? generateForm.quizDescription
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar perguntas');
      }

      const data = await response.json();
      setGeneratedQuestions(data.questions);

      if (generateForm.createQuiz && data.quiz) {
        alert(`Quiz "${data.quiz.title}" criado com sucesso!`);
        fetchData(); // Refresh data
        // Reset form
        setGenerateForm({
          topic: '',
          difficulty: 'Intermediário',
          questionCount: 5,
          questionType: 'MULTIPLE_CHOICE',
          levelId: '',
          createQuiz: false,
          quizTitle: '',
          quizDescription: '',
        });
      }
    } catch (error) {
      console.error('Erro ao gerar perguntas:', error);
      alert(
        'Erro ao gerar perguntas. Verifique se a chave da OpenAI está configurada.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const deleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Tem certeza que deseja excluir o quiz "${quizTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir quiz');
      }

      alert('Quiz excluído com sucesso!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Erro ao excluir quiz:', error);
      alert('Erro ao excluir quiz.');
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

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Carregando...</p>
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
                ⚙️ Administração
              </h1>
              <p className='text-gray-600 mt-1'>
                Gerencie quizzes e gere perguntas com IA
              </p>
            </div>
            <Link
              href='/'
              className='bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors'
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Tabs */}
        <div className='mb-8'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'quizzes'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gerenciar Quizzes
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'generate'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gerar Perguntas com IA
              </button>
            </nav>
          </div>
        </div>

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>
                Quizzes Existentes
              </h2>
              <p className='text-gray-600'>
                {quizzes.length} quizzes encontrados
              </p>
            </div>

            {quizzes.length === 0 ? (
              <div className='text-center py-12 bg-white rounded-lg shadow'>
                <div className='text-6xl mb-4'>📝</div>
                <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                  Nenhum quiz encontrado
                </h3>
                <p className='text-gray-600 mb-6'>
                  Comece gerando perguntas com IA na aba ao lado.
                </p>
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

                      <div className='flex space-x-2'>
                        <Link
                          href={`/quiz/${quiz.id}`}
                          className='flex-1 bg-indigo-600 text-white py-2 px-3 rounded text-center text-sm hover:bg-indigo-700 transition-colors'
                        >
                          Testar
                        </Link>
                        <button
                          onClick={() => deleteQuiz(quiz.id, quiz.title)}
                          className='bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors'
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generate Questions Tab */}
        {activeTab === 'generate' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Form */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-6'>
                🤖 Gerar Perguntas com IA
              </h2>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tópico Bíblico *
                  </label>
                  <input
                    type='text'
                    value={generateForm.topic}
                    onChange={e =>
                      setGenerateForm({
                        ...generateForm,
                        topic: e.target.value,
                      })
                    }
                    placeholder='Ex: Histórias do Antigo Testamento, Parábolas de Jesus, etc.'
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Dificuldade
                    </label>
                    <select
                      value={generateForm.difficulty}
                      onChange={e =>
                        setGenerateForm({
                          ...generateForm,
                          difficulty: e.target.value,
                        })
                      }
                      className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    >
                      <option value='Iniciante'>Iniciante</option>
                      <option value='Básico'>Básico</option>
                      <option value='Intermediário'>Intermediário</option>
                      <option value='Avançado'>Avançado</option>
                      <option value='Expert'>Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Quantidade
                    </label>
                    <input
                      type='number'
                      min='1'
                      max='20'
                      value={generateForm.questionCount}
                      onChange={e =>
                        setGenerateForm({
                          ...generateForm,
                          questionCount: parseInt(e.target.value),
                        })
                      }
                      className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tipo de Pergunta
                  </label>
                  <select
                    value={generateForm.questionType}
                    onChange={e =>
                      setGenerateForm({
                        ...generateForm,
                        questionType: e.target.value as any,
                      })
                    }
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  >
                    <option value='MULTIPLE_CHOICE'>Múltipla Escolha</option>
                    <option value='TRUE_FALSE'>Verdadeiro/Falso</option>
                    <option value='MIXED'>Misto</option>
                  </select>
                </div>

                <div className='border-t pt-4'>
                  <div className='flex items-center mb-4'>
                    <input
                      type='checkbox'
                      id='createQuiz'
                      checked={generateForm.createQuiz}
                      onChange={e =>
                        setGenerateForm({
                          ...generateForm,
                          createQuiz: e.target.checked,
                        })
                      }
                      className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                    />
                    <label
                      htmlFor='createQuiz'
                      className='ml-2 text-sm font-medium text-gray-700'
                    >
                      Criar quiz automaticamente
                    </label>
                  </div>

                  {generateForm.createQuiz && (
                    <div className='space-y-4 pl-6 border-l-2 border-indigo-200'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Título do Quiz *
                        </label>
                        <input
                          type='text'
                          value={generateForm.quizTitle}
                          onChange={e =>
                            setGenerateForm({
                              ...generateForm,
                              quizTitle: e.target.value,
                            })
                          }
                          placeholder='Ex: Quiz sobre Histórias do Antigo Testamento'
                          className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Descrição
                        </label>
                        <textarea
                          value={generateForm.quizDescription}
                          onChange={e =>
                            setGenerateForm({
                              ...generateForm,
                              quizDescription: e.target.value,
                            })
                          }
                          placeholder='Descrição opcional do quiz...'
                          rows={3}
                          className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Nível *
                        </label>
                        <select
                          value={generateForm.levelId}
                          onChange={e =>
                            setGenerateForm({
                              ...generateForm,
                              levelId: e.target.value,
                            })
                          }
                          className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        >
                          <option value=''>Selecione um nível</option>
                          {levels.map(level => (
                            <option key={level.id} value={level.id}>
                              {level.name} (Nível {level.difficulty})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={generateQuestions}
                  disabled={generating}
                  className='w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {generating ? 'Gerando...' : '🚀 Gerar Perguntas'}
                </button>
              </div>
            </div>

            {/* Generated Questions Preview */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h3 className='text-xl font-bold text-gray-900 mb-4'>
                📋 Perguntas Geradas
              </h3>

              {generatedQuestions.length === 0 ? (
                <div className='text-center py-8'>
                  <div className='text-4xl mb-4'>🤖</div>
                  <p className='text-gray-600'>
                    As perguntas geradas aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className='space-y-6 max-h-96 overflow-y-auto'>
                  {generatedQuestions.map((question, index) => (
                    <div
                      key={index}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <h4 className='font-semibold text-gray-900 mb-3'>
                        {index + 1}. {question.text}
                      </h4>
                      <div className='space-y-2'>
                        {question.answers.map((answer, answerIndex) => (
                          <div
                            key={answerIndex}
                            className={`p-2 rounded text-sm ${
                              answer.isCorrect
                                ? 'bg-green-100 text-green-800 font-medium'
                                : 'bg-gray-50 text-gray-700'
                            }`}
                          >
                            {answer.isCorrect && '✓ '}
                            {answer.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

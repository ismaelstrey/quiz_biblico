'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { login, register } = useAuth();

  // Verificar se já está autenticado
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        // Já está autenticado, redirecionar
        router.push('/');
      }
    } catch (error) {
      // Não autenticado, continuar na página
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let success = false;

      if (isLogin) {
        success = await login(formData.email, formData.password);
      } else {
        success = await register(
          formData.name,
          formData.email,
          formData.password
        );
      }

      if (success) {
        setSuccess(
          isLogin ? 'Login realizado com sucesso!' : 'Conta criada com sucesso!'
        );
        // Redirecionar após sucesso
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setError(isLogin ? 'Email ou senha incorretos' : 'Erro ao criar conta');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='text-6xl mb-4'>📖</div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Bible Quiz App
          </h1>
          <p className='text-gray-600'>
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Form */}
        <div className='bg-white rounded-lg shadow-lg p-8'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {!isLogin && (
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Nome Completo
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  placeholder='Digite seu nome completo'
                />
              </div>
            )}

            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                placeholder='Digite seu email'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Senha
              </label>
              <input
                type='password'
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                placeholder='Digite sua senha (mínimo 6 caracteres)'
              />
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
                {error}
              </div>
            )}

            {success && (
              <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg'>
                {success}
              </div>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium'
            >
              {loading ? (
                <div className='flex items-center justify-center'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                  {isLogin ? 'Entrando...' : 'Criando conta...'}
                </div>
              ) : isLogin ? (
                'Entrar'
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className='mt-6 text-center'>
            <p className='text-gray-600'>
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                type='button'
                onClick={toggleMode}
                className='ml-2 text-indigo-600 hover:text-indigo-700 font-medium'
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>

          {/* Demo Info */}
          <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
            <h3 className='text-sm font-medium text-blue-900 mb-2'>
              💡 Modo Demo
            </h3>
            <p className='text-sm text-blue-700'>
              Este é um sistema de autenticação simplificado para demonstração.
              Em produção, seria necessário implementar senhas e outras medidas
              de segurança.
            </p>
          </div>

          {/* Back to Home */}
          <div className='mt-6 text-center'>
            <Link
              href='/'
              className='text-gray-500 hover:text-gray-700 text-sm'
            >
              ← Voltar para o início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

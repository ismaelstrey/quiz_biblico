'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  useFormValidation,
  loginFormSchema,
  LoginFormData,
} from '@/hooks/useFormValidation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldError,
  } = useFormValidation<LoginFormData>({
    schema: loginFormSchema,
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async formData => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          // Se for erro de validação, definir erros específicos dos campos
          if (response.status === 400 && data.errors) {
            Object.entries(data.errors).forEach(([field, message]) => {
              setFieldError(field as keyof LoginFormData, message as string);
            });
            return;
          }
          throw new Error(data.error || 'Erro ao fazer login');
        }

        // Redirecionar para a página original ou inicial
        router.push(redirectUrl);
        router.refresh();
      } catch (error) {
        setFieldError(
          'email',
          error instanceof Error ? error.message : 'Erro ao fazer login'
        );
      }
    },
  });

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <div className='text-center'>
            <div className='text-6xl mb-4'>📖</div>
            <h2 className='text-3xl font-bold text-gray-900 mb-2'>
              Bible Quiz App
            </h2>
            <p className='text-gray-600'>Faça login para continuar</p>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-8'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Email
              </label>
              <input
                id='email'
                name='email'
                type='email'
                required
                value={values.email}
                onChange={e => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='seu@email.com'
              />
              {errors.email && (
                <p className='mt-1 text-sm text-red-600'>{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Senha
              </label>
              <input
                id='password'
                name='password'
                type='password'
                required
                value={values.password}
                onChange={e => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Sua senha'
              />
              {errors.password && (
                <p className='mt-1 text-sm text-red-600'>{errors.password}</p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            <div className='text-center'>
              <p className='text-sm text-gray-600'>
                Não tem uma conta?{' '}
                <Link
                  href='/register'
                  className='font-medium text-indigo-600 hover:text-indigo-500'
                >
                  Registre-se aqui
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

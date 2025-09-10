'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  useFormValidation,
  registerFormSchema,
  RegisterFormData,
} from '@/hooks/useFormValidation';

export default function RegisterPage() {
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
  } = useFormValidation<RegisterFormData>({
    schema: registerFormSchema,
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async formData => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Se for erro de validação, definir erros específicos dos campos
          if (response.status === 400 && data.errors) {
            Object.entries(data.errors).forEach(([field, message]) => {
              setFieldError(field as keyof RegisterFormData, message as string);
            });
            return;
          }
          throw new Error(data.error || 'Erro ao criar conta');
        }

        // Redirecionar para a página original ou inicial
        router.push(redirectUrl);
        router.refresh();
      } catch (error) {
        setFieldError(
          'email',
          error instanceof Error ? error.message : 'Erro ao criar conta'
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
            <p className='text-gray-600'>Crie sua conta para começar</p>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-lg p-8'>
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Nome
              </label>
              <input
                id='name'
                name='name'
                type='text'
                required
                value={values.name}
                onChange={e => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Seu nome completo'
              />
              {errors.name && (
                <p className='mt-1 text-sm text-red-600'>{errors.name}</p>
              )}
            </div>

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
                placeholder='Mínimo 6 caracteres'
              />
              {errors.password && (
                <p className='mt-1 text-sm text-red-600'>{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Confirmar Senha
              </label>
              <input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                required
                value={values.confirmPassword}
                onChange={e => handleChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Digite a senha novamente'
              />
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-red-600'>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isSubmitting ? 'Criando conta...' : 'Criar conta'}
              </button>
            </div>

            <div className='text-center'>
              <p className='text-sm text-gray-600'>
                Já tem uma conta?{' '}
                <Link
                  href='/login'
                  className='font-medium text-indigo-600 hover:text-indigo-500'
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

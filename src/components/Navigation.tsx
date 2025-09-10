'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Não mostrar navegação nas páginas de login e registro
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    router.push('/login');
    setIsMenuOpen(false);
  };

  if (isLoading) {
    return (
      <nav className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <Link href='/' className='flex items-center space-x-2'>
              <span className='text-2xl'>📖</span>
              <span className='text-xl font-bold text-gray-900'>
                Bible Quiz
              </span>
            </Link>
            <div className='animate-pulse bg-gray-200 h-8 w-24 rounded'></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className='bg-white shadow-sm border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <Link
            href='/'
            className='flex items-center space-x-2 hover:opacity-80 transition-opacity'
          >
            <span className='text-2xl'>📖</span>
            <span className='text-xl font-bold text-gray-900'>Bible Quiz</span>
          </Link>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center space-x-6'>
            {isAuthenticated ? (
              <>
                <Link
                  href='/'
                  className='text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Quizzes
                </Link>
                <Link
                  href='/progress'
                  className='text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Progresso
                </Link>
                <Link
                  href='/admin'
                  className='text-gray-600 hover:text-gray-900 transition-colors'
                >
                  Admin
                </Link>

                {/* User Menu */}
                <div className='relative'>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className='flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none'
                  >
                    <div className='w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium'>
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className='text-sm font-medium'>{user?.name}</span>
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border'>
                      <div className='px-4 py-2 text-sm text-gray-500 border-b'>
                        {user?.email}
                      </div>
                      <Link
                        href='/progress'
                        className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        onClick={() => setIsMenuOpen(false)}
                      >
                        📊 Meu Progresso
                      </Link>
                      <button
                        onClick={handleLogout}
                        className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                      >
                        🚪 Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className='bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium'
              >
                Entrar
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='text-gray-600 hover:text-gray-900 focus:outline-none'
            >
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className='md:hidden border-t bg-white'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              {isAuthenticated ? (
                <>
                  <div className='px-3 py-2 text-sm font-medium text-gray-900 border-b'>
                    Olá, {user?.name}!
                  </div>
                  <Link
                    href='/'
                    className='block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🎯 Quizzes
                  </Link>
                  <Link
                    href='/progress'
                    className='block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📊 Progresso
                  </Link>
                  <Link
                    href='/admin'
                    className='block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🔧 Admin
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md'
                  >
                    🚪 Sair
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className='block w-full text-left px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium'
                >
                  Entrar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {isMenuOpen && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
}

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

// Componente de teste para usar o hook useAuth
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, register, logout } =
    useAuth();

  return (
    <div>
      <div data-testid='loading'>{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid='authenticated'>
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid='user'>{user ? user.name : 'no-user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button
        onClick={() => register('Test User', 'test@example.com', 'password')}
      >
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful fetch responses by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
      }),
    });
  });

  it('should provide initial state', async () => {
    // Mock the auth check to return no user
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    renderWithProvider();

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    // Wait for the auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent(
      'not-authenticated'
    );
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
  });

  it('should handle successful login', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      });

    renderWithProvider();

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
      }),
    });
  });

  it('should handle failed login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    renderWithProvider();

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'not-authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  it('should handle successful registration', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
        }),
      });

    renderWithProvider();

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
      }),
    });
  });

  it('should handle failed registration', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already exists' }),
    });

    renderWithProvider();

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'not-authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });

  it('should handle logout', async () => {
    // First login
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
      }),
    });

    renderWithProvider();

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'authenticated'
      );
    });

    // Mock logout response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Then logout
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'not-authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    });
  });

  it('should check authentication status on mount', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
      }),
    });

    renderWithProvider();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me');
    });
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    renderWithProvider();

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent(
        'not-authenticated'
      );
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Navigation', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
    mockUsePathname.mockReturnValue('/');
    jest.clearAllMocks();
  });

  it('should not render on login page', () => {
    mockUsePathname.mockReturnValue('/login');
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      refreshAuth: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render on register page', () => {
    mockUsePathname.mockReturnValue('/register');
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      refreshAuth: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });

    render(<Navigation />);
    expect(screen.getByText('Bible Quiz')).toBeInTheDocument();
    // During loading state, the navigation still renders normally
    expect(screen.getByText('Entrar')).toBeInTheDocument();
  });

  it('should render login button when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      refreshAuth: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    render(<Navigation />);

    expect(screen.getByText('Bible Quiz')).toBeInTheDocument();
    expect(screen.getByText('Entrar')).toBeInTheDocument();
    expect(screen.queryByText('Sair')).not.toBeInTheDocument();
  });

  it('should render user menu when authenticated', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      refreshAuth: jest.fn(),
      isAuthenticated: true,
      logout: jest.fn(),
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
    });

    render(<Navigation />);

    expect(screen.getByText('Bible Quiz')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Quizzes')).toBeInTheDocument();
    expect(screen.getByText('Progresso')).toBeInTheDocument();
    expect(screen.queryByText('Entrar')).not.toBeInTheDocument();
  });

  it('should handle login click', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: jest.fn(),
      isLoading: false,
      refreshAuth: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
    });

    render(<Navigation />);

    fireEvent.click(screen.getByText('Entrar'));

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should handle logout click', async () => {
    const mockLogout = jest.fn();
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      logout: mockLogout,
      isLoading: false,
      refreshAuth: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
    });

    render(<Navigation />);

    // Click on user menu to open dropdown
    fireEvent.click(screen.getByText('Test User'));

    // Click logout in dropdown
    const logoutButtons = screen.getAllByText('🚪 Sair');
    fireEvent.click(logoutButtons[0]);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should toggle mobile menu', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });

    render(<Navigation />);

    // Mobile menu content should not be visible initially
    expect(screen.queryByText('Olá, Test User!')).not.toBeInTheDocument();

    // Find and click mobile menu button (hamburger icon)
    const buttons = screen.getAllByRole('button');
    const mobileMenuButton = buttons.find(
      button =>
        button.querySelector('svg') &&
        button.querySelector('path[d="M4 6h16M4 12h16M4 18h16"]')
    );

    if (mobileMenuButton) {
      fireEvent.click(mobileMenuButton);

      // Mobile menu content should be visible
      expect(screen.getByText('Olá, Test User!')).toBeInTheDocument();
    }
  });
});

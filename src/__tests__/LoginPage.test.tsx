import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from '../app/login/page';
import { useFormValidation } from '../hooks/useFormValidation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock useFormValidation hook
jest.mock('../hooks/useFormValidation', () => ({
  useFormValidation: jest.fn(),
  loginFormSchema: {},
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockUseFormValidation = useFormValidation as jest.MockedFunction<
  typeof useFormValidation
>;

describe('LoginPage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: mockRefresh,
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });

    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
      has: jest.fn().mockReturnValue(false),
      getAll: jest.fn().mockReturnValue([]),
      keys: jest.fn().mockReturnValue([]),
      values: jest.fn().mockReturnValue([]),
      entries: jest.fn().mockReturnValue([]),
      forEach: jest.fn(),
      toString: jest.fn().mockReturnValue(''),
    } as any);

    mockUseFormValidation.mockReturnValue({
      values: { email: '', password: '' },
      errors: {},
      isSubmitting: false,
      handleChange: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
      validateField: jest.fn(),
    });

    jest.clearAllMocks();
  });

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('Bible Quiz App')).toBeInTheDocument();
    expect(screen.getByText('Faça login para continuar')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('should show form values', () => {
    mockUseFormValidation.mockReturnValue({
      values: { email: 'test@example.com', password: 'password123' },
      errors: {},
      isSubmitting: false,
      handleChange: jest.fn(),
      isValid: true,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      validateField: jest.fn(),
    });

    render(<LoginPage />);

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
  });

  it('should show validation errors', () => {
    mockUseFormValidation.mockReturnValue({
      values: { email: '', password: '' },
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
      errors: {
        email: 'Email é obrigatório',
        password: 'Senha é obrigatória',
      },
      isSubmitting: false,
      handleChange: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      validateField: jest.fn(),
    });

    render(<LoginPage />);

    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
  });

  it('should show loading state when submitting', () => {
    mockUseFormValidation.mockReturnValue({
      values: { email: '', password: '' },
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
      errors: {},
      isSubmitting: true,
      handleChange: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      validateField: jest.fn(),
    });

    render(<LoginPage />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Entrando...')).toBeInTheDocument();
  });

  it('should call handleChange when input values change', () => {
    const mockHandleChange = jest.fn();

    mockUseFormValidation.mockReturnValue({
      values: { email: '', password: '' },
      errors: {},
      isSubmitting: false,
      handleChange: mockHandleChange,
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      validateField: jest.fn(),
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should handle form submission', () => {
    const mockHandleSubmit = jest.fn();
    mockUseFormValidation.mockReturnValue({
      values: { email: 'test@example.com', password: 'password123' },
      errors: {},
      isSubmitting: false,
      isValid: true,
      handleChange: jest.fn(),
      handleSubmit: mockHandleSubmit,
      setFieldError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateField: jest.fn(),
      validateAll: jest.fn(),
    });

    render(<LoginPage />);

    const form = document.querySelector('form');
    fireEvent.submit(form!);
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('should have link to register page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByText('Registre-se aqui');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should apply error styling to inputs with errors', () => {
    mockUseFormValidation.mockReturnValue({
      values: { email: '', password: '' },
      errors: {
        email: 'Email é obrigatório',
        password: 'Senha é obrigatória',
      },
      isSubmitting: false,
      isValid: false,
      handleChange: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateField: jest.fn(),
      validateAll: jest.fn(),
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveClass('border-red-300');
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import RegisterPage from '../app/register/page';
import { useFormValidation } from '../hooks/useFormValidation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock useFormValidation hook
jest.mock('../hooks/useFormValidation', () => ({
  useFormValidation: jest.fn(),
  registerFormSchema: {},
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

describe('RegisterPage', () => {
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
      values: { name: '', email: '', password: '', confirmPassword: '' },
      errors: {},
      isSubmitting: false,
      handleChange: jest.fn(),
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      validateField: jest.fn(),
    });

    jest.clearAllMocks();
  });

  it('should render register form', () => {
    render(<RegisterPage />);

    expect(screen.getByText('Bible Quiz App')).toBeInTheDocument();
    expect(screen.getByText('Crie sua conta para começar')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /criar conta/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Já tem uma conta?')).toBeInTheDocument();
  });

  it('should show form values', () => {
    mockUseFormValidation.mockReturnValue({
      values: {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
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

    render(<RegisterPage />);

    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
    expect(screen.getByDisplayValue('joao@example.com')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('password123')).toHaveLength(2);
  });

  it('should show validation errors', () => {
    mockUseFormValidation.mockReturnValue({
      values: { name: '', email: '', password: '', confirmPassword: '' },
      errors: {
        name: 'Nome é obrigatório',
        email: 'Email é obrigatório',
        password: 'Senha é obrigatória',
        confirmPassword: 'Confirmação de senha é obrigatória',
      },
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

    render(<RegisterPage />);

    expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
    expect(
      screen.getByText('Confirmação de senha é obrigatória')
    ).toBeInTheDocument();
  });

  it('should show loading state when submitting', () => {
    mockUseFormValidation.mockReturnValue({
      values: { name: '', email: '', password: '', confirmPassword: '' },
      errors: {},
      isSubmitting: true,
      handleChange: jest.fn(),
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      validateField: jest.fn(),
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
    });

    render(<RegisterPage />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Criando conta...')).toBeInTheDocument();
  });

  it('should call handleChange when input values change', () => {
    const mockHandleChange = jest.fn();

    mockUseFormValidation.mockReturnValue({
      values: { name: '', email: '', password: '', confirmPassword: '' },
      errors: {},
      isSubmitting: false,
      handleChange: mockHandleChange,
      handleSubmit: jest.fn(),
      setFieldError: jest.fn(),
      validateField: jest.fn(),
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
    });

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Nome');
    fireEvent.change(nameInput, { target: { value: 'João Silva' } });

    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should call handleSubmit when form is submitted', () => {
    const mockHandleSubmit = jest.fn();

    mockUseFormValidation.mockReturnValue({
      values: {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      },
      errors: {},
      isSubmitting: false,
      handleChange: jest.fn(),
      handleSubmit: mockHandleSubmit,
      setFieldError: jest.fn(),
      validateField: jest.fn(),
      isValid: false,
      clearErrors: jest.fn(),
      reset: jest.fn(),
      validateAll: jest.fn(),
    });

    render(<RegisterPage />);

    const form = document.querySelector('form');
    fireEvent.submit(form!);
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('should have link to login page', () => {
    render(<RegisterPage />);

    const loginLink = screen.getByText('Faça login aqui');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should apply error styling to invalid fields', () => {
    mockUseFormValidation.mockReturnValue({
      values: {
        name: '',
        email: 'invalid-email',
        password: '',
        confirmPassword: '',
      },
      errors: { name: 'Nome é obrigatório', email: 'Email inválido' },
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

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText('Nome');
    const emailInput = screen.getByLabelText('Email');

    expect(nameInput).toHaveClass('border-red-300');
    expect(emailInput).toHaveClass('border-red-300');
  });

  it('should render password field with placeholder', () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText('Senha');
    expect(passwordInput).toHaveAttribute('placeholder', 'Mínimo 6 caracteres');
  });
});

import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { useFormValidation } from '../hooks/useFormValidation';

// Test schema
const testSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type TestFormData = z.infer<typeof testSchema>;

const initialValues: TestFormData = {
  email: '',
  password: '',
};

describe('useFormValidation', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should initialize with empty values and no errors', () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    expect(result.current.values).toEqual({ email: '', password: '' });
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('should update values when handleChange is called', () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should validate fields and show errors', () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange('email', 'invalid-email');
      result.current.validateField('email');
      result.current.handleChange('password', '123');
      result.current.validateField('password');
    });

    expect(result.current.errors.email).toBe('Email inválido');
    expect(result.current.errors.password).toBe(
      'Senha deve ter pelo menos 6 caracteres'
    );
  });

  it('should clear errors when valid values are provided', () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    // First set invalid values and validate
    act(() => {
      result.current.handleChange('email', 'invalid-email');
      result.current.validateField('email');
      result.current.handleChange('password', '123');
      result.current.validateField('password');
    });

    expect(result.current.errors.email).toBe('Email inválido');
    expect(result.current.errors.password).toBe(
      'Senha deve ter pelo menos 6 caracteres'
    );

    // Then set valid values - errors should clear automatically
    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
    });

    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeUndefined();
  });

  it('should call onSubmit with valid data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
    });

    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should not call onSubmit with invalid data', async () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange('email', 'invalid-email');
      result.current.handleChange('password', '123');
    });

    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle submission errors', async () => {
    const error = new Error('Submission failed');
    mockOnSubmit.mockRejectedValue(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
    });

    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    await act(async () => {
      await result.current.handleSubmit(mockEvent);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Erro no envio do formulário:',
      error
    );
    expect(result.current.isSubmitting).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should set isSubmitting to true during submission', async () => {
    let resolveSubmit: () => void;
    const submitPromise = new Promise<void>(resolve => {
      resolveSubmit = resolve;
    });
    mockOnSubmit.mockReturnValue(submitPromise);

    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        initialValues,
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
      result.current.handleChange('password', 'password123');
    });

    const mockEvent = {
      preventDefault: jest.fn(),
    } as any;

    // Start submission
    act(() => {
      result.current.handleSubmit(mockEvent);
    });

    expect(result.current.isSubmitting).toBe(true);

    // Complete submission
    await act(async () => {
      resolveSubmit!();
      await submitPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});

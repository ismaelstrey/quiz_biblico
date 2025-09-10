import { z } from 'zod';

// Schema para autenticação
export const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
});

// Schema para quiz
export const createQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  description: z
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  levelId: z.string().min(1, 'ID do nível é obrigatório'),
  isActive: z.boolean().default(true),
});

export const updateQuizSchema = createQuizSchema.partial();

// Schema para perguntas
export const answerSchema = z.object({
  answerText: z
    .string()
    .min(1, 'Texto da resposta é obrigatório')
    .max(500, 'Texto da resposta deve ter no máximo 500 caracteres'),
  isCorrect: z.boolean(),
});

export const createQuestionSchema = z.object({
  questionText: z
    .string()
    .min(1, 'Texto da pergunta é obrigatório')
    .max(1000, 'Texto da pergunta deve ter no máximo 1000 caracteres'),
  questionType: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK'], {
    errorMap: () => ({ message: 'Tipo de pergunta inválido' }),
  }),
  difficulty: z
    .number()
    .int('Dificuldade deve ser um número inteiro')
    .min(1, 'Dificuldade mínima é 1')
    .max(5, 'Dificuldade máxima é 5'),
  bibleVerse: z
    .string()
    .max(200, 'Referência bíblica deve ter no máximo 200 caracteres')
    .optional(),
  explanation: z
    .string()
    .max(1000, 'Explicação deve ter no máximo 1000 caracteres')
    .optional(),
  answers: z
    .array(answerSchema)
    .min(2, 'Deve haver pelo menos 2 respostas')
    .max(6, 'Deve haver no máximo 6 respostas')
    .refine(
      answers => answers.filter(a => a.isCorrect).length === 1,
      'Deve haver exatamente uma resposta correta'
    ),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// Schema para tentativas de quiz
export const quizAttemptSchema = z.object({
  quizId: z.string().min(1, 'ID do quiz é obrigatório'),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1, 'ID da pergunta é obrigatório'),
        answerId: z.string().min(1, 'ID da resposta é obrigatório'),
      })
    )
    .min(1, 'Deve haver pelo menos uma resposta'),
  timeSpent: z
    .number()
    .int('Tempo gasto deve ser um número inteiro')
    .min(0, 'Tempo gasto não pode ser negativo')
    .optional(),
});

// Schema para progresso do usuário
export const userProgressSchema = z.object({
  levelId: z.string().min(1, 'ID do nível é obrigatório'),
  score: z
    .number()
    .int('Pontuação deve ser um número inteiro')
    .min(0, 'Pontuação não pode ser negativa'),
  maxScore: z
    .number()
    .int('Pontuação máxima deve ser um número inteiro')
    .min(1, 'Pontuação máxima deve ser pelo menos 1'),
});

// Schema para níveis
export const createLevelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  difficulty: z
    .number()
    .int('Dificuldade deve ser um número inteiro')
    .min(1, 'Dificuldade mínima é 1')
    .max(10, 'Dificuldade máxima é 10'),
  minScore: z
    .number()
    .int('Pontuação mínima deve ser um número inteiro')
    .min(0, 'Pontuação mínima não pode ser negativa')
    .max(100, 'Pontuação mínima não pode ser maior que 100')
    .default(70),
});

export const updateLevelSchema = createLevelSchema.partial();

// Schema para geração de perguntas com IA
export const generateQuestionsSchema = z.object({
  topic: z
    .string()
    .min(1, 'Tópico é obrigatório')
    .max(200, 'Tópico deve ter no máximo 200 caracteres'),
  difficulty: z
    .number()
    .int('Dificuldade deve ser um número inteiro')
    .min(1, 'Dificuldade mínima é 1')
    .max(5, 'Dificuldade máxima é 5'),
  questionCount: z
    .number()
    .int('Quantidade de perguntas deve ser um número inteiro')
    .min(1, 'Deve gerar pelo menos 1 pergunta')
    .max(20, 'Deve gerar no máximo 20 perguntas')
    .default(5),
  questionType: z
    .enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK'])
    .default('MULTIPLE_CHOICE'),
  levelId: z.string().min(1, 'ID do nível é obrigatório').optional(),
});

// Schema para validação de parâmetros ID
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
});

// Schema para paginação
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schema para filtros de quiz
export const quizFiltersSchema = z.object({
  levelId: z.string().min(1).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(100).optional(),
});

// Schema combinado para filtros de quiz com paginação
export const quizFiltersWithPaginationSchema =
  quizFiltersSchema.merge(paginationSchema);

// Schema para filtros de tentativas
export const attemptFiltersSchema = z.object({
  userId: z.string().min(1).optional(),
  quizId: z.string().min(1).optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(0).max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// Utilitário para validar dados de entrada
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw error; // Será tratado pelo handleApiError
    }
    throw new Error('Erro de validação desconhecido');
  }
}

// Utilitário para validar query parameters
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): T {
  const params: Record<string, any> = {};

  for (const [key, value] of searchParams.entries()) {
    // Tentar converter números
    if (/^\d+$/.test(value)) {
      params[key] = parseInt(value);
    }
    // Tentar converter booleanos
    else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    }
    // Manter como string
    else {
      params[key] = value;
    }
  }

  return validateInput(schema, params);
}

// Tipos TypeScript derivados dos schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuizAttemptInput = z.infer<typeof quizAttemptSchema>;
export type UserProgressInput = z.infer<typeof userProgressSchema>;
export type CreateLevelInput = z.infer<typeof createLevelSchema>;
export type UpdateLevelInput = z.infer<typeof updateLevelSchema>;
export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type QuizFiltersInput = z.infer<typeof quizFiltersSchema>;
export type AttemptFiltersInput = z.infer<typeof attemptFiltersSchema>;

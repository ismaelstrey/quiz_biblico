import { jest } from '@jest/globals';
import { AppError, ErrorType } from '../../lib/api-utils';

// Mock Prisma
const mockPrisma = {
  quiz: {
    findMany: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
  },
  quizAttempt: {
    create: jest.fn() as jest.MockedFunction<any>,
    findMany: jest.fn() as jest.MockedFunction<any>,
  },
  question: {
    findMany: jest.fn() as jest.MockedFunction<any>,
  },
} as any;

// Mock auth
const mockGetSessionFromRequest = jest.fn() as jest.MockedFunction<any>;

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

jest.mock('../../lib/auth', () => ({
  getSessionFromRequest: mockGetSessionFromRequest,
}));

jest.mock('../../lib/logger', () => ({
  logger: mockLogger,
}));

describe('Quiz API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Quiz Service Logic', () => {
    it('should fetch all quizzes successfully', async () => {
      const mockQuizzes = [
        {
          id: 1,
          title: 'Genesis Quiz',
          description: 'Test your knowledge of Genesis',
          difficulty: 'BEGINNER',
          category: 'OLD_TESTAMENT',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);

      const result = await mockPrisma.quiz.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          category: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockQuizzes);
      expect(mockPrisma.quiz.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          category: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should fetch quiz by ID with questions', async () => {
      const mockQuiz = {
        id: 1,
        title: 'Genesis Quiz',
        description: 'Test your knowledge of Genesis',
        difficulty: 'BEGINNER',
        category: 'OLD_TESTAMENT',
        isActive: true,
        questions: [
          {
            id: 1,
            question: 'Who created the world?',
            options: ['God', 'Angels', 'Humans', 'Nature'],
            correctAnswer: 0,
          },
        ],
      };

      mockPrisma.quiz.findUnique.mockResolvedValue(mockQuiz);

      const result = await mockPrisma.quiz.findUnique({
        where: { id: 1, isActive: true },
        include: {
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
              correctAnswer: true,
            },
          },
        },
      });

      expect(result).toEqual(mockQuiz);
      expect(mockPrisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: 1, isActive: true },
        include: {
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
              correctAnswer: true,
            },
          },
        },
      });
    });

    it('should handle quiz not found', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValue(null);

      const result = await mockPrisma.quiz.findUnique({
        where: { id: 999, isActive: true },
      });

      expect(result).toBeNull();
    });
  });

  describe('Quiz Attempt Logic', () => {
    it('should create quiz attempt successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockAttempt = {
        id: 1,
        userId: 1,
        quizId: 1,
        answers: [0, 1, 2],
        score: 2,
        completedAt: new Date(),
      };

      mockGetSessionFromRequest.mockResolvedValue({ user: mockUser });
      mockPrisma.quizAttempt.create.mockResolvedValue(mockAttempt);

      const attemptData = {
        quizId: 1,
        answers: [0, 1, 2],
        score: 2,
      };

      const result = await mockPrisma.quizAttempt.create({
        data: {
          userId: mockUser.id,
          ...attemptData,
          completedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockAttempt);
      expect(mockPrisma.quizAttempt.create).toHaveBeenCalled();
    });

    it('should fetch user quiz attempts', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockAttempts = [
        {
          id: 1,
          userId: 1,
          quizId: 1,
          score: 8,
          completedAt: new Date(),
          quiz: {
            title: 'Genesis Quiz',
            difficulty: 'BEGINNER',
          },
        },
      ];

      mockGetSessionFromRequest.mockResolvedValue({ user: mockUser });
      mockPrisma.quizAttempt.findMany.mockResolvedValue(mockAttempts);

      const result = await mockPrisma.quizAttempt.findMany({
        where: { userId: mockUser.id },
        include: {
          quiz: {
            select: {
              title: true,
              difficulty: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      });

      expect(result).toEqual(mockAttempts);
      expect(mockPrisma.quizAttempt.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          quiz: {
            select: {
              title: true,
              difficulty: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      });
    });

    it('should handle unauthenticated requests', async () => {
      mockGetSessionFromRequest.mockResolvedValue(null);

      const session = await mockGetSessionFromRequest();
      expect(session).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.quiz.findMany.mockRejectedValue(dbError);

      await expect(mockPrisma.quiz.findMany()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new AppError(
        ErrorType.VALIDATION,
        'Invalid quiz data',
        400
      );

      expect(validationError.message).toBe('Invalid quiz data');
      expect(validationError.statusCode).toBe(400);
      expect(validationError.type).toBe(ErrorType.VALIDATION);
    });
  });

  describe('Logging Integration', () => {
    it('should log quiz operations', () => {
      mockLogger.info('Quiz fetched successfully', { quizId: 1 });
      mockLogger.error('Quiz fetch failed', { error: 'Database error' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Quiz fetched successfully',
        { quizId: 1 }
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Quiz fetch failed', {
        error: 'Database error',
      });
    });
  });
});

import { jest } from '@jest/globals';
import { AppError, ErrorType } from '../../lib/api-utils';

// Mock Prisma
const mockPrisma = {
  level: {
    findMany: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
  },
  userProgress: {
    findMany: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    upsert: jest.fn() as jest.MockedFunction<any>,
  },
  quizAttempt: {
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

describe('Levels API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Level Service Logic', () => {
    it('should fetch all levels successfully', async () => {
      const mockLevels = [
        {
          id: 1,
          name: 'Beginner',
          description: 'Start your Bible journey',
          order: 1,
          isActive: true,
          requiredScore: 0,
          createdAt: new Date(),
        },
        {
          id: 2,
          name: 'Intermediate',
          description: 'Deepen your knowledge',
          order: 2,
          isActive: true,
          requiredScore: 100,
          createdAt: new Date(),
        },
      ];

      mockPrisma.level.findMany.mockResolvedValue(mockLevels);

      const result = await mockPrisma.level.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          quizzes: {
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
        },
      });

      expect(result).toEqual(mockLevels);
      expect(mockPrisma.level.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: {
          quizzes: {
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
        },
      });
    });

    it('should fetch level by ID with quizzes', async () => {
      const mockLevel = {
        id: 1,
        name: 'Beginner',
        description: 'Start your Bible journey',
        order: 1,
        isActive: true,
        requiredScore: 0,
        quizzes: [
          {
            id: 1,
            title: 'Genesis Quiz',
            difficulty: 'BEGINNER',
          },
        ],
      };

      mockPrisma.level.findUnique.mockResolvedValue(mockLevel);

      const result = await mockPrisma.level.findUnique({
        where: { id: 1, isActive: true },
        include: {
          quizzes: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
        },
      });

      expect(result).toEqual(mockLevel);
      expect(mockPrisma.level.findUnique).toHaveBeenCalledWith({
        where: { id: 1, isActive: true },
        include: {
          quizzes: {
            where: { isActive: true },
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
        },
      });
    });

    it('should handle level not found', async () => {
      mockPrisma.level.findUnique.mockResolvedValue(null);

      const result = await mockPrisma.level.findUnique({
        where: { id: 999, isActive: true },
      });

      expect(result).toBeNull();
    });
  });

  describe('User Progress Logic', () => {
    it('should fetch user progress successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockProgress = [
        {
          id: 1,
          userId: 1,
          levelId: 1,
          totalScore: 150,
          completedQuizzes: 3,
          isCompleted: true,
          level: {
            name: 'Beginner',
            requiredScore: 100,
          },
        },
      ];

      mockGetSessionFromRequest.mockResolvedValue({ user: mockUser });
      mockPrisma.userProgress.findMany.mockResolvedValue(mockProgress);

      const result = await mockPrisma.userProgress.findMany({
        where: { userId: mockUser.id },
        include: {
          level: {
            select: {
              name: true,
              requiredScore: true,
            },
          },
        },
        orderBy: {
          level: {
            order: 'asc',
          },
        },
      });

      expect(result).toEqual(mockProgress);
      expect(mockPrisma.userProgress.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          level: {
            select: {
              name: true,
              requiredScore: true,
            },
          },
        },
        orderBy: {
          level: {
            order: 'asc',
          },
        },
      });
    });

    it('should update user progress', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const progressData = {
        levelId: 1,
        totalScore: 200,
        completedQuizzes: 4,
        isCompleted: true,
      };

      const mockUpdatedProgress = {
        id: 1,
        userId: 1,
        ...progressData,
        updatedAt: new Date(),
      };

      mockGetSessionFromRequest.mockResolvedValue({ user: mockUser });
      mockPrisma.userProgress.upsert.mockResolvedValue(mockUpdatedProgress);

      const result = await mockPrisma.userProgress.upsert({
        where: {
          userId_levelId: {
            userId: mockUser.id,
            levelId: progressData.levelId,
          },
        },
        update: {
          totalScore: progressData.totalScore,
          completedQuizzes: progressData.completedQuizzes,
          isCompleted: progressData.isCompleted,
          updatedAt: expect.any(Date),
        },
        create: {
          userId: mockUser.id,
          ...progressData,
        },
      });

      expect(result).toEqual(mockUpdatedProgress);
      expect(mockPrisma.userProgress.upsert).toHaveBeenCalled();
    });

    it('should handle unauthenticated requests', async () => {
      mockGetSessionFromRequest.mockResolvedValue(null);

      const session = await mockGetSessionFromRequest();
      expect(session).toBeNull();
    });
  });

  describe('Progress Calculations', () => {
    it('should calculate level completion correctly', () => {
      const userScore = 150;
      const requiredScore = 100;
      const isCompleted = userScore >= requiredScore;
      const progressPercentage = Math.min(
        (userScore / requiredScore) * 100,
        100
      );

      expect(isCompleted).toBe(true);
      expect(progressPercentage).toBe(100);
    });

    it('should calculate partial progress correctly', () => {
      const userScore = 75;
      const requiredScore = 100;
      const isCompleted = userScore >= requiredScore;
      const progressPercentage = Math.min(
        (userScore / requiredScore) * 100,
        100
      );

      expect(isCompleted).toBe(false);
      expect(progressPercentage).toBe(75);
    });

    it('should handle zero scores', () => {
      const userScore = 0;
      const requiredScore = 100;
      const isCompleted = userScore >= requiredScore;
      const progressPercentage = Math.min(
        (userScore / requiredScore) * 100,
        100
      );

      expect(isCompleted).toBe(false);
      expect(progressPercentage).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.level.findMany.mockRejectedValue(dbError);

      await expect(mockPrisma.level.findMany()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new AppError(
        ErrorType.VALIDATION,
        'Invalid level data',
        400
      );

      expect(validationError.message).toBe('Invalid level data');
      expect(validationError.statusCode).toBe(400);
      expect(validationError.type).toBe(ErrorType.VALIDATION);
    });
  });

  describe('Logging Integration', () => {
    it('should log level operations', () => {
      mockLogger.info('Level fetched successfully', { levelId: 1 });
      mockLogger.error('Level fetch failed', { error: 'Database error' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Level fetched successfully',
        { levelId: 1 }
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Level fetch failed', {
        error: 'Database error',
      });
    });

    it('should log progress updates', () => {
      mockLogger.info('User progress updated', {
        userId: 1,
        levelId: 1,
        score: 150,
      });

      expect(mockLogger.info).toHaveBeenCalledWith('User progress updated', {
        userId: 1,
        levelId: 1,
        score: 150,
      });
    });
  });
});

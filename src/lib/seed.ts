import { prisma } from './prisma';

export async function seedDatabase() {
  try {
    // Criar níveis
    const levels = await Promise.all([
      prisma.level.upsert({
        where: { id: 'level-1' },
        update: {},
        create: {
          id: 'level-1',
          name: 'Iniciante',
          description: 'Para quem está começando a estudar a Bíblia',
          difficulty: 1,
          minScore: 0,
        },
      }),
      prisma.level.upsert({
        where: { id: 'level-2' },
        update: {},
        create: {
          id: 'level-2',
          name: 'Básico',
          description: 'Conhecimentos básicos sobre histórias bíblicas',
          difficulty: 2,
          minScore: 100,
        },
      }),
      prisma.level.upsert({
        where: { id: 'level-3' },
        update: {},
        create: {
          id: 'level-3',
          name: 'Intermediário',
          description: 'Ensinamentos de Jesus e parábolas',
          difficulty: 3,
          minScore: 300,
        },
      }),
      prisma.level.upsert({
        where: { id: 'level-4' },
        update: {},
        create: {
          id: 'level-4',
          name: 'Avançado',
          description: 'Teologia e conhecimentos aprofundados',
          difficulty: 4,
          minScore: 600,
        },
      }),
      prisma.level.upsert({
        where: { id: 'level-5' },
        update: {},
        create: {
          id: 'level-5',
          name: 'Expert',
          description: 'Conhecimento profundo das Escrituras',
          difficulty: 5,
          minScore: 1000,
        },
      }),
    ]);

    // Criar quiz de exemplo para iniciantes
    const exampleQuiz = await prisma.quiz.upsert({
      where: { id: 'quiz-example-1' },
      update: {},
      create: {
        id: 'quiz-example-1',
        title: 'Histórias do Antigo Testamento',
        description:
          'Quiz básico sobre as principais histórias do Antigo Testamento',
        levelId: 'level-1',
        questions: {
          create: [
            {
              questionText: 'Quem foi o primeiro homem criado por Deus?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 1,
              bibleVerse: 'Gênesis 2:7',
              explanation:
                'Adão foi o primeiro homem criado por Deus do pó da terra.',
              answers: {
                create: [
                  { answerText: 'Abraão', isCorrect: false },
                  { answerText: 'Adão', isCorrect: true },
                  { answerText: 'Moisés', isCorrect: false },
                  { answerText: 'Noé', isCorrect: false },
                ],
              },
            },
            {
              questionText: 'Quantos dias Deus levou para criar o mundo?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 1,
              bibleVerse: 'Gênesis 1:31-2:2',
              explanation:
                'Deus criou o mundo em seis dias e descansou no sétimo.',
              answers: {
                create: [
                  { answerText: '5 dias', isCorrect: false },
                  { answerText: '6 dias', isCorrect: true },
                  { answerText: '7 dias', isCorrect: false },
                  { answerText: '8 dias', isCorrect: false },
                ],
              },
            },
            {
              questionText: 'Qual animal a serpente enganou no Jardim do Éden?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 1,
              bibleVerse: 'Gênesis 3:1-6',
              explanation:
                'A serpente enganou Eva, oferecendo-lhe o fruto proibido.',
              answers: {
                create: [
                  { answerText: 'Eva', isCorrect: true },
                  { answerText: 'Adão', isCorrect: false },
                  { answerText: 'Abel', isCorrect: false },
                  { answerText: 'Caim', isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });

    console.log('✅ Banco de dados populado com sucesso!');
    console.log(`📊 Níveis criados: ${levels.length}`);
    console.log(`📝 Quiz de exemplo criado: ${exampleQuiz.title}`);

    return { levels, exampleQuiz };
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  }
}

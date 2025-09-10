import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleQuestions() {
  try {
    console.log('Adicionando perguntas de exemplo...');

    // Buscar níveis existentes
    const levels = await prisma.level.findMany();
    if (levels.length === 0) {
      console.log('Nenhum nível encontrado. Execute o seed primeiro.');
      return;
    }

    const basicLevel = levels.find(l => l.name === 'Iniciante') || levels[0];
    const intermediateLevel =
      levels.find(l => l.name === 'Intermediário') || levels[1] || levels[0];

    // Quiz 1: Gênesis - Nível Iniciante
    const quiz1 = await prisma.quiz.create({
      data: {
        title: 'Gênesis - Criação e Patriarcas',
        description: 'Perguntas sobre os primeiros capítulos de Gênesis',
        levelId: basicLevel.id,
        questions: {
          create: [
            {
              questionText: 'Quantos dias Deus levou para criar o mundo?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 1,
              bibleVerse: 'Gênesis 1:31-2:2',
              explanation:
                'Deus criou o mundo em 6 dias e descansou no sétimo dia.',
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
              questionText: 'Qual foi o primeiro homem criado por Deus?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 1,
              bibleVerse: 'Gênesis 2:7',
              explanation:
                'Adão foi o primeiro homem criado por Deus do pó da terra.',
              answers: {
                create: [
                  { answerText: 'Abraão', isCorrect: false },
                  { answerText: 'Adão', isCorrect: true },
                  { answerText: 'Noé', isCorrect: false },
                  { answerText: 'Moisés', isCorrect: false },
                ],
              },
            },
            {
              questionText: 'Deus criou o homem à sua imagem e semelhança.',
              questionType: 'TRUE_FALSE',
              difficulty: 1,
              bibleVerse: 'Gênesis 1:27',
              explanation: 'Sim, Deus criou o homem à sua imagem e semelhança.',
              answers: {
                create: [
                  { answerText: 'Verdadeiro', isCorrect: true },
                  { answerText: 'Falso', isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });

    // Quiz 2: Novo Testamento - Nível Intermediário
    const quiz2 = await prisma.quiz.create({
      data: {
        title: 'Jesus Cristo - Vida e Ministério',
        description: 'Perguntas sobre a vida e ministério de Jesus',
        levelId: intermediateLevel.id,
        questions: {
          create: [
            {
              questionText: 'Em qual cidade Jesus nasceu?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 2,
              bibleVerse: 'Mateus 2:1',
              explanation: 'Jesus nasceu em Belém da Judéia.',
              answers: {
                create: [
                  { answerText: 'Nazaré', isCorrect: false },
                  { answerText: 'Jerusalém', isCorrect: false },
                  { answerText: 'Belém', isCorrect: true },
                  { answerText: 'Cafarnaum', isCorrect: false },
                ],
              },
            },
            {
              questionText: 'Quantos discípulos Jesus escolheu?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 2,
              bibleVerse: 'Mateus 10:1-4',
              explanation: 'Jesus escolheu 12 discípulos para segui-lo.',
              answers: {
                create: [
                  { answerText: '10', isCorrect: false },
                  { answerText: '12', isCorrect: true },
                  { answerText: '7', isCorrect: false },
                  { answerText: '70', isCorrect: false },
                ],
              },
            },
            {
              questionText:
                'Jesus ressuscitou ao terceiro dia após sua crucificação.',
              questionType: 'TRUE_FALSE',
              difficulty: 2,
              bibleVerse: '1 Coríntios 15:4',
              explanation:
                'Sim, Jesus ressuscitou ao terceiro dia conforme as Escrituras.',
              answers: {
                create: [
                  { answerText: 'Verdadeiro', isCorrect: true },
                  { answerText: 'Falso', isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });

    // Quiz 3: Salmos - Nível Iniciante
    const quiz3 = await prisma.quiz.create({
      data: {
        title: 'Salmos - Louvor e Adoração',
        description: 'Perguntas sobre os Salmos mais conhecidos',
        levelId: basicLevel.id,
        questions: {
          create: [
            {
              questionText: 'Quem escreveu a maioria dos Salmos?',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 1,
              bibleVerse: 'Salmos (vários)',
              explanation: 'Davi escreveu a maioria dos Salmos.',
              answers: {
                create: [
                  { answerText: 'Salomão', isCorrect: false },
                  { answerText: 'Davi', isCorrect: true },
                  { answerText: 'Moisés', isCorrect: false },
                  { answerText: 'Asafe', isCorrect: false },
                ],
              },
            },
            {
              questionText:
                'Complete: "O Senhor é o meu _______, nada me faltará."',
              questionType: 'MULTIPLE_CHOICE',
              difficulty: 1,
              bibleVerse: 'Salmos 23:1',
              explanation:
                'O Salmo 23:1 diz: "O Senhor é o meu pastor, nada me faltará."',
              answers: {
                create: [
                  { answerText: 'Rei', isCorrect: false },
                  { answerText: 'Pastor', isCorrect: true },
                  { answerText: 'Amigo', isCorrect: false },
                  { answerText: 'Guia', isCorrect: false },
                ],
              },
            },
            {
              questionText: 'O Salmo 23 é conhecido como o "Salmo do Pastor".',
              questionType: 'TRUE_FALSE',
              difficulty: 1,
              bibleVerse: 'Salmos 23',
              explanation:
                'Sim, o Salmo 23 é amplamente conhecido como o "Salmo do Pastor".',
              answers: {
                create: [
                  { answerText: 'Verdadeiro', isCorrect: true },
                  { answerText: 'Falso', isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });

    console.log('✅ Perguntas de exemplo adicionadas com sucesso!');
    console.log(`Quiz 1: ${quiz1.title} (ID: ${quiz1.id})`);
    console.log(`Quiz 2: ${quiz2.title} (ID: ${quiz2.id})`);
    console.log(`Quiz 3: ${quiz3.title} (ID: ${quiz3.id})`);
  } catch (error) {
    console.error('❌ Erro ao adicionar perguntas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleQuestions();

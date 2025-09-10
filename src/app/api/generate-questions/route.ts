import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/generate-questions - Gerar perguntas bíblicas com IA
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      topic,
      difficulty,
      questionCount = 5,
      questionType = 'MULTIPLE_CHOICE',
      levelId,
    } = body;

    if (!topic || !difficulty) {
      return NextResponse.json(
        { error: 'Tópico e dificuldade são obrigatórios' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API OpenAI não configurada' },
        { status: 500 }
      );
    }

    // Prompt para gerar perguntas bíblicas
    const prompt = `
Gere ${questionCount} perguntas bíblicas sobre o tópico "${topic}" com nível de dificuldade ${difficulty} (1-5, onde 1 é iniciante e 5 é expert).

Cada pergunta deve:
- Ser baseada em versículos bíblicos específicos
- Incluir a referência bíblica
- Ter 4 alternativas (A, B, C, D) sendo apenas uma correta
- Incluir uma breve explicação da resposta correta
- Ser apropriada para o nível de dificuldade especificado

Formato de resposta (JSON):
{
  "questions": [
    {
      "questionText": "Pergunta aqui?",
      "bibleVerse": "Livro capítulo:versículo",
      "difficulty": ${difficulty},
      "explanation": "Explicação da resposta correta",
      "answers": [
        { "answerText": "Alternativa A", "isCorrect": false },
        { "answerText": "Alternativa B", "isCorrect": true },
        { "answerText": "Alternativa C", "isCorrect": false },
        { "answerText": "Alternativa D", "isCorrect": false }
      ]
    }
  ]
}

Tópicos sugeridos para diferentes níveis:
- Nível 1-2: Histórias básicas, personagens principais, eventos conhecidos
- Nível 3: Ensinamentos de Jesus, parábolas, milagres
- Nível 4-5: Teologia, profecias, detalhes históricos, genealogias

Responda APENAS com o JSON válido, sem texto adicional.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em Bíblia que cria perguntas educativas e precisas sobre temas bíblicos. Sempre forneça respostas em formato JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('Resposta vazia da OpenAI');
    }

    let generatedQuestions;
    try {
      generatedQuestions = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', responseText);
      throw new Error('Resposta inválida da IA');
    }

    // Se levelId foi fornecido, criar um quiz automaticamente
    if (levelId && generatedQuestions.questions) {
      const quiz = await prisma.quiz.create({
        data: {
          title: `Quiz: ${topic}`,
          description: `Quiz gerado automaticamente sobre ${topic} (Nível ${difficulty})`,
          levelId,
          questions: {
            create: generatedQuestions.questions.map((q: any) => ({
              questionText: q.questionText,
              questionType: questionType,
              difficulty: q.difficulty || difficulty,
              bibleVerse: q.bibleVerse,
              explanation: q.explanation,
              answers: {
                create: q.answers,
              },
            })),
          },
        },
        include: {
          questions: {
            include: {
              answers: true,
            },
          },
          level: true,
        },
      });

      return NextResponse.json({
        questions: generatedQuestions.questions,
        quiz,
        message: 'Perguntas geradas e quiz criado com sucesso',
      });
    }

    return NextResponse.json({
      questions: generatedQuestions.questions,
      message: 'Perguntas geradas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao gerar perguntas:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar perguntas com IA',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

import { seedDatabase } from '../src/lib/seed';

async function main() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    await seedDatabase();
    console.log('✅ Seed concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  }
}

main();

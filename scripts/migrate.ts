import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Aplicando migrações e índices...');

  try {
    // Verificar se as tabelas existem
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('musics', 'weekly_repertoire', 'admins')
    `;

    console.log('📊 Tabelas encontradas:', tables);

    // Criar índices se não existirem
    console.log('🔍 Criando índices para otimização...');

    // Índices para a tabela musics
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_musics_title_artist ON musics (title, artist);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_musics_is_new_of_week ON musics (is_new_of_week);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_musics_created_at ON musics (created_at);
    `;

    // Índices para a tabela weekly_repertoire
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_weekly_repertoire_position ON weekly_repertoire (position);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_weekly_repertoire_week_start ON weekly_repertoire (week_start);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_weekly_repertoire_music_id ON weekly_repertoire (music_id);
    `;

    console.log('✅ Índices criados com sucesso!');

    // Verificar estatísticas das tabelas
    const musicCount = await prisma.music.count();
    const repertoireCount = await prisma.weeklyRepertoire.count();

    console.log('📈 Estatísticas das tabelas:');
    console.log(`   - Músicas: ${musicCount}`);
    console.log(`   - Itens do repertório: ${repertoireCount}`);

    // Verificar performance das consultas
    console.log('⚡ Testando performance das consultas...');

    const startTime = Date.now();
    await prisma.music.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const queryTime = Date.now() - startTime;

    console.log(`   - Tempo da consulta de músicas: ${queryTime}ms`);

    const startTime2 = Date.now();
    await prisma.weeklyRepertoire.findMany({
      include: {
        music: true,
      },
      orderBy: [
        {
          music: {
            isNewOfWeek: 'desc',
          },
        },
        {
          position: 'asc',
        },
      ],
    });
    const queryTime2 = Date.now() - startTime2;

    console.log(`   - Tempo da consulta do repertório: ${queryTime2}ms`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  }); 
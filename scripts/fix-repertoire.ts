import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando e corrigindo problemas no repertório...');

  try {
    // Verificar músicas existentes
    const musicCount = await prisma.music.count();
    console.log(`📚 Total de músicas no banco: ${musicCount}`);

    if (musicCount === 0) {
      console.log('❌ Não há músicas no banco. Adicione músicas primeiro.');
      return;
    }

    // Verificar repertório atual
    const currentRepertoire = await prisma.weeklyRepertoire.findMany({
      include: {
        music: true,
      },
      orderBy: { position: 'asc' },
    });

    console.log(`🎵 Repertório atual: ${currentRepertoire.length} itens`);

    // Verificar problemas comuns
    const issues = [];

    // 1. Verificar se há músicas duplicadas no repertório
    const musicIds = currentRepertoire.map(item => item.musicId);
    const duplicateMusicIds = musicIds.filter((id, index) => musicIds.indexOf(id) !== index);
    
    if (duplicateMusicIds.length > 0) {
      issues.push(`Músicas duplicadas no repertório: ${duplicateMusicIds.length}`);
      console.log(`⚠️ Músicas duplicadas encontradas: ${duplicateMusicIds.length}`);
    }

    // 2. Verificar se há posições duplicadas
    const positions = currentRepertoire.map(item => item.position);
    const duplicatePositions = positions.filter((pos, index) => positions.indexOf(pos) !== index);
    
    if (duplicatePositions.length > 0) {
      issues.push(`Posições duplicadas no repertório: ${duplicatePositions.length}`);
      console.log(`⚠️ Posições duplicadas encontradas: ${duplicatePositions.length}`);
    }

    // 3. Verificar se há músicas que não existem mais
    const existingMusicIds = await prisma.music.findMany({
      select: { id: true },
    });
    const existingIds = existingMusicIds.map(m => m.id);
    const invalidMusicIds = musicIds.filter(id => !existingIds.includes(id));
    
    if (invalidMusicIds.length > 0) {
      issues.push(`Músicas inválidas no repertório: ${invalidMusicIds.length}`);
      console.log(`⚠️ Músicas inválidas encontradas: ${invalidMusicIds.length}`);
    }

    // 4. Verificar se há música nova da semana
    const newOfWeekMusic = await prisma.music.findFirst({
      where: { isNewOfWeek: true },
      select: { id: true, title: true },
    });

    if (newOfWeekMusic) {
      console.log(`⭐ Música nova da semana: ${newOfWeekMusic.title}`);
      
      // Verificar se está na posição 1
      const newOfWeekInRepertoire = currentRepertoire.find(item => item.musicId === newOfWeekMusic.id);
      if (newOfWeekInRepertoire && newOfWeekInRepertoire.position !== 1) {
        issues.push('Música nova da semana não está na posição 1');
        console.log(`⚠️ Música nova da semana não está na posição 1 (atual: ${newOfWeekInRepertoire.position})`);
      }
    } else {
      console.log('ℹ️ Nenhuma música nova da semana definida');
    }

    // Se não há problemas, mostrar status
    if (issues.length === 0) {
      console.log('✅ Repertório está em ordem!');
      
      // Mostrar detalhes do repertório
      console.log('\n📋 Detalhes do repertório:');
      currentRepertoire.forEach(item => {
        const isNewOfWeek = item.music.isNewOfWeek ? ' ⭐' : '';
        console.log(`   ${item.position}. ${item.music.title}${item.music.artist ? ` - ${item.music.artist}` : ''}${isNewOfWeek}`);
      });
      
      return;
    }

    // Mostrar problemas encontrados
    console.log('\n❌ Problemas encontrados:');
    issues.forEach(issue => console.log(`   - ${issue}`));

    // Perguntar se deve corrigir automaticamente
    console.log('\n🛠️ Deseja corrigir automaticamente? (y/n)');
    
    // Em um script real, você pode usar readline ou process.stdin
    // Por enquanto, vamos assumir que sim e corrigir
    console.log('🔄 Corrigindo automaticamente...');

    // Limpar repertório atual
    await prisma.weeklyRepertoire.deleteMany();
    console.log('🗑️ Repertório anterior limpo');

    // Gerar novo repertório
    const weekStart = new Date();
    const repertoireData = [];

    // Posição 1: Música nova da semana (se existir)
    if (newOfWeekMusic) {
      repertoireData.push({
        musicId: newOfWeekMusic.id,
        position: 1,
        isManual: false,
        weekStart,
      });
      console.log(`1️⃣ Posição 1: ${newOfWeekMusic.title} (Nova da Semana)`);
    }

    // Buscar outras músicas para preencher as posições restantes
    const otherMusics = await prisma.music.findMany({
      where: newOfWeekMusic ? { id: { not: newOfWeekMusic.id } } : {},
      orderBy: [
        { createdAt: 'desc' }, // Músicas mais recentes primeiro
      ],
      take: 6 - (newOfWeekMusic ? 1 : 0), // Preencher até 6 posições
      select: { id: true, title: true, artist: true },
    });

    // Adicionar outras músicas
    const positionsToFill = newOfWeekMusic ? [2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6];
    
    otherMusics.forEach((music, index) => {
      const position = positionsToFill[index];
      repertoireData.push({
        musicId: music.id,
        position,
        isManual: false,
        weekStart,
      });
      console.log(`${position}️⃣ Posição ${position}: ${music.title}${music.artist ? ` - ${music.artist}` : ''}`);
    });

    // Criar o novo repertório
    await prisma.weeklyRepertoire.createMany({
      data: repertoireData,
    });

    console.log(`✅ Novo repertório criado com ${repertoireData.length} músicas`);

    // Verificar o resultado
    const newRepertoire = await prisma.weeklyRepertoire.findMany({
      where: { weekStart },
      include: {
        music: {
          select: {
            id: true,
            title: true,
            artist: true,
            isNewOfWeek: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    console.log('\n🎉 Repertório corrigido com sucesso!');
    console.log('\n📋 Novo repertório:');
    newRepertoire.forEach(item => {
      const isNewOfWeek = item.music.isNewOfWeek ? ' ⭐' : '';
      console.log(`   ${item.position}. ${item.music.title}${item.music.artist ? ` - ${item.music.artist}` : ''}${isNewOfWeek}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Falha na correção:', error);
    process.exit(1);
  }); 
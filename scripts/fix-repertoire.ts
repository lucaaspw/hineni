import { PrismaClient } from "@prisma/client";
import { generateMonthlyRepertoire } from "../src/lib/repertoire-generate";
import { getWeekStart } from "../src/lib/utils";
import { isNewCatalogMusic } from "../src/lib/music-tags";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando e corrigindo problemas no repertório...");

  try {
    const musicCount = await prisma.music.count();
    console.log(`📚 Total de músicas no banco: ${musicCount}`);

    if (musicCount === 0) {
      console.log("❌ Não há músicas no banco. Adicione músicas primeiro.");
      return;
    }

    const now = new Date();
    const weekStart = getWeekStart(now);

    const currentRepertoire = await prisma.weeklyRepertoire.findMany({
      where: {
        weekStart: { gte: weekStart, lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { music: true },
      orderBy: { position: "asc" },
    });

    console.log(`🎵 Repertório da semana atual: ${currentRepertoire.length} itens`);

    if (currentRepertoire.length > 0) {
      console.log("\n⚠️ Repertório do mês será substituído.");
    }

    const plan = await generateMonthlyRepertoire(prisma, now);

    console.log(
      `\n📋 Mês: ${plan.sundaysCount} domingo(s), ${plan.newMusics.length} novas do mês + ${plan.weeks[0]?.baseMusics.length ?? 0} da base por domingo`
    );
    plan.newMusics.forEach((m, i) =>
      console.log(`   Nova ${i + 1}: ${m.title}`)
    );

    for (const week of plan.weeks) {
      console.log(
        `\n📅 Domingo ${week.sunday.toLocaleDateString("pt-BR")}:`
      );
      week.baseMusics.forEach((m, i) =>
        console.log(`   Base ${i + 1}: ${m.title}`)
      );
    }

    const newRepertoire = await prisma.weeklyRepertoire.findMany({
      where: { weekStart },
      include: { music: true },
      orderBy: { position: "asc" },
    });

    console.log(`\n✅ Semana atual (${weekStart.toLocaleDateString("pt-BR")}):`);
    newRepertoire.forEach((item) => {
      const nova = isNewCatalogMusic(item.music.tags) ? " ⭐ Nova" : "";
      console.log(
        `   ${item.position}. ${item.music.title}${item.music.artist ? ` - ${item.music.artist}` : ""}${nova}`
      );
    });
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

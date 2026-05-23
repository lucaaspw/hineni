import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "../src/lib/prisma";
import { NEW_MUSIC_TAG } from "../src/lib/music-tags";

interface MusicaNovaJson {
  nome: string;
  autor: string;
  link: string;
}

const PLACEHOLDER_LYRICS = "Letra pendente de cadastro.";

async function main() {
  const filePath = join(process.cwd(), "data", "musicas_novas.json");
  const raw = readFileSync(filePath, "utf-8");
  const musicas: MusicaNovaJson[] = JSON.parse(raw);

  console.log(`🎵 Importando ${musicas.length} músicas de ${filePath}...`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const musica of musicas) {
    const existing = await prisma.music.findFirst({
      where: {
        title: { equals: musica.nome, mode: "insensitive" },
        artist: { equals: musica.autor, mode: "insensitive" },
      },
      select: { id: true, tags: true },
    });

    if (existing) {
      const tags = existing.tags.includes(NEW_MUSIC_TAG)
        ? existing.tags
        : [...existing.tags, NEW_MUSIC_TAG];

      if (tags.length === existing.tags.length) {
        console.log(`⏭️  Já existe com tag: ${musica.nome} — ${musica.autor}`);
        skipped++;
        continue;
      }

      await prisma.music.update({
        where: { id: existing.id },
        data: { tags },
      });
      console.log(`🏷️  Tag adicionada: ${musica.nome} — ${musica.autor}`);
      updated++;
      continue;
    }

    await prisma.music.create({
      data: {
        title: musica.nome,
        artist: musica.autor,
        lyrics: PLACEHOLDER_LYRICS,
        externalLink: musica.link,
        tags: [NEW_MUSIC_TAG],
        isNewOfWeek: false,
      },
    });
    console.log(`✅ Criada: ${musica.nome} — ${musica.autor}`);
    created++;
  }

  console.log(
    `\n🎉 Importação concluída: ${created} criadas, ${updated} atualizadas, ${skipped} ignoradas.`
  );
}

main()
  .catch((error) => {
    console.error("❌ Erro na importação:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

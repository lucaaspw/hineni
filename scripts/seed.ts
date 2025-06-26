import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Verificar se já existe um admin
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: "hineni" },
  });

  if (existingAdmin) {
    console.log("✅ Usuário admin já existe");
    return;
  }

  // Criar hash da senha
  const hashedPassword = await bcrypt.hash("hineni25", 12);

  // Criar usuário admin
  const admin = await prisma.admin.create({
    data: {
      username: "hineni",
      password: hashedPassword,
    },
  });

  console.log("✅ Usuário admin criado:", admin.username);

  // Inserir algumas músicas de exemplo
  const sampleMusics = [
    {
      title: "Amazing Grace",
      artist: "John Newton",
      lyrics: `Amazing grace, how sweet the sound
That saved a wretch like me
I once was lost, but now I'm found
Was blind, but now I see`,
      chords: "G C G D\nG C G D\nG C G D\nG C G D",
      isNewOfWeek: false,
    },
    {
      title: "How Great Thou Art",
      artist: "Carl Boberg",
      lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed`,
      chords: "C F C G\nC F C G\nC F C G\nC F C G",
      isNewOfWeek: true,
    },
    {
      title: "It Is Well With My Soul",
      artist: "Horatio Spafford",
      lyrics: `When peace like a river attendeth my way
When sorrows like sea billows roll
Whatever my lot, Thou hast taught me to say
It is well, it is well with my soul`,
      chords: "D A Bm G\nD A Bm G\nD A Bm G\nD A Bm G",
      isNewOfWeek: false,
    },
  ];

  for (const music of sampleMusics) {
    const existingMusic = await prisma.music.findFirst({
      where: { title: music.title },
    });

    if (!existingMusic) {
      await prisma.music.create({
        data: music,
      });
      console.log(`✅ Música criada: ${music.title}`);
    }
  }

  console.log("🎉 Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

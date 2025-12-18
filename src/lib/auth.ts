import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Configurações de autenticação
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET não está definido nas variáveis de ambiente. Configure JWT_SECRET no arquivo .env.local"
  );
}

export const AUTH_CONFIG = {
  jwtSecret: JWT_SECRET,
  tokenExpiry: "24h" as const,
} as const;

// Função para verificar credenciais usando o banco de dados
export async function verifyCredentials(
  username: string,
  password: string
): Promise<boolean> {
  try {
    // Buscar admin no banco de dados
    const admin = await prisma.admin.findUnique({
      where: { username },
      select: { id: true, username: true, password: true },
    });

    if (!admin) {
      return false;
    }

    // Verificar senha usando bcrypt
    const isValidPassword = await bcrypt.compare(password, admin.password);
    return isValidPassword;
  } catch (error) {
    console.error("Erro ao verificar credenciais:", error);
    return false;
  }
}

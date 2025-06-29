// Configurações de autenticação
export const AUTH_CONFIG = {
  // Em produção, essas credenciais devem vir de variáveis de ambiente
  username: process.env.ADMIN_USERNAME || "hineni",
  password: process.env.ADMIN_PASSWORD || "hineni25",
  jwtSecret: process.env.JWT_SECRET || "fallback-secret",
  tokenExpiry: "24h" as const,
} as const;

// Função para verificar credenciais
export function verifyCredentials(username: string, password: string): boolean {
  return username === AUTH_CONFIG.username && password === AUTH_CONFIG.password;
}

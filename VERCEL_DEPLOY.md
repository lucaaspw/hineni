# Deploy na Vercel - Configuração do Prisma

## Problema Resolvido

O erro `PrismaClientInitializationError` ocorre porque o Prisma Client não é gerado automaticamente durante o build na Vercel. Isso foi resolvido com as seguintes configurações:

## Configurações Implementadas

### 1. Script de Build Modificado

No `package.json`, o script de build foi modificado para incluir a geração do Prisma Client:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 2. Arquivo vercel.json

Criado para configurar o build na Vercel:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 3. Configuração do Prisma Client

O arquivo `src/lib/prisma.ts` foi otimizado para produção:

```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
```

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel:

1. **DATABASE_URL**: URL de conexão com o banco PostgreSQL
2. **JWT_SECRET**: Chave secreta para JWT
3. **NEXTAUTH_SECRET**: Chave secreta para NextAuth
4. **NEXTAUTH_URL**: URL da aplicação em produção

## Banco de Dados

Certifique-se de que:

1. O banco PostgreSQL está configurado e acessível
2. As tabelas foram criadas usando `prisma db push` ou `prisma migrate deploy`
3. O usuário admin foi criado (pode usar o script de seed)

## Comandos Úteis

```bash
# Gerar Prisma Client localmente
npx prisma generate

# Fazer push do schema para o banco
npx prisma db push

# Executar seed do banco
npm run db:seed

# Verificar status do banco
npx prisma db pull
```

## Troubleshooting

Se ainda houver problemas:

1. Verifique se o `DATABASE_URL` está correto na Vercel
2. Certifique-se de que o banco está acessível
3. Verifique os logs de build na Vercel
4. Teste localmente com as mesmas variáveis de ambiente

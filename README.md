# Hineni - Sistema de Repertório de Louvores

Sistema moderno para gerenciamento de repertório de músicas para igreja, desenvolvido com Next.js 14, TypeScript, Prisma e Tailwind CSS.

## ✨ Funcionalidades

- 🎵 **Biblioteca de Músicas**: Cadastro e visualização de letras e cifras
- 📅 **Repertório Semanal**: Gerenciamento de 6 músicas por semana
- 🔐 **Área Administrativa**: Login seguro para administradores
- 📱 **PWA Ready**: Funciona offline e pode ser instalado como app
- 🌙 **Tema Escuro/Claro**: Interface adaptável às preferências do usuário
- 🔍 **Busca Inteligente**: Filtro por título e artista
- 📊 **Visualização Completa**: Letras e cifras em abas separadas

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT
- **Validação**: Zod
- **Deploy**: Vercel (recomendado)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd hineni
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hineni"

# JWT
JWT_SECRET="sua-chave-secreta-aqui"

# Admin Credentials
ADMIN_USERNAME="hineni"
ADMIN_PASSWORD="hineni25"
```

4. **Configure o banco de dados**

```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma db push

# (Opcional) Popule com dados de exemplo
npm run db:seed
```

5. **Execute o projeto**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📱 Configuração PWA

Para que o PWA funcione corretamente, você precisa:

1. **Criar os ícones PWA**:

   - Substitua `public/icon-192.png` por uma imagem 192x192px
   - Substitua `public/icon-512.png` por uma imagem 512x512px

2. **Configurar HTTPS** (em produção):
   - O PWA requer HTTPS para funcionar
   - Vercel fornece HTTPS automaticamente

## 🔐 Credenciais Padrão

- **Usuário**: `hineni`
- **Senha**: `hineni25`

⚠️ **Importante**: Altere essas credenciais em produção!

## 📁 Estrutura do Projeto

```
hineni/
├── src/
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── api/            # API Routes
│   │   ├── admin/          # Área administrativa
│   │   ├── louvores/       # Biblioteca de músicas
│   │   └── login/          # Página de login
│   ├── components/         # Componentes React
│   │   └── ui/            # Componentes UI (shadcn/ui)
│   └── lib/               # Utilitários e configurações
├── prisma/                # Schema e migrações do banco
├── public/               # Arquivos estáticos
└── scripts/              # Scripts utilitários
```

## 🎯 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Verificação de código
npm run db:push      # Sincronizar banco
npm run db:seed      # Popular banco com dados
```

## 🔧 Melhorias Implementadas

- ✅ **Instância única do PrismaClient** para melhor performance
- ✅ **Validação com Zod** para dados mais seguros
- ✅ **Configuração centralizada** de autenticação
- ✅ **Tratamento de erros** melhorado
- ✅ **Variáveis de ambiente** organizadas
- ✅ **Documentação** completa

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Se encontrar algum problema ou tiver dúvidas, abra uma issue no repositório.

---

**Hineni** - "Eis-me aqui" - Sistema de Repertório de Louvores 🎵

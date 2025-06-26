# Hineni - Sistema de Repertório de Louvores

Sistema moderno para gerenciamento de repertório de músicas para igreja, desenvolvido com Next.js, TypeScript, Tailwind CSS e Prisma.

## 🚀 Funcionalidades

- **Repertório Semanal**: Visualização das músicas da semana
- **Biblioteca de Louvores**: Catálogo completo de músicas
- **Área Administrativa**: Gerenciamento de músicas e repertório
- **Design Responsivo**: Otimizado para mobile e desktop
- **Tema Claro/Escuro**: Suporte a múltiplos temas
- **PWA**: Instalável como app no celular

## 🛠️ Tecnologias

- **Next.js 14** com Turbopack
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (PostgreSQL)
- **Radix UI**
- **Next Themes**
- **JWT** para autenticação

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npm run db:push

# Inserir dados de exemplo
npm run db:seed

# Iniciar desenvolvimento
npm run dev
```

## 🔐 Credenciais de Acesso

- **Usuário:** `hineni`
- **Senha:** `hineni25`

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento com Turbopack
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm run start

# Banco de dados
npm run db:push
npm run db:seed
```

## 📁 Estrutura do Projeto

```
hineni/
├── src/
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── admin/          # Área administrativa
│   │   ├── api/            # Rotas da API
│   │   ├── louvores/       # Biblioteca de músicas
│   │   └── login/          # Página de login
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes base
│   │   └── ...            # Componentes específicos
│   └── lib/               # Utilitários e configurações
├── prisma/                # Schema e migrations
├── public/                # Arquivos estáticos
└── scripts/               # Scripts auxiliares
```

## 🌟 Recursos Mobile

- **Design Mobile-First**: Interface otimizada para telas pequenas
- **Touch-Friendly**: Botões e elementos adequados para toque
- **PWA Ready**: Instalável como app no celular
- **Performance**: Turbopack para desenvolvimento rápido
- **Responsivo**: Adapta-se a qualquer tamanho de tela

## 🔧 Configurações

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hineni"
JWT_SECRET="seu-secret-jwt-aqui"
```

### Banco de Dados

O projeto usa PostgreSQL com Prisma. Para configurar:

```bash
# Instalar PostgreSQL
# Configurar DATABASE_URL no .env.local
npm run db:push
npm run db:seed
```

## 📱 PWA Features

- **Instalável**: Adicionar à tela inicial
- **Offline**: Cache de recursos estáticos
- **App-like**: Experiência similar a app nativo
- **Notificações**: Suporte a push notifications (futuro)

## 🎨 Temas

O sistema suporta:

- **Tema Claro**: Para ambientes bem iluminados
- **Tema Escuro**: Para ambientes com pouca luz
- **Tema Automático**: Segue preferência do sistema

## 🚀 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Outras Plataformas

O projeto é compatível com:

- Vercel
- Netlify
- Railway
- Heroku
- Docker

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Hineni** - "Eis-me aqui" - Sistema de Repertório de Louvores 🎵

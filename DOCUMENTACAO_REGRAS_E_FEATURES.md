# Hineni - Regras e Features do Projeto

## 1) Visao geral do sistema

O Hineni e uma aplicacao web para gestao de louvores da igreja, com foco em:

- Biblioteca de musicas (letra, cifra e link externo).
- Repertorio semanal de adoracao.
- Area administrativa autenticada.
- Escala de ministracao.
- Experiencia mobile e PWA.

Stack principal:

- Next.js 14 (App Router), React 18, TypeScript.
- Prisma + PostgreSQL.
- JWT via cookie `httpOnly`.
- Validacao com Zod.
- Tailwind CSS + componentes UI customizados.

---

## 2) Features por modulo

### 2.1 Frontoffice (usuarios)

- Pagina inicial (`/`): exibe o repertorio da semana.
- Biblioteca (`/louvores`):
  - Lista todas as musicas.
  - Busca por titulo e artista.
  - Visualizacao de letra e cifra em modal.
  - Abertura de link externo (YouTube/Spotify), quando cadastrado.
- Escala (`/escala`):
  - Mostra a semana atual com destaque.
  - Exibe semanas seguintes com os membros.

### 2.2 Backoffice (admin)

- Login (`/login`) com redirecionamento para painel admin.
- Painel admin (`/admin`):
  - CRUD completo de musicas.
  - Marcacao de "musica nova da semana".
  - Upload de cifra por arquivo `.txt`.
  - Transposicao de tom na visualizacao e no upload.
  - Repertorio semanal:
    - Adicao manual por posicao.
    - Troca de musica no item do repertorio.
    - Geracao automatica do repertorio.

### 2.3 PWA e UX

- Manifest configurado (`public/manifest.json`) com modo `standalone`.
- Metadados de app mobile no layout.
- Suporte a tema claro/escuro/sistema.
- Interface responsiva com varias otimizacoes para mobile e dialog fullscreen.

---

## 3) Regras de negocio

### 3.1 Musicas

- `title` e obrigatorio (min 1, max 200).
- `lyrics` e obrigatoria.
- `artist` e opcional.
- `chords` e opcional.
- `externalLink` e opcional, mas se enviado:
  - Deve ser URL valida.
  - Deve conter dominio de YouTube (`youtube.com`/`youtu.be`) ou Spotify (`spotify.com`/`open.spotify.com`).
- Nao pode existir musica duplicada por combinacao `titulo + artista` (case-insensitive).
- Apenas uma musica pode estar marcada como `isNewOfWeek = true` por vez.

### 3.2 Repertorio semanal

- O repertorio trabalha com **5 posicoes** (`1` a `5`) nas regras atuais de API e UI.
- Nao pode adicionar item fora do intervalo 1..5.
- Nao pode repetir a mesma musica no repertorio da semana atual.
- Nao pode ocupar uma posicao ja utilizada na semana atual.
- Limite de 5 musicas por repertorio.
- Ordenacao de leitura:
  - Primeiro "musica nova da semana".
  - Depois por posicao crescente.

Regra de semana:

- A semana e calculada de **segunda-feira as 03:00** ate a proxima segunda as 03:00.
- Todos os filtros de repertorio semanal usam essa janela.

### 3.3 Geracao automatica do repertorio

- Requer autenticacao.
- Limpa apenas o repertorio da semana atual.
- Se houver musica nova da semana:
  - Ela entra fixa na posicao 1.
  - Outras 4 posicoes sao sorteadas.
- Se nao houver musica nova da semana:
  - Sorteia 5 musicas para posicoes 1..5.
- Embaralhamento usa estrategia Fisher-Yates.
- Se nao houver musicas suficientes, retorna erro 400.

### 3.4 Escala de adoracao

- API de escala suporta:
  - Listagem por ano.
  - Geracao automatica por ano.
  - Exclusao por ano.
- Regras de geracao:
  - Ano minimo: 2024.
  - Nao gera novamente se ja houver escala para o ano (conflito 409).
  - `Lucas` e membro fixo em todos os domingos.
  - Combina 3 vozes femininas por domingo (rotacao com tentativa de evitar repeticoes recentes).

### 3.5 Autenticacao e sessao

- Login valida credenciais contra tabela `Admin` com `bcrypt`.
- Token JWT com expiracao de 24h.
- Token salvo em cookie `auth-token` com:
  - `httpOnly`
  - `sameSite: strict`
  - `secure` em producao
- Rotas protegidas validam esse cookie.
- Logout invalida cookie imediatamente (`maxAge: 0`).

---

## 4) Regras tecnicas e validacoes

### 4.1 Validacao de entrada (Zod)

- `loginSchema`: `username` e `password` obrigatorios.
- `musicSchema`/`musicEditSchema`: garantem formato dos campos e link externo permitido.
- Existe `repertoireSchema` com `positions.length(6)`, mas o fluxo real de API/UI trabalha com 5 posicoes (ver observacoes).

### 4.2 Banco de dados (Prisma)

Modelos principais:

- `Music`
- `WeeklyRepertoire`
- `Admin`
- `Scale`

Regras de schema relevantes:

- `WeeklyRepertoire` tem `@@unique([position, weekStart])`.
- `Music` tem indices para busca/ordenacao (`title`, `artist`, `isNewOfWeek`, `createdAt`).
- `Scale` tem `@@unique([date])` e indices por `year` e `date`.

### 4.3 Cifras e transposicao

- Deteccao automatica de tom original por analise de acordes.
- Transposicao por semitons com suporte a:
  - Notas com sustenido/bemol.
  - Acordes com baixo (`C/E` etc).
- Extracao de letra removendo acordes do texto.
- Visualizacao colore acordes em laranja e evita falsos positivos em palavras.

### 4.4 Cache e performance

- Caches em memoria em rotas e paginas (duracoes variando por modulo).
- Headers de cache em varias respostas.
- Invalidacao de cache apos operacoes mutaveis (POST/PUT/DELETE).
- Configuracao Next com:
  - `reactStrictMode`
  - split de chunks
  - `optimizePackageImports`
  - headers de seguranca.

---

## 5) API - resumo de endpoints

### 5.1 Autenticacao

- `POST /api/auth/login`
- `GET /api/auth/verify`
- `POST /api/auth/logout`

### 5.2 Musicas

- `GET /api/musics`
- `POST /api/musics` (autenticado)
- `PUT /api/musics` (autenticado)
- `DELETE /api/musics?id=...` (autenticado)

### 5.3 Repertorio

- `GET /api/repertoire`
- `POST /api/repertoire`
- `PUT /api/repertoire`
- `DELETE /api/repertoire?id=...`
- `POST /api/repertoire/generate` (autenticado)

### 5.4 Escala

- `GET /api/escala?year=...`
- `POST /api/escala` (autenticado)
- `DELETE /api/escala?year=...` (autenticado)

---

## 6) Regras de interface e navegacao

- Menu principal com: Inicio, Louvores, Escala, Admin, Login.
- Tema claro/escuro/sistema persistido em storage.
- Dialog de visualizacao de musica com abas:
  - Letra
  - Cifra (quando disponivel)
- Acoes rapidas em cards:
  - Ver musica
  - Abrir link externo
  - Editar (quando autenticado, em paginas com suporte)

---

## 7) PWA e operacao

Requisitos praticos:

- `manifest.json` ativo com icones:
  - `/icon-192.png`
  - `/icon-512.png`
- Em producao, precisa HTTPS para instalacao correta.
- Layout possui metadados mobile-web-app para iOS/Android.

Scripts principais:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:migrate`
- `npm run db:fix-repertoire`

---

## 8) Credenciais e seguranca operacional

- Seed cria admin padrao:
  - Usuario: `hineni`
  - Senha: `hineni25` (hash com bcrypt no banco)
- Recomendacao obrigatoria: alterar credenciais padrao em producao.
- Variaveis essenciais:
  - `DATABASE_URL`
  - `JWT_SECRET`

---

## 9) Observacoes importantes (estado atual)

1. **Divergencia de tamanho do repertorio**
   - Regra real do sistema (UI + APIs): 5 musicas.
   - `repertoireSchema` em validacoes indica 6 posicoes.
   - Comentario no schema Prisma ainda cita posicao 1-5 (alinhado com 5).

2. **Escala da pagina vs API**
   - A tela `/escala` consome arquivo estatico `data/escala-2026.json`.
   - Ja existe API dinamica `/api/escala` para banco de dados.
   - Isso indica coexistencia de abordagem estatica e dinamica.

3. **Busca externa de musicas**
   - Existe componente de dialog para `/api/musics/search`.
   - Nao foi encontrado endpoint correspondente no codigo atual.

---

## 10) Conclusao

O projeto possui uma base robusta para operacao de repertorio e administracao de musicas, com autenticacao, validacoes, transposicao de cifras, destaque para musica nova da semana e mecanica de escala. As regras centrais estao bem definidas, com alguns pontos de alinhamento recomendados (especialmente repertorio 5 vs 6 e unificacao da fonte de dados da escala).

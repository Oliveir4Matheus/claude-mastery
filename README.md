# Claude Mastery

Plataforma de aprendizado interativo para dominar o Claude Code. Curso estruturado em 16 capítulos com quizzes, desafios práticos, repetição espaçada (SRS), streaks e certificados verificáveis publicamente.

---

## Conteúdo

- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Capítulos](#capítulos)
- [Rodando localmente](#rodando-localmente)
- [Deploy com Docker](#deploy-com-docker)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [API Reference](#api-reference)

---

## Tecnologias

| Camada | Stack |
|--------|-------|
| Frontend | React 19 + Vite 8 (JSX, sem TypeScript) |
| Backend | FastAPI + SQLAlchemy 2 async + Alembic |
| Banco | PostgreSQL 16 |
| Infra | Docker Compose + Nginx |
| Auth | JWT (Bearer token) |

---

## Arquitetura

```
claude-mastery/
├── src/                     # Frontend React
│   ├── components/          # Componentes PascalCase
│   ├── hooks/               # Custom hooks (useAuth, useSync…)
│   ├── data/
│   │   ├── chapters.js      # Source of truth do conteúdo (estático)
│   │   └── content.js       # Conteúdo HTML dos capítulos
│   └── api.js               # API client centralizado (Bearer JWT)
├── backend/
│   └── app/
│       ├── main.py          # Entrypoint FastAPI
│       ├── routes.py        # Todos os endpoints
│       ├── models.py        # SQLAlchemy models
│       ├── schemas.py       # Pydantic schemas
│       ├── auth.py          # JWT + bcrypt
│       └── database.py      # Sessão async
├── Dockerfile.frontend      # Nginx servindo build do Vite
├── Dockerfile.server        # Python 3.12 + uvicorn
└── docker-compose.yml
```

**Decisões arquiteturais:**
- **State-based routing** — `useState` no `App.jsx` em vez de react-router (SPA simples sem rotas)
- **Sync pattern** — endpoint `/api/sync` carrega todo o estado do usuário de uma vez no boot
- **Conteúdo desacoplado do banco** — `chapters.js` é estático; progresso mapeado por `chapter_id` no PostgreSQL
- **SRS Leitner** — 5 caixas com intervalos `[1, 3, 7, 14, 30]` dias

---

## Funcionalidades

- **Auth** — Registro e login com email/senha, JWT persistido no localStorage
- **Reader** — Leitura de capítulos com persistência de posição (`current_page`)
- **Quiz** — Por capítulo com score, tentativas, feedback explicativo e calibração de confiança
- **SRS** — Spaced Repetition System (Leitner 5 caixas) para revisão de flashcards
- **Streaks** — Rastreamento de dias consecutivos de revisão (atual, maior, total)
- **Desafios** — Checklist de critérios por capítulo com persistência
- **Certificados** — Gerados ao completar capítulos, verificáveis publicamente via `/validate/:code`
- **Journey Map** — Mapa visual pixel-art do progresso nos 4 mundos
- **Perfil** — Progresso geral, streak, certificados emitidos
- **Analytics** — Dashboard com histórico de revisões e desempenho por capítulo

---

## Capítulos

| # | Título | Mundo |
|---|--------|-------|
| 01 | O Loop Agêntico | Fundamentos |
| 02 | Fundamentos de Prompting | Fundamentos |
| 03 | Anatomia do .claude | Fundamentos |
| 04 | CLAUDE.md Avançado | Fundamentos |
| 05 | Permissões e Segurança | Configuração |
| 06 | Slash Commands e Sessões | Configuração |
| 07 | Técnicas Avançadas de Prompting | Configuração |
| 08 | Hooks | Configuração |
| 09 | Skills | Automação |
| 10 | Subagents e Orquestração | Automação |
| 11 | Engenharia de Prompt para Automação | Automação |
| 12 | MCP e Integrações | Automação |
| 13 | Workflows de Produção | Produção |
| 14 | Desenvolvimento Baseado em Evidências | Produção |
| 15 | Git Workflows Avançados | Produção |
| 16 | Spec-Driven e Test-Driven Development | Produção |

---

## Rodando localmente

**Pré-requisitos:** Node 20+, Python 3.12+, PostgreSQL 16

```bash
# 1. Clone e instale dependências
git clone https://github.com/Oliveir4Matheus/claude-mastery.git
cd claude-mastery
npm install

# 2. Configure o ambiente
cp .env.example .env
# Edite .env com sua DATABASE_URL e JWT_SECRET

# 3. Inicie o backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --port 3002 --reload

# 4. Inicie o frontend (em outro terminal)
cd ..
npm run dev
```

Acesse: `http://localhost:5173`

O Vite proxeia `/api` para `localhost:3002` automaticamente.

---

## Deploy com Docker

```bash
# Build e sobe todos os serviços
docker compose up --build -d

# Verificar logs
docker compose logs -f

# Parar
docker compose down
```

A stack sobe 3 containers:
- `frontend` — Nginx na porta 80 servindo o build do React
- `app` — FastAPI na porta 3001
- `db` — PostgreSQL 16 com volume persistente

As migrations do Alembic rodam automaticamente no boot do `app`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `POSTGRES_DB` | Nome do banco | `claude_mastery` |
| `POSTGRES_USER` | Usuário do banco | `mastery` |
| `POSTGRES_PASSWORD` | Senha do banco | string forte |
| `JWT_SECRET` | Segredo para assinar tokens | string longa e aleatória |
| `CORS_ORIGIN` | Origem permitida pelo backend | `https://seudominio.com` |
| `VITE_API_URL` | Prefixo das chamadas de API | `/api` |
| `VITE_APP_URL` | URL pública da aplicação | `https://seudominio.com` |
| `VITE_VALIDATE_URL` | URL base para validação de certificados | `https://seudominio.com/validate` |

> `VITE_*` são build args — precisam estar disponíveis **em tempo de build** do frontend (injetados pelo Docker Compose via `args`).

---

## API Reference

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/api/auth/register` | Registro | — |
| `POST` | `/api/auth/login` | Login | — |
| `GET` | `/api/sync` | Carrega estado completo do usuário | ✓ |
| `POST` | `/api/progress` | Atualiza progresso de capítulo | ✓ |
| `POST` | `/api/page` | Salva página atual do reader | ✓ |
| `POST` | `/api/certificates` | Emite certificado | ✓ |
| `GET` | `/api/certificates` | Lista certificados do usuário | ✓ |
| `GET` | `/api/validate/:code` | Valida certificado publicamente | — |
| `POST` | `/api/srs/init` | Inicializa cards SRS de um capítulo | ✓ |
| `POST` | `/api/srs/review` | Registra resultado de revisão | ✓ |
| `GET` | `/api/srs/due` | Retorna cards para revisar hoje | ✓ |
| `POST` | `/api/challenges` | Marca/desmarca desafio concluído | ✓ |
| `GET` | `/api/health` | Health check | — |

Rate limits: `5 req/hora` no registro, `10 req/min` no login.

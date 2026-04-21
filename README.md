# Whitelabel Learn

Motor whitelabel de microcurso com **retenção**: quizzes com calibração, **SRS Leitner** (5 caixas), retrieval practice inline, streaks, desafios práticos e **certificados verificáveis publicamente**. Você pluga o conteúdo; o motor cuida de tudo que faz o aluno lembrar.

---

## O que você recebe

- **Motor pedagógico** agnóstico a tema — React + FastAPI + Postgres, JWT, Docker
- **3 pontos de configuração** — brand/tema, lista de capítulos, HTML de conteúdo
- **Cookbook** (`cookbook.md`) — wizard que o Claude Code executa para transformar uma fonte (PDF, Markdown, URL) em um curso pronto
- **Infra pronta** — `docker compose up --build` sobe frontend + backend + banco

## Componentes do motor (não mexa sem motivo)

- Quiz com score, tentativas, explicações e *calibração de confiança*
- Retrieval Practice via `RetrievalCheckpoint` injetado no HTML do capítulo
- SRS Leitner 5 caixas (`[1, 3, 7, 14, 30]` dias) — `backend/app/routes.py`
- Streaks (current/longest/total)
- Certificados PNG com código de validação público (`/validate/:code`)
- Journey Map visual com mundos configuráveis
- Perfil com analytics (retenção estimada, pontos fracos, calibração)

## Configurando o seu curso

### Opção 1 — Cookbook (recomendado)

No Claude Code, rode:

```
/cookbook
```

O wizard pergunta o tema, coleta fontes (PDF / URL / texto) e gera os três arquivos de conteúdo. Ele **nunca** toca no motor. Modelos caros são evitados — processamento pesado roda em subagents Sonnet/Haiku.

### Opção 2 — Manual

Edite três arquivos:

| Arquivo | O que contém |
|---|---|
| `src/config/course.config.js` | Nome do curso, tagline, logo, paleta de cores, "mundos" do JourneyMap |
| `src/data/chapters.js` | Lista de capítulos com `quiz`, `checkpoints`, `challenges` |
| `src/data/extracted.json` | HTML renderizável (capa, sumário, conteúdo de cada capítulo) + CSS |

## Rodando localmente

**Requisitos:** Node 20+, Python 3.12+, Postgres 16

```bash
# 1. deps + env
npm install
cp .env.example .env
# edite .env: pelo menos JWT_SECRET, CORS_ORIGIN, POSTGRES_* e VITE_BRAND_*

# 2. backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --port 3002 --reload

# 3. frontend (outro terminal)
cd ..
npm run dev   # http://localhost:5173
```

## Deploy com Docker

```bash
docker compose up --build -d
```

Sobe 3 containers: `frontend` (Nginx), `app` (FastAPI) e `db` (Postgres 16 com volume). Alembic roda as migrations no boot do `app`.

## Variáveis de ambiente

Todas em `.env.example`. Críticas:

| Variável | Descrição |
|---|---|
| `JWT_SECRET` | **obrigatório**. Gere com `openssl rand -hex 32` |
| `CORS_ORIGIN` | **obrigatório**. Domínios permitidos, separados por vírgula |
| `POSTGRES_*` | Credenciais do banco |
| `VITE_BRAND_NAME` | Nome exibido no app, certificado, auth screen |
| `VITE_BRAND_TAGLINE` | Subtítulo na tela de login |
| `VITE_BRAND_STORAGE_PREFIX` | Chave usada no `localStorage` |
| `VITE_BRAND_CERT_WATERMARK` | Texto do topo do certificado |
| `VITE_APP_URL` / `VITE_VALIDATE_URL` | URLs públicas |

As `VITE_*` são **build args** — precisam estar presentes em tempo de build.

## Estrutura

```
.
├── src/
│   ├── config/course.config.js   # único ponto de branding/tema
│   ├── data/
│   │   ├── chapters.js           # capítulos + quiz + challenges
│   │   └── extracted.json        # HTML/CSS do conteúdo
│   ├── components/               # motor (Reader, Quiz, JourneyMap, SRS…)
│   └── hooks/                    # useAuth, useProgress, useSpacedRepetition
├── backend/app/                  # FastAPI, agnóstico ao conteúdo
├── cookbook.md                   # wizard invocado via /cookbook
├── .claude/commands/cookbook.md  # slash command
└── docker-compose.yml
```

## API

| Método | Rota | Auth |
|---|---|---|
| `POST` | `/api/auth/register` | — |
| `POST` | `/api/auth/login` | — |
| `GET` | `/api/sync` | ✓ |
| `POST` | `/api/progress` | ✓ |
| `POST` | `/api/page` | ✓ |
| `POST` | `/api/certificates` | ✓ |
| `GET` | `/api/certificates` | ✓ |
| `GET` | `/api/validate/:code` | — |
| `POST` | `/api/srs/init` | ✓ |
| `POST` | `/api/srs/review` | ✓ |
| `GET` | `/api/srs/due` | ✓ |
| `POST` | `/api/challenges` | ✓ |
| `GET` | `/api/health` | — |

Rate limits: `5 req/hora` em register, `10 req/min` em login.

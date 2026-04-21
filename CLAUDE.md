# CLAUDE.md

Guia para o Claude Code operar neste repositório.

## O que é este projeto

Um **motor whitelabel de microcurso com retenção** (SRS Leitner + retrieval practice + quiz com calibração + streaks + certificados verificáveis). O código é agnóstico ao tema — o **conteúdo do curso** vive em três lugares:

- `src/config/course.config.js` — brand, tema (paleta), mundos do JourneyMap
- `src/data/chapters.js` — lista de capítulos (quiz, checkpoints, challenges)
- `src/data/extracted.json` — HTML renderizável + CSS dos capítulos

Ninguém mais deveria conter strings do curso. Se achar uma, é bug.

## Stack

- Frontend: React 19 + Vite 8 (JSX)
- Backend: FastAPI + SQLAlchemy 2 async + Alembic + PostgreSQL 16
- Auth: JWT Bearer
- Infra: Docker Compose + Nginx

## Comandos essenciais

```bash
npm run dev          # frontend em localhost:5173, proxy /api → localhost:3002
npm run build        # build de produção do frontend
npm run lint
docker compose up --build   # full stack (frontend + backend + db)
```

## Onde encostar

- **Mudar o conteúdo do curso** → `src/config/course.config.js`, `src/data/chapters.js`, `src/data/extracted.json`. Prefira rodar o cookbook (`cookbook.md`) em vez de editar à mão.
- **Mudar o motor** (quiz, SRS, certificados) → `src/components/` e `backend/app/`. Só faça se o bug estiver no motor.
- **Branding** (cores, nome, tagline) → `src/config/course.config.js` + variáveis `VITE_BRAND_*` no `.env`.

## Convenções

- Frontend: componentes em PascalCase em `src/components/`, hooks com prefixo `use` em `src/hooks/`.
- Backend: snake_case, rotas em `backend/app/routes.py`, models em `backend/app/models.py`.
- Chapter IDs (`ch01`, `ch02`, …) são opacos para o backend — mapeiam por string em `progress.chapter_id`.
- O HTML dos capítulos vem de `extracted.json` via `dangerouslySetInnerHTML`; retrieval checkpoints são injetados via seletor CSS (`insertAfter`).

## Restrições do cookbook

- Cookbook **só edita conteúdo e branding**. Nunca adiciona features ao motor.
- Tarefas pesadas de processamento de texto (extração de PDF, geração de quiz a partir de fontes) rodam em subagents em Sonnet/Haiku. Opus apenas para decisões de design de conteúdo. Veja `cookbook.md`.

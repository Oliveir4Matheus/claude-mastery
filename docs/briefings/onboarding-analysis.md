# Onboarding Analysis — claude-mastery
> Gerado em 2026-04-02 via Gemini MCP

## Resumo
Plataforma de aprendizado interativo sobre Claude Code. Curso estruturado em 15 capítulos com quizzes, SRS, streaks e certificados verificáveis. Público: desenvolvedores querendo dominar Claude Code.

## Stack
- **Frontend**: React 19 + Vite 8, JSX (sem TypeScript), nginx em produção
- **Backend**: FastAPI 0.115 + SQLAlchemy 2 (asyncpg) + Alembic + bcrypt + python-jose JWT
- **DB**: PostgreSQL 16
- **Infra**: Docker Compose (3 serviços: frontend, app, db)

## Estrutura de Módulos Chave
```
src/
  App.jsx          — roteamento state-based + entry point
  api.js           — cliente fetch centralizado com JWT
  data/
    chapters.js    — 15 capítulos (source of truth do conteúdo)
    content.js     — wrapper do extracted.json (PDF extraído)
  hooks/
    useAuth.js     — autenticação + persistência JWT
    useProgress.js — progresso por capítulo
    useSpacedRepetition.js — lógica SRS client-side
  components/      — 15+ componentes React

backend/app/
  models.py   — User, Progress, Certificate, SRSCard, Challenge, ReviewStreak
  routes.py   — todos os endpoints REST
  main.py     — FastAPI app + CORS + startup
```

## Features Implementadas (12)
1. Auth JWT (registro, login, /me)
2. Reader com persistência de posição (current_page)
3. Quiz por capítulo (score, tentativas, calibração, question_results JSON)
4. SRS Leitner 5 caixas (intervalos: 1,3,7,14,30 dias)
5. Review Streaks (current/longest/total)
6. Desafios práticos por capítulo
7. Certificados verificáveis (UUID 14 chars)
8. Página pública /validate/:code
9. Perfil unificado
10. Journey Map visual mobile-first
11. Sidebar/TOC navegação
12. Endpoint /sync (boot único — hidrata todo o estado)

## Decisões Arquiteturais
- **State-based routing** (useState no App.jsx) — sem react-router, SPA simples
- **Conteúdo estático** em chapters.js, progresso no DB por chapter_id
- **Sync pattern** — evita N chamadas individuais no carregamento
- **chunkSizeWarningLimit: 4000** — bundle grande por design (extracted.json pesado)
- **SRS server-side** — estado das cards persiste no banco (não localStorage)

## Gaps e Oportunidades (Gemini)
1. **Bundle grande** — Lazy loading dos componentes de capítulo (chunkSize 4000 é alto)
2. **State routing limitado** — `popstate` handler no `App.jsx` pode ter bugs de history; crescimento futuro requer react-router
3. **Sem testes** — Nenhum arquivo Vitest/Pytest identificado; crítico para lógica de SRS e certificação
4. **question_results como JSON genérico** — Pydantic schema rigoroso reduziria risco de corrupção
5. **TypeScript opcional** — chapters.js é grande e complexo; typos difíceis de detectar sem types

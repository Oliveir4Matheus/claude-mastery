# # CLAUDE.md



\## Setup Inicial



\> \*\*SE o arquivo \`.claude/settings.json\` NÃO existir neste projeto, executar o setup antes de qualquer outra tarefa.\*\*



\### Instruções de Setup (executar uma única vez)



\#### Passo 0 — Verificar Gemini CLI e MCP Bridge



1\. Verificar se o Gemini CLI está instalado: \`which gemini\`

&#x20;  \- Se NÃO encontrado → executar: \`npm install -g @google/gemini-cli\`

&#x20;  \- Informar ao dev: "Gemini CLI instalado. Você precisa autenticar rodando \`gemini\` em outro terminal na primeira vez."



2\. Verificar se o MCP bridge do Gemini está registrado: \`claude mcp list\` (ou verificar se existe config de MCP com "gemini")

&#x20;  \- Se NÃO encontrado → perguntar ao dev: \*\*"Qual sua GEMINI\_API\_KEY? (pegue grátis em https\://aistudio.google.com/apikey)"\*\*

&#x20;  \- Com a chave, executar: \`claude mcp add gemini -s user -- env GEMINI\_API\_KEY=CHAVE\_DO\_DEV npx -y @rlabs-inc/gemini-mcp\`

&#x20;  \- Se o dev já tiver a key configurada ou preferir fazer depois, seguir sem bloquear



\#### Passo 1 — Configurar Economia de Tokens



1\. Criar \`.claude/settings.json\`:

\`\`\`json

{

&#x20; "model": "sonnet",

&#x20; "env": {

&#x20;   "MAX\_THINKING\_TOKENS": "10000",

&#x20;   "CLAUDE\_AUTOCOMPACT\_PCT\_OVERRIDE": "50",

&#x20;   "CLAUDE\_CODE\_SUBAGENT\_MODEL": "haiku"

&#x20; }

}

\`\`\`



\#### Passo 2 — Estrutura do Projeto



1\. Criar as pastas:

\`\`\`

mkdir -p docs/specs docs/plans docs/reviews docs/briefings .claude/commands

\`\`\`



2\. Criar \`docs/FEATURE\_INDEX.md\` com tabela vazia:

\`\`\`markdown

\# Índice de Features

\| ID | Nome | Nível | Status | Spec | Plano |

\|----|------|-------|--------|------|-------|

\`\`\`



\#### Passo 3 — Slash Commands SDD



Criar os slash commands em \`.claude/commands/\`:



\*\*sdd-build.md:\*\*

\`\`\`

\---

description: "Fluxo SDD completo: plan → build → review → fix"

\---

Execute o fluxo SDD completo para a spec em $ARGUMENTS:

1\. Leia a spec

2\. Gere plano via Gemini MCP, salve em docs/plans/

3\. Implemente seguindo o plano

4\. /compact

5\. Review via Gemini MCP, salve em docs/reviews/

6\. Aplique correções

7\. Commit (Conventional Commits)

8\. /compact

\`\`\`



\*\*sdd-plan.md:\*\*

\`\`\`

\---

description: "Gera plano SDD via Gemini MCP"

\---

Leia a spec em $ARGUMENTS e use Gemini via MCP para gerar plano.

Salve em docs/plans/ com o mesmo nome da spec.

\`\`\`



\*\*sdd-review\.md:\*\*

\`\`\`

\---

description: "Review via Gemini MCP"

\---

Leia a spec em $ARGUMENTS e o código implementado.

Use Gemini via MCP para review. Salve em docs/reviews/.

Aplique correções. /compact ao final.

\`\`\`



\*\*analyze.md:\*\*

\`\`\`

\---

description: "Analisa codebase via Gemini MCP"

\---

Leia os arquivos em $ARGUMENTS e envie para o Gemini via MCP.

Salve análise em docs/briefings/. /compact ao final.

\`\`\`



\#### Passo 4 — Finalizar



1\. Commit: \`docs: setup SDD + economia de tokens\`

2\. Informar ao dev o que foi criado e que o setup está concluído

3\. Se o Gemini MCP não foi configurado no Passo 0, lembrar o dev de configurar depois



\---



\## Metodologia SDD



Este projeto segue \*\*Spec-Driven Development\*\*: toda feature começa por uma spec ANTES de qualquer código. A spec é a fonte de verdade.



\*\*Ciclo:\*\* \`SPEC → PLAN → BUILD → REVIEW → UPDATE\`



\*\*Hierarquia de specs:\*\*

\- SF (Super-Feature) → módulo/domínio completo

\- FR (Feature) → funcionalidade de negócio

\- SUB (Sub) → sub-funcionalidade

\- ATOM → operação atômica



\*\*Formato de spec\*\* (em \`docs/specs/\`):

\`\`\`markdown

\# \[SF/FR/SUB/ATOM]-\[ID]: \[Nome]

\## Objetivo — o que faz e por quê

\## Regras de Negócio — RN-01, RN-02...

\## Interfaces — entrada, saída, API

\## Dependências — depende de / requerido por

\## Critérios de Aceite — checklist verificável

\`\`\`



\---



\## Economia de Tokens — 7 Camadas



\### 1. Delegação ao Gemini via MCP

Tudo que consome muito contexto vai pro Gemini. Claude Code só executa.

\- \*\*Gemini:\*\* planejamento, arquitetura, análise de codebase grande, code review, documentação, resumo de docs externas

\- \*\*Claude Code:\*\* implementação, debugging, refatoração, testes, filesystem



\### 2. Thinking Tokens

Extended thinking consome até 32k tokens invisíveis por request. Limitado a 10k no settings.json. Se uma tarefa exigir mais, escalar temporariamente com \`/model opus\` e voltar.



\### 3. Model Selection

\- \*\*Sonnet\*\* = default (80%+ das tarefas)

\- \*\*Opus\*\* = só decisões arquiteturais complexas → voltar pra Sonnet imediatamente após

\- \*\*Haiku\*\* = subagents de exploração (automático via settings.json)



\### 4. Compaction

Auto-compact a 50% (default é 95%). Compactar manualmente com \`/compact\` após cada marco (plan concluído, debug resolvido, feature pronta). \`/clear\` entre features diferentes.



\### 5. Subagent Routing

Subagents (exploração, grep, testes) rodam em Haiku automaticamente — 1/3 do custo do Sonnet.



\### 6. Contexto Enxuto

CLAUDE.md curto. MCPs mínimos (desabilitar os não usados). Usar \`@file\` em vez de colar conteúdo.



\### 7. Output

Sempre dizer o que vai fazer e como, de forma concisa. Depois executar. Sem redundância, sem disclaimers, sem repetir contexto já conhecido.



\---



\## Regras



1\. \*\*Spec é lei\*\* — divergências devem ser sinalizadas ao dev

2\. \*\*Sem spec, sem feature grande\*\* — sugerir criação de spec

3\. \*\*Sonnet primeiro\*\* — só escalar pra Opus quando necessário, voltar imediatamente

4\. \*\*Sessão curta\*\* — uma feature por sessão, \`/clear\` entre features

5\. \*\*Compact cedo\*\* — \`/compact\` em todo marco

6\. \*\*Commits atômicos\*\* — um step do plano = um commit

7\. \*\*Testes obrigatórios\*\* — rodar antes e depois de mudanças

8\. \*\*Gemini para contexto, Claude para execução\*\*

9\. \*\*Explica, depois executa\*\* — sempre comunicar o plano de forma concisa antes de agir

10\. \*\*MCPs mínimos\*\* — desabilitar tools não usadas na sessão



\---



\## Protocolo de Sessão



\`\`\`

Início       → /model sonnet (default)

Trabalho     → implementar, debuggar, testar

Marco        → /compact

Precisa Opus → /model opus → resolver → /model sonnet → /compact

Trocar feat  → /clear

Monitorar    → /cost

\`\`\`



\---



\## Onboarding de Projeto



\> \*\*SE a seção "Projeto" abaixo contiver \`\[pendente]\`, executar o onboarding APÓS o setup.\*\*



\### Fase 1 — Varredura (Gemini via MCP)



Antes de qualquer pergunta, analisar o projeto:



1\. Listar estrutura de arquivos e pastas

2\. Ler todos os arquivos de configuração na raiz (package.json, requirements.txt, pyproject.toml, composer.json, Dockerfile, docker-compose.yml, .env.example, Makefile, etc)

3\. Ler README.md e qualquer documentação em docs/

4\. Enviar tudo para o Gemini via MCP pedindo: nome, descrição, stack, estrutura, comandos, convenções, integrações, features existentes, decisões arquiteturais, público-alvo

5\. Montar rascunho da seção "Projeto"



\### Fase 2 — Validação (Dev)



1\. Apresentar ao dev o que foi descoberto

2\. Perguntar APENAS o que ficou faltando ou ambíguo

3\. Confirmar: "Está correto? Quer ajustar algo?"



\### Fase 3 — Persistência



1\. Preencher a seção "Projeto" abaixo

2\. Atualizar docs/FEATURE\_INDEX.md com features identificadas

3\. Salvar análise em docs/briefings/onboarding-analysis.md

4\. Commit: \`docs: onboarding do projeto\`



\### Se projeto vazio (sem código nem config):



Pular Fase 1 e perguntar diretamente:

1\. Nome do projeto?

2\. Descrição em 2-3 frases?

3\. Stack técnica?

4\. Monorepo ou single-app?

5\. Comandos essenciais?

6\. Convenções de código?

7\. Integrações externas?

8\. Público-alvo?

9\. Features planejadas?

10\. Restrições técnicas?



\---



\## Projeto

\- \*\*Nome:\*\* claude-mastery

\- \*\*Descrição:\*\* Plataforma de aprendizado interativo sobre Claude Code. Curso estruturado em 15 capítulos com quizzes, desafios práticos, SRS (repetição espaçada), streaks e certificados verificáveis publicamente.

\- \*\*Stack:\*\* React 19 + Vite 8 (JSX, sem TypeScript) / FastAPI + SQLAlchemy 2 async + PostgreSQL 16 / Docker Compose

\- \*\*Estrutura:\*\* Monorepo — frontend na raiz (`src/`), backend em `backend/app/`, conteúdo estático em `src/data/`

\- \*\*Público-alvo:\*\* Desenvolvedores que querem dominar Claude Code



\### Comandos

\`\`\`bash

\# Dev frontend (proxy /api → localhost:3002)

npm run dev

\# Full stack

docker compose up --build

\# Build frontend

npm run build

\# Lint

npm run lint

\`\`\`



\### Convenções

\- Frontend: JSX (sem TypeScript), componentes PascalCase em `src/components/`

\- Hooks customizados em `src/hooks/` com prefixo `use`

\- Backend: snake\_case, SQLAlchemy models em `models.py`, rotas em `routes.py`

\- Conteúdo dos capítulos é estático em `src/data/chapters.js` (source of truth)

\- API cliente centralizado em `src/api.js` com Bearer JWT



\### Integrações

\- Nenhuma integração externa — sistema autossuficiente

\- Conteúdo extraído de PDF via `src/data/extracted.json` (gerado offline)



\### Decisões Arquiteturais

\- **State-based routing**: `useState` no `App.jsx` em vez de react-router (SPA simples)

\- **Sync pattern**: endpoint `/sync` carrega todo o estado do usuário de uma vez no boot

\- **Conteúdo desacoplado do DB**: chapters.js é estático, progresso mapeado por `chapter_id` no banco

\- **chunkSizeWarningLimit: 4000**: bundle grande por design (conteúdo pesado em `extracted.json`)

\- **SRS Leitner**: 5 caixas com intervalos [1,3,7,14,30] dias definidos em `routes.py`



\### Features

\- Auth (registro/login JWT, `useAuth`)

\- Reader com persistência de posição (`current_page`)

\- Quiz por capítulo com score, tentativas e calibração

\- SRS — Spaced Repetition System (Leitner 5 caixas)

\- Review Streaks (current/longest/total)

\- Desafios práticos por capítulo com checklist de critérios

\- Certificados verificáveis (UUID 14 chars, página pública `/validate/:code`)

\- Perfil unificado (progresso, streak, certificados)

\- Journey Map visual mobile-first

\- Sidebar/TOC navegação

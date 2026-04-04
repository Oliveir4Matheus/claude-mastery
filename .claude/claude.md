# CLAUDE.md

## Setup Inicial

> **SE o arquivo `.claude/settings.json` NÃO existir neste projeto, executar o setup antes de qualquer outra tarefa.**

### Instruções de Setup (executar uma única vez)

1. Criar `.claude/settings.json`:
```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

2. Criar as pastas:
```
mkdir -p docs/specs docs/plans docs/reviews docs/briefings .claude/commands
```

3. Criar `docs/FEATURE_INDEX.md` com tabela vazia:
```markdown
# Índice de Features
| ID | Nome | Nível | Status | Spec | Plano |
|----|------|-------|--------|------|-------|
```

4. Criar os slash commands em `.claude/commands/`:

**sdd-build.md:**
```
---
description: "Fluxo SDD completo: plan → build → review → fix"
---
Execute o fluxo SDD completo para a spec em $ARGUMENTS:
1. Leia a spec
2. Gere plano via Gemini MCP, salve em docs/plans/
3. Implemente seguindo o plano
4. /compact
5. Review via Gemini MCP, salve em docs/reviews/
6. Aplique correções
7. Commit (Conventional Commits)
8. /compact
```

**sdd-plan.md:**
```
---
description: "Gera plano SDD via Gemini MCP"
---
Leia a spec em $ARGUMENTS e use Gemini via MCP para gerar plano.
Salve em docs/plans/ com o mesmo nome da spec.
```

**sdd-review.md:**
```
---
description: "Review via Gemini MCP"
---
Leia a spec em $ARGUMENTS e o código implementado.
Use Gemini via MCP para review. Salve em docs/reviews/.
Aplique correções. /compact ao final.
```

**analyze.md:**
```
---
description: "Analisa codebase via Gemini MCP"
---
Leia os arquivos em $ARGUMENTS e envie para o Gemini via MCP.
Salve análise em docs/briefings/. /compact ao final.
```

5. Commit: `docs: setup SDD + economia de tokens`

6. Informar ao dev que o setup foi concluído e listar o que foi criado.

---

## Metodologia SDD

Este projeto segue **Spec-Driven Development**: toda feature começa por uma spec ANTES de qualquer código. A spec é a fonte de verdade.

**Ciclo:** `SPEC → PLAN → BUILD → REVIEW → UPDATE`

**Hierarquia de specs:**
- SF (Super-Feature) → módulo/domínio completo
- FR (Feature) → funcionalidade de negócio
- SUB (Sub) → sub-funcionalidade
- ATOM → operação atômica

**Formato de spec** (em `docs/specs/`):
```markdown
# [SF/FR/SUB/ATOM]-[ID]: [Nome]
## Objetivo — o que faz e por quê
## Regras de Negócio — RN-01, RN-02...
## Interfaces — entrada, saída, API
## Dependências — depende de / requerido por
## Critérios de Aceite — checklist verificável
```

---

## Economia de Tokens — 7 Camadas

### 1. Delegação ao Gemini via MCP
Tudo que consome muito contexto vai pro Gemini. Claude Code só executa.
- **Gemini:** planejamento, arquitetura, análise de codebase grande, code review, documentação, resumo de docs externas
- **Claude Code:** implementação, debugging, refatoração, testes, filesystem

### 2. Thinking Tokens
Extended thinking consome até 32k tokens invisíveis por request. Limitado a 10k no settings.json. Se uma tarefa exigir mais, escalar temporariamente com `/model opus` e voltar.

### 3. Model Selection
- **Sonnet** = default (80%+ das tarefas)
- **Opus** = só decisões arquiteturais complexas → voltar pra Sonnet imediatamente após
- **Haiku** = subagents de exploração (automático via settings.json)

### 4. Compaction
Auto-compact a 50% (default é 95%). Compactar manualmente com `/compact` após cada marco (plan concluído, debug resolvido, feature pronta). `/clear` entre features diferentes.

### 5. Subagent Routing
Subagents (exploração, grep, testes) rodam em Haiku automaticamente — 1/3 do custo do Sonnet.

### 6. Contexto Enxuto
CLAUDE.md curto. MCPs mínimos (desabilitar os não usados). Usar `@file` em vez de colar conteúdo.

### 7. Output
Sempre dizer o que vai fazer e como, de forma concisa. Depois executar. Sem redundância, sem disclaimers, sem repetir contexto já conhecido.

---

## Regras

1. **Spec é lei** — divergências devem ser sinalizadas ao dev
2. **Sem spec, sem feature grande** — sugerir criação de spec
3. **Sonnet primeiro** — só escalar pra Opus quando necessário, voltar imediatamente
4. **Sessão curta** — uma feature por sessão, `/clear` entre features
5. **Compact cedo** — `/compact` em todo marco
6. **Commits atômicos** — um step do plano = um commit
7. **Testes obrigatórios** — rodar antes e depois de mudanças
8. **Gemini para contexto, Claude para execução**
9. **Explica, depois executa** — sempre comunicar o plano de forma concisa antes de agir
10. **MCPs mínimos** — desabilitar tools não usadas na sessão

---

## Protocolo de Sessão

```
Início       → /model sonnet (default)
Trabalho     → implementar, debuggar, testar
Marco        → /compact
Precisa Opus → /model opus → resolver → /model sonnet → /compact
Trocar feat  → /clear
Monitorar    → /cost
```

---

## Onboarding de Projeto

> **SE a seção "Projeto" abaixo contiver `[pendente]`, executar o onboarding APÓS o setup.**

### Fase 1 — Varredura (Gemini via MCP)

Antes de qualquer pergunta, analisar o projeto:

1. Listar estrutura de arquivos e pastas
2. Ler todos os arquivos de configuração na raiz (package.json, requirements.txt, pyproject.toml, composer.json, Dockerfile, docker-compose.yml, .env.example, Makefile, etc)
3. Ler README.md e qualquer documentação em docs/
4. Enviar tudo para o Gemini via MCP pedindo: nome, descrição, stack, estrutura, comandos, convenções, integrações, features existentes, decisões arquiteturais, público-alvo
5. Montar rascunho da seção "Projeto"

### Fase 2 — Validação (Dev)

1. Apresentar ao dev o que foi descoberto
2. Perguntar APENAS o que ficou faltando ou ambíguo
3. Confirmar: "Está correto? Quer ajustar algo?"

### Fase 3 — Persistência

1. Preencher a seção "Projeto" abaixo
2. Atualizar docs/FEATURE_INDEX.md com features identificadas
3. Salvar análise em docs/briefings/onboarding-analysis.md
4. Commit: `docs: onboarding do projeto`

### Se projeto vazio (sem código nem config):

Pular Fase 1 e perguntar diretamente:
1. Nome do projeto?
2. Descrição em 2-3 frases?
3. Stack técnica?
4. Monorepo ou single-app?
5. Comandos essenciais?
6. Convenções de código?
7. Integrações externas?
8. Público-alvo?
9. Features planejadas?
10. Restrições técnicas?

---

## Projeto

> ⚠️ **SEÇÃO NÃO PREENCHIDA — Executar setup (se necessário) e depois onboarding.**

- **Nome:** [pendente]
- **Descrição:** [pendente]
- **Stack:** [pendente]
- **Estrutura:** [pendente]
- **Público-alvo:** [pendente]

### Comandos
```bash
# [pendente]
```

### Convenções
- [pendente]

### Integrações
- [pendente]

### Decisões Arquiteturais
- [pendente]

### Features
- [pendente]

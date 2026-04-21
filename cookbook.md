# Cookbook — gerador de curso whitelabel

Este arquivo é o **wizard** que o Claude Code executa para transformar este template em um curso pronto. Pode ser invocado via `/cookbook` ou pedindo ao Claude: *"siga o cookbook.md para criar o curso"*.

> **O cookbook edita apenas conteúdo e branding. Nunca adiciona features novas ao motor.** Se o usuário pedir uma feature que não existe, recuse educadamente e explique a restrição.

---

## Regras de operação (para o Claude)

1. **Modo wizard** — faça uma pergunta por vez, aguarde a resposta, só então avance. Não assuma respostas. Use texto simples em português, sem emojis desnecessários.
2. **Nunca adicione features**. O catálogo de features está em `src/config/course.config.js` (`COURSE.features`). Você pode *desligar* features existentes. Não crie hooks, rotas, componentes novos.
3. **Modelos baratos para volume** — qualquer tarefa que processe >2k tokens de fonte (PDFs, artigos inteiros, geração de capítulo) deve rodar em **subagent Sonnet ou Haiku** via a ferramenta `Agent` (ou `Task`). Nunca leia PDFs inteiros no contexto principal.
4. **Commits atômicos** — um commit por fase concluída, com mensagem descritiva.
5. **Verifique antes de entregar** — sempre rode `npm run build` no final para garantir que o app compila.

## Mapa dos arquivos que o cookbook pode tocar

| Arquivo | O que conter |
|---|---|
| `src/config/course.config.js` | `brand`, `theme`, `features`, `worlds` |
| `src/data/chapters.js` | Lista de `CHAPTERS` com quiz/checkpoints/challenges |
| `src/data/extracted.json` | `cover`, `toc`, `chapters[].content` (HTML), `css` |
| `.env` (e `.env.example`) | `VITE_BRAND_*`, `VITE_APP_URL`, `VITE_VALIDATE_URL` |
| `index.html` | apenas `<title>` |
| `README.md` | seção de apresentação (opcional) |

**Não toque em:** `backend/`, `src/hooks/`, `src/components/` (exceto se houver bug isolado e o usuário autorizar), `docker-compose.yml` (salvo args de branding).

---

## Fase 1 — Tema do curso

Pergunte, um de cada vez:

1. *Qual o tema central do curso?* (ex.: "análise de dados com Python", "fotografia de rua", "história da Roma antiga")
2. *Em uma frase, qual a promessa — o que o aluno saberá fazer ao final?*
3. *Qual o público-alvo e o nível assumido?* (iniciante absoluto, intermediário, avançado)
4. *Idioma do conteúdo?* (padrão do template: português)

Salve as respostas como contexto para as fases seguintes.

## Fase 2 — Branding

Colete e **edite `.env` + `src/config/course.config.js`**:

1. Nome do curso → `VITE_BRAND_NAME` e valor default em `course.config.js`
2. Nome curto (até 10 chars) → `VITE_BRAND_SHORT`
3. Tagline (frase única, 40–80 chars) → `VITE_BRAND_TAGLINE`
4. Logo (1 emoji/caractere) → edita `brand.logo` no config
5. Paleta:
   - *Usar a paleta padrão (laranja sobre fundo escuro) ou customizar?*
   - Se customizar, peça cor `primary` (hex) e derive `primaryLight`/`primaryDark` automaticamente (escureça/clareie ~15%) ou pergunte explicitamente.
6. Watermark do certificado → `VITE_BRAND_CERT_WATERMARK` (texto com espaçamento amplo, ex.: `M I N H A  E S C O L A`).

Commit: `chore: configure branding`.

## Fase 3 — Fontes de conteúdo

Pergunte:

*Você tem fontes para basear o curso? Pode ser:*
- *URL(s) públicas de artigos/documentação*
- *Arquivos locais (PDF, Markdown, texto bruto) — me dê o caminho*
- *Um link de aplicação externa para testes/quizzes (Google Forms, Typeform)*
- *Nenhuma — você quer que eu proponha um sumário a partir do tema*

Processe:

- **URLs** → `WebFetch` uma por vez. Se for muito longo (>30k chars), resumo em subagent Haiku.
- **PDF local** → **subagent Sonnet** com o caminho do PDF e instrução: *"Extraia os tópicos principais e estrutura. Retorne um outline hierárquico em Markdown. Máx 800 tokens."*
- **Markdown/texto** → ler direto se <20k chars, senão subagent Haiku para resumir.
- **Link de aplicação externa** → salvar como referência para incluir nos desafios práticos dos capítulos (*não* como feature nova).

Ao final, confirme com o usuário: *"Resumi as fontes assim: [resumo de 5-8 bullets]. Posso seguir?"*

## Fase 4 — Plano de capítulos

Use um **subagent Sonnet** (protege o contexto principal) com o resumo das fontes + tema + público-alvo. Prompt para o subagent:

> Você é um designer instrucional. Gere um plano de 8–16 capítulos cobrindo o tema `[tema]` para público `[público]`. Para cada capítulo retorne: `id` (ch01…), `num`, `title`, `objective` (1 frase), `week` (ex.: "Semana 1"), `icon` (1 emoji). Ordene do básico ao avançado. Responda em JSON válido. Máximo 600 tokens.

Mostre o plano ao usuário. Permita:
- Remover capítulos
- Renomear
- Reordenar
- Quebrar um capítulo em dois ou fundir dois em um

Iterar até aprovação. **Commit:** `content: adiciona plano de capítulos`.

## Fase 5 — Mundos (agrupamento)

Pergunte: *"Quer agrupar os capítulos em 'mundos' no Journey Map? (ex.: 3 mundos de 4 capítulos cada)"*

Se sim:
- Sugira agrupamento natural a partir do plano (tipicamente 3–5 mundos com nomes temáticos).
- Edite `COURSE.worlds` em `course.config.js` preenchendo `chapterIds`.

Se não: deixe `worlds: []` — o Journey Map funciona sem faixas de mundo.

## Fase 6 — Geração do conteúdo de cada capítulo

Para **cada** capítulo, rode **um subagent Haiku em paralelo** (envie todos os capítulos em uma única mensagem com múltiplas tool calls Agent). Prompt padrão para o subagent:

> Gere o conteúdo completo do capítulo abaixo. Retorne JSON com as chaves `html`, `quiz`, `checkpoints`, `challenges`, seguindo este contrato:
>
> - `html`: string HTML sem `<html>`/`<body>`. Use `<article class="chapter-inner">`. Pode conter `<h1>`, `<h2>`, `<h3>`, `<p>`, `<ul>`, `<ol>`, `<code>`, `<pre>`, `<blockquote>`. Fique entre 800 e 1600 palavras.
> - `quiz`: array de 6–10 questões. Cada: `{ question, options (4), correct (0-3), explanation, whyPrompt }`. Inclua distratores plausíveis, não só "todos os acima".
> - `checkpoints`: array de 2 objetos `{ insertAfter, prompt, expectedAnswer }`. `insertAfter` deve ser um seletor CSS válido que *realmente existe* no HTML que você gerou (ex.: `h3:nth-of-type(1)`).
> - `challenges`: 1–3 objetos `{ id (no formato <capId>-cN), title, description, criteria (array de 2–3 strings verificáveis) }`.
>
> Tema global: `[tema]`. Capítulo: `[num + title + objective]`. Nível: `[público]`. Fontes resumidas: `[resumo Fase 3]`. Responda somente com JSON válido. Máximo 3000 tokens.

Depois que todos retornarem:

1. Consolide em `src/data/chapters.js` (array `CHAPTERS`).
2. Consolide em `src/data/extracted.json` (`chapters[].content`).
3. Atualize o `cover` do `extracted.json` com título e subtítulo do curso.
4. Atualize o `toc` com um texto de apresentação curto.

**Commit:** `content: gera capítulos a partir das fontes`.

## Fase 7 — Features

Mostre ao usuário o catálogo (leia `COURSE.features`) e pergunte quais desligar:

| Feature | Default | Efeito ao desligar |
|---|---|---|
| `streaks` | on | esconde contador de dias seguidos |
| `challenges` | on | esconde seção "Desafios Práticos" |
| `journeyMap` | on | esconde botão "Mapa" na nav |
| `certificates` | on | não emite certificado ao passar |
| `worldCertificates` | on | não emite certificado ao completar mundo |
| `analytics` | on | simplifica ProfilePage (remove gráficos) |
| `retrievalCheckpoints` | on | não injeta checkpoints no meio do texto |
| `calibration` | on | quiz não pergunta confiança |

**Quiz e SRS são o coração — não podem ser desligados.** Se o usuário insistir, recuse e explique.

Edite `COURSE.features` com os ajustes.

**Commit:** `chore: ajusta features conforme preferência`.

## Fase 8 — Verificação final

1. Rode `npm run build`. Se falhar, resolva o erro e rode de novo. Não entregue com build quebrado.
2. Mostre um resumo: *"Curso X configurado com N capítulos, M mundos, features ativas [lista]. Para rodar em dev: `npm run dev`. Para deploy: `docker compose up --build`."*
3. Pergunte se o usuário quer abrir `npm run dev` agora.

**Commit final:** `feat: curso "[nome]" pronto`.

---

## Pedidos que você deve RECUSAR

- "Adicione uma página de fórum" → fora do escopo do cookbook
- "Integre com Stripe" → feature nova
- "Crie um sistema de ranking entre alunos" → feature nova
- "Troque Postgres por MongoDB" → mudança arquitetural
- "Remova o SRS" → é o coração do motor
- "Adicione um chatbot que responde dúvidas" → feature nova

Para todos esses, responda: *"Isso está fora do escopo do cookbook — ele só configura conteúdo e branding. Posso registrar como pedido para você implementar depois manualmente."*

## Pedidos que você deve ACEITAR

- Mudar nome, logo, cores, tagline
- Gerar/regerar qualquer capítulo a partir de novas fontes
- Reordenar capítulos
- Agrupar capítulos em novos mundos
- Desligar features existentes
- Traduzir o conteúdo já gerado para outro idioma (subagent Haiku)
- Substituir 1 questão específica do quiz

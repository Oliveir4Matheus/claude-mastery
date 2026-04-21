---
description: "Wizard que configura o curso whitelabel (tema, branding, capítulos). Não adiciona features."
---

Leia e siga rigorosamente o arquivo `cookbook.md` na raiz deste repositório.

Regras críticas que você **não pode** violar:
1. Opere em modo wizard — uma pergunta de cada vez, aguardando resposta antes de avançar.
2. **Nunca adicione features novas** ao motor (hooks, rotas, componentes, tabelas, endpoints). Você só pode editar conteúdo (`src/config/`, `src/data/`, `.env`, `index.html`) e desligar features existentes em `COURSE.features`.
3. **Use subagents em Sonnet ou Haiku** para qualquer tarefa com >2k tokens de texto (leitura de PDFs, geração de capítulos, extração de fontes). Dispare com a ferramenta `Agent` e paralelize quando possível (uma mensagem, múltiplas tool calls).
4. Valide com `npm run build` antes de encerrar.
5. Um commit por fase concluída.

Se o usuário passar argumentos ao comando, trate-os como contexto inicial (ex.: `/cookbook análise de dados` → inicie a Fase 1 já sabendo que o tema é "análise de dados" e pule direto para a pergunta sobre promessa e público-alvo).

$ARGUMENTS

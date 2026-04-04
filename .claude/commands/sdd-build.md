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

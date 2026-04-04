# UX Audit: Claude Mastery

**Data:** 2026-04-04  
**Plataforma:** React 19 + Vite (JSX) / FastAPI backend  
**Público-alvo:** Desenvolvedores dominando Claude Code em 15 capítulos

---

## Sumário Executivo

Claude Mastery é uma plataforma **bem-estruturada** com design system coeso e fluxos de aprendizado bem pensados. A interface é moderna, responsiva e oferece uma experiência de gamificação clara (streaks, certificados, SRS). No entanto, existem **gaps críticos de usabilidade** que degradam a experiência, especialmente no onboarding e em estados de erro. A navegação é intuitiva, mas alguns componentes carecem de feedback visual adequado e acessibilidade.

---

## Scores por Dimensão

| Dimensão | Score | Status |
|----------|-------|--------|
| **Usabilidade** | 7.0/10 | Bom, com lacunas críticas |
| **Consistência Visual** | 8.5/10 | Muito bom |
| **Acessibilidade** | 5.5/10 | Precisa melhorar |
| **Experiência do Estudante** | 8.0/10 | Bom |
| **Design Responsivo** | 8.0/10 | Bom |

---

## Pontos Fortes

### 1. **Design System Coeso e Bem Documentado**
- Paleta de cores clara (primária: `--co: #E87040`, secundárias: azul, verde, roxo)
- Tipografia bem definida: `Playfair Display` para headings, `DM Sans` para body, `JetBrains Mono` para código
- Spacing e border radius consistentes
- Dark theme bem implementado com gradientes sutis

### 2. **Responsividade Completa Mobile-First**
- Navegação se adapta bem em `≤600px` (sidebar ocupa 100%, botões text-only)
- Componentes redimensionam com `clamp()` e media queries bem organizadas
- SafeArea insets respeitados no iOS (notch, home indicator)
- Quiz, capítulos e perfil se reordenam legalmente em mobile

### 3. **Navegação Intuitiva**
- Barra de navegação (NavBar) com 6 botões bem sinalizados: Anterior/Próximo, Contador, Revisão (SRS), Mapa da Jornada, Índice, Perfil
- Sidebar com índice de capítulos + indicadores visuais (locked, active, passed)
- State-based routing funciona bem — não há confusão sobre "onde estou"
- Atalhos de teclado implementados (Arrow keys, Escape)

### 4. **Gamificação Clara**
- Streaks exibidos no perfil e no ReviewDashboard
- Certificados gerável por capítulo com código verificável único
- Sistema Leitner (5 caixas) bem comunicado com barras de distribuição
- Badges de confiança (superestimada/subestimada) no Quiz
- JourneyMap visualiza progresso com pixel art style atraente

### 5. **Quiz Bem Estruturado**
- Feedback imediato (✓/✗) após submit
- Explicações detalhadas para cada questão
- Confidence levels (Chutando / Acho que sei / Tenho certeza) + calibration feedback
- Try-again logic clara: reset dos inputs, scroll para top
- Mínimo de acertos (70%) bem comunicado

### 6. **SRS/Revisão Espacada Funcional**
- Cards organizados em 5 caixas Leitner com intervalos claros [1, 3, 7, 14, 30 dias]
- Modo "por capítulo" vs "misto" (shuffle)
- Stats: dias de streak, cartões dominados, taxa de retenção
- ReviewCard mostra pergunta → resposta com feedback de acerto

### 7. **Perfil e Estatísticas Detalhadas**
- KPIs bem visualizados (módulos concluídos, streak, retenção, desafios)
- Gráficos de barras por capítulo: scores de quiz, calibração, tópicos fracos
- Grid de certificados com metadados (score, data, código)
- Data de "membro desde" humaniza a conta

---

## Problemas Críticos

### 1. **Falta de Loading States / Skeleton Screens** ⚠️ CRÍTICO
**Impacto:** Usuário fica confuso se app está respondendo

**Evidência:**
- Na primeira carga (boot), exibe "Carregando..." em um card genérico (App.jsx:35-47)
- Sincronismo com servidor (`auth.syncFromServer()`) não tem feedback visual
- Profile page carrega certificados com `loadingCerts` state, mas não há skeleton — exibe apenas "Carregando..." (ProfilePage.jsx:99-100)

**Recomendação:**
- Implementar skeleton screens para: ProfilePage (KPIs, charts, certificates), ReviewDashboard (cards)
- Mostrar placeholder animado enquanto sync acontece

---

### 2. **Sem Feedback de Erro em Formulários** ⚠️ CRÍTICO
**Impacto:** Usuário não sabe o que deu errado

**Evidência:**
- AuthScreen mostra `error` como texto simples em `.auth-error` (AuthScreen.jsx:71)
- Nenhuma sugestão de ação: "Email já registrado? Tente fazer login"
- Sem retry automático ou dica de contato para suporte
- API pode retornar genérico "falha" sem detalhe

**Recomendação:**
- Diferenciar erros: "Email já existe", "Senha muito curta", "Servidor indisponível"
- Adicionar ação contextual: botão "Tentar login" se registro falhar
- Mostrar toast notifications (sucesso de login/registro)

---

### 3. **Quiz Locked State Não é Óbvio** ⚠️ IMPORTANTE
**Impacto:** Usuário tenta avançar e fica preso sem saber por quê

**Evidência:**
- Botão "Próximo" fica desabilitado com `🔒 Aprovação` (NavBar.jsx:26-28)
- Mensagem no `title` attribute apenas aparece ao hover/3s
- Em mobile, texto é escondido (`.nav-btn-label { display: none }`)
- ModuleLanding mostra score anterior, mas não "tente novamente"

**Recomendação:**
- Mostrar modal/banner claro: "Complete a avaliação com ≥70% para continuar" (sempre visível, não só em hover)
- Adicionar retry flow mais óbvio no Quiz: se falhar, button "Tentar novamente" fica proeminente
- Indicar visualmente no índice (sidebar) quais capítulos estão locked

---

### 4. **Acessibilidade Deficiente** ⚠️ IMPORTANTE
**Impacto:** Usuários com deficiência visual/motor excluídos

**Evidência:**
- Ícones sem `aria-label` adequado: botões usam só emoji (🧠, 🗺, ☰, 🔒)
- NavBar: buttons têm `aria-label` mas faltam em componentes secundários
- AuthInput: `type="email"` correto, mas sem `aria-invalid` em erro
- Quiz: espaço de confiança sem labels explícitos para screen readers
- Sidebar: `.sidebar-item.locked` não comunica lock status no DOM (apenas CSS)
- Contraste algumas vezes baixo: `--tx3` (#6B6560) em fundos escuros

**Recomendação:**
- Adicionar `aria-label` para todos os ícones: `aria-label="Revisão Espaçada (Leitner)"`
- Role `dialog` já existe em JourneyMap, manter em outros modals
- Usar `aria-current="page"` em sidebar item ativo
- Melhorar contraste de `--tx3` ou aumentar font-size em informações críticas

---

### 5. **Onboarding Fraco** ⚠️ IMPORTANTE
**Impacto:** Novo usuário não sabe por onde começar

**Evidência:**
- Cover page é linda mas vaga: "Domine o Claude Code em 15 capítulos"
- Sem tutorial de primeira vez: novo user vê TOC e não sabe "clique no Capítulo 01"
- Sem pré-requisitos claramente comunicados (ex: "Precisa saber JavaScript básico?")
- Quiz aparece como "surpresa" após capítulo — não há aviso "próxima etapa é avaliar"
- SRS/Streak é ignorado até passar no primeiro quiz

**Recomendação:**
- Adicionar onboarding modal na primeira visita: "Bem-vindo! Veja como funciona" com 3 telas
- Tooltip no primeiro capítulo: "Leia, depois faça quiz para avançar"
- Explicar SRS/Streaks quando user passa no 1º quiz
- Help button (?) na navbar com FAQ/glossário

---

### 6. **Estados Não Claros no Review/SRS** ⚠️ IMPORTANTE
**Impacto:** User não sabe o que esperar do card

**Evidência:**
- ReviewCard mostra card mas não deixa claro se é "tente se lembrar ANTES de virar"
- Sem delay entre mostrar pergunta e resposta — pode virar automaticamente
- JourneyMap mostra `status`: locked/current/available/completed, mas cores não são intuitivas
  - Locked = opaco (40% opacity)
  - Current = laranja `--co`
  - Completed = verde `--grn`
  - Available = sem cor especial (mesmo tom que current?)
- ReviewDashboard modo "misto" embaralha, mas sem sinalizar que mudou de capítulo

**Recomendação:**
- Adicionar delay/step no ReviewCard: "Tente se lembrar [toque para revelar]"
- Colorir nós do JourneyMap diferentemente: locked (cinza), available (azul), current (laranja), completed (verde)
- Mostrar qual capítulo o card pertence: `<span>Ch 3 — O Loop Agêntico</span>`

---

### 7. **Perfil Custa Extra Load** ⚠️ IMPORTANTE
**Impacto:** User clica avatar, espera, dados carregam lento

**Evidência:**
- ProfilePage faz `apiGetCertificates()` no mount (useEffect)
- Sem cache: cada vez que abre perfil, refetch
- Avatar button é pequeno no mobile (26x26px)

**Recomendação:**
- Cache de certificados no state global ou localStorage
- Mostrar skeleton enquanto carrega
- Aumentar hit area do avatar button em mobile: mínimo 44x44px (WCAG)

---

## Problemas Importantes

### 8. **Consistência de Nomenclatura (PT-BR)**
**Impacto:** User fica confuso com termos

**Evidência:**
- "Avaliação" vs "Avaliacao" (sem acento em código)
- "Revisao Espacada" (sem acento)
- "Próximo" vs "Proximo" (misturado)
- "Confianca" (sem acento)
- "Capitulo" (sem acento)
- "Modulos" (sem acento)

**Recomendação:**
- Usar acentuação correta em todo o código: "Avaliação", "Revisão Espaçada", "Capítulo", "Módulo"

---

### 9. **Hierarquia de Informação em Cards**
**Impacto:** Usuário não sabe o que é mais importante

**Evidência:**
- Quiz options: letra + texto — sem visual hierarchy forte entre eles
- Certificate card: score, date, code — tamanhos parecidos, sem destaque de score
- SRS box distribution: contagem, label — contagem maior mas label não contextualiza bem

**Recomendação:**
- Aumentar score de certificado em tamanho e cor
- Usar variação de peso/tamanho em options de quiz
- Adicionar ícone/cor ao distribuição Leitner (vermelho para Caixa 1, etc.)

---

### 10. **Falta de Validação de Senha / Hints de Força**
**Impacto:** User cria senha fraca

**Evidência:**
- AuthInput: `minLength={6}` apenas
- Sem visual de força de senha
- Sem dicas: "use maiúsculas, números, símbolos"

**Recomendação:**
- Adicionar password strength meter (0-100%)
- Mostrar requisitos conforme user digita

---

### 11. **Navigation Forward/Back Sem Confirmação**
**Impacto:** User perde progresso ou entra em capítulo errado

**Evidência:**
- Setas em NavBar avançam/voltam imediatamente
- Sem confirmação se user está no meio de quiz
- Quiz tem `Reset Chapter` mas hidden no ModuleLanding

**Recomendação:**
- Warning modal se user tentar sair de quiz incompleto: "Seu progresso será perdido?"
- Highlight o botão "Reset" se chapter foi passado (para retry)

---

### 12. **Tamanho Pequeno de Targets em Mobile**
**Impacto:** Difícil clicar em botões/opções

**Evidência:**
- NavBar buttons: `padding: 10px 14px` (height ~34px) ✓ OK
- Quiz option: `padding: 10px 12px` (height ~24px) ✗ APERTADO
- Sidebar items: `padding: 9px 22px` (height ~28px) ✗ APERTADO
- WCAG recomenda 44x44px mínimo

**Recomendação:**
- Aumentar padding/height de quiz options em mobile: `padding: 12px 14px`
- Aumentar sidebar item height: `padding: 12px 22px`

---

### 13. **Modo Escuro Sem Toggle**
**Impacto:** User que quer modo claro não consegue

**Evidência:**
- CSS sempre usa `--bg0` (dark)
- Sem preferência de tema
- Sem toggle na navbar ou perfil

**Recomendação:**
- Respeitar `prefers-color-scheme: light` via `@media`
- Ou adicionar toggle de tema na navbar (sol/lua) com persistência em localStorage

---

## Melhorias Sugeridas (Nice-to-Have)

### 14. **Progress Indicators em Capítulos Longos**
Adicionar `<ProgressBar>` visual mostrando "você está no meio do cap 5, ~30% lido"

### 15. **Recomendações Adaptativas**
Após failar quiz, sugerir seção específica para reler (ex: "Revise a seção sobre o Agentic Loop")

### 16. **Desafios Práticos Inteligentes**
Hoje mostram apenas checklist. Poderiam validar automaticamente:
- "Clone um repo, refatore uma função" → validar com git diff
- "Rode comando X no bash" → verificar resultado

### 17. **Modo de Estudo Pomodoro**
Timer de 25min com pausa sugerida — integrar com SRS

### 18. **Exportar Certificado em PDF**
Hoje é canvas (ValidatePage), mas mobile não consegue printar bem

### 19. **Notificações de Streak em Risco**
Se user não revisar por 2 dias: email/notificação "Seus X dias de streak estão em risco"

### 20. **Estatísticas Avançadas**
- Tempo médio por capítulo
- Taxa de retry por capítulo (qual é mais difícil?)
- Predição de maestria (quando user vai dominar cada tópico?)

---

## Fluxos de UX Críticos

### Fluxo 1: Novo Usuário (Onboarding)
```
1. Registro (email/senha/nome)                   ⚠️ Sem feedback de erro
2. Redirect → Cover page                          ✓ Bonito
3. "Começar" → TOC                                ⚠️ Sem orientação (clique em 01)
4. Clica Capítulo 01 → ModuleLanding             ✓ Clear
5. "Começar" → ChapterContent                    ✓ Boa UX
6. Finish chapter → "Fazer Avaliação" button      ✓ Óbvio
7. Quiz                                           ⚠️ Sem dica: confiança é opcional
8. Pass (70%+) → Certificate modal                ✓ Celebração legal
9. Back → ModuleLanding mostra score              ✓ Validation
10. Nav "Próximo" → Cap 02                        ✓ Clear
```

**Problema:** Passos 1, 3, 7 precisam melhor feedback

---

### Fluxo 2: Revisão Diária (SRS)
```
1. User abre app
2. NavBar mostra "🧠 (5)" = 5 cartões pendentes
3. Clica → ReviewDashboard
4. Mostra: 5 pendentes, X dias de streak
5. StartReview → ReviewCard (pergunta)
6. User pensa... [sem delay, pode virar rapidinho]
7. Clica "Revelar" → resposta
8. "Acertei" / "Errei" → Próximo card
9. Finish → "Sessão completa: 4/5 corretos, streak +1"
```

**Problema:** Passo 6 não tem delay — parecer que virou mágica

---

### Fluxo 3: Retry de Capítulo
```
1. User falha no quiz (65%)
2. Vê "Precisava de 4, acertou 3"
3. Clica "Tentar Novamente" → Reset
4. Completa cap novamente... passa com 80%
5. Novo certificate gerado
```

**Problema:** Reset é confuso — hidden no ModuleLanding, user pode não achar

---

## Recomendações Prioritizadas

| Prioridade | Problema | Esforço | Impacto |
|------------|----------|--------|--------|
| P1 | Loading states/skeleton screens | M | Alto |
| P1 | Mensagens de erro específicas | M | Alto |
| P1 | Quiz locked state óbvio | S | Alto |
| P2 | Acessibilidade (aria-labels, contraste) | M | Médio |
| P2 | Onboarding primeiro uso | L | Médio |
| P2 | Nomenclatura correta (acentuação) | S | Baixo |
| P3 | Dark/light theme toggle | M | Baixo |
| P3 | Password strength meter | S | Baixo |
| P3 | Recomendações adaptativas | L | Médio |

---

## Checklist de Implementação

### Curto Prazo (1-2 semanas)
- [ ] Adicionar skeleton screens (ProfilePage, ReviewDashboard)
- [ ] Diferenciar mensagens de erro de auth
- [ ] Tornar "quiz locked" visível sempre (não só em hover)
- [ ] Corrigir acentuação em pt-BR
- [ ] Aumentar hit areas em mobile (quiz options, sidebar)

### Médio Prazo (2-4 semanas)
- [ ] Implementar aria-labels em todos os botões
- [ ] Melhorar contraste de `--tx3`
- [ ] Adicionar delay ao reveal de ReviewCard
- [ ] Criar onboarding modal primeira vez
- [ ] Implementar cache de certificados

### Longo Prazo (1-2 meses)
- [ ] Dark/light theme toggle
- [ ] Desafios práticos com validação automática
- [ ] Recomendações adaptativas baseadas em fraquezas
- [ ] Estatísticas avançadas no perfil
- [ ] Exportar certificado em PDF

---

## Conclusão

Claude Mastery é uma **plataforma bem estruturada com ótima gamificação**, mas sofre de **falhas críticas de feedback** (erros, loading, estados incertos) que degradam a confiança do usuário. Os fluxos principais funcionam, mas precisam de "suavização" (skeletons, mensagens, delays).

A **acessibilidade é o maior gap**, junto com o **onboarding fraco** para primeiro uso. Corrigir P1 (loading, erros, quiz locked) deve ser prioridade, pois afeta confiança imediata. A maioria das melhorias não quebra código existente — são aditivas.

**Score final recomendado: 7.5/10** para produção com essas correções implementadas.

---

## Apêndice: Referências

### Tokens/Variáveis CSS
- **Primária:** `--co: #E87040` (laranja)
- **Secundárias:** `--blu: #5B8DEF`, `--grn: #6BCB77`, `--pur: #B07FD0`
- **Error:** `--red: #E85D5D`
- **Backgrounds:** `--bg0` (muito escuro), `--bg1` (escuro), `--bg2` (médio), `--bgt` (terminal)
- **Text:** `--tx` (light), `--tx2` (medium), `--tx3` (dark/secondary)
- **Border:** `--brd: #2A2A35`

### Breakpoints
- Mobile: `≤600px`
- Tablet: `601–959px`
- Desktop: `≥960px`

### Fontes
- Display: `Playfair Display` (serif, headings)
- Body: `DM Sans` (sans, paragraphs)
- Mono: `JetBrains Mono` (code, labels)
- Pixel: `Press Start 2P` (JourneyMap only)

### Componentes Principais
- `AuthScreen` — login/registro
- `Reader` — container principal (manager de páginas)
- `Quiz` — avaliação com confidence tracking
- `ReviewDashboard` — SRS/Leitner
- `JourneyMap` — visualização de progresso (pixel art)
- `ProfilePage` — estatísticas + certificados
- `ValidatePage` — validação pública de certificados

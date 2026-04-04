# Database Audit Report — claude-mastery

**Date**: 2026-04-04  
**Database**: PostgreSQL 16  
**ORM**: SQLAlchemy 2 (async)  
**Migrations**: Alembic (1 migration)  

---

## 1. Diagrama de Tabelas e Relacionamentos

```
┌─────────────────────┐
│      USERS          │
├─────────────────────┤
│ id (PK, SERIAL)     │◄─────┐
│ name (VARCHAR 120)  │      │ (1:N CASCADE)
│ email (VARCHAR 255) │      │
│ password_hash ...   │      │
│ current_page (INT)  │      │
│ created_at (TSTZ)   │      │
└─────────────────────┘      │
         ▲                    │
         │                    │
    ┌────┴─────────────────────────────────────────┐
    │                                              │
    ▼                                              ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PROGRESS       │  │ CERTIFICATES     │  │   SRS_CARDS      │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ id (PK)          │  │ id (PK)          │  │ id (PK)          │
│ user_id (FK)◄────┼──│ user_id (FK)◄────┼──│ user_id (FK)     │
│ chapter_id (STR) │  │ code (VARCHAR 14)│  │ card_key (STR)   │
│ score (INT)      │  │ holder_name      │  │ chapter_id       │
│ passed (BOOL)    │  │ target_type      │  │ question_index   │
│ attempts (INT)   │  │ target_id        │  │ box (INT: 1-5)   │
│ calibration_score│  │ target_title     │  │ next_review (DATE)
│ last_attempt (TS)│  │ score (INT)      │  │ last_review      │
│ question_results │  │ issued_at (TSTZ) │  │ review_count     │
│                  │  │                  │  │ correct_streak   │
│ UQ(user,chapter) │  │ UQ(code)         │  │ UQ(user,card_key)│
└──────────────────┘  └──────────────────┘  └──────────────────┘
         ▲                      ▲                      ▲
         │                      │                      │
         └──────────────────────┴──────────────────────┘
              (todas referem user_id com CASCADE)
         
         ┌─────────────────────────┐      ┌─────────────────────┐
         │     CHALLENGES          │      │  REVIEW_STREAKS     │
         ├─────────────────────────┤      ├─────────────────────┤
         │ id (PK)                 │      │ id (PK)             │
         │ user_id (FK)◄───────────┼──┬───│ user_id (FK)◄──────┤
         │ challenge_id (VARCHAR 30│  │   │ current_streak (INT)│
         │ completed (BOOL)        │  │   │ longest_streak (INT)│
         │ completed_at (TSTZ)     │  │   │ last_review_date    │
         │                         │  │   │ total_reviews (INT) │
         │ UQ(user, challenge_id)  │  │   │                     │
         │                         │  │   │ UQ(user_id)         │
         └─────────────────────────┘  │   └─────────────────────┘
                                      │
                     (todas CASCADE on DELETE)
```

### Estatísticas

- **Tabelas**: 7
- **Relacionamentos**: 1:N (User → outros, todas CASCADE)
- **Índices**: 3 (email único, certificate.code único, SRS/Progress/Challenge UQs)
- **FKs**: 7 (todas com CASCADE ON DELETE)

---

## 2. Problemas Críticos

### ⚠️ CRÍTICO-01: Falta de `updated_at` em quase todas as tabelas

**Impacto**: Impossível auditar quando um registro foi alterado pela última vez.

**Afetadas**: Users, Progress, Certificates, SRSCard, Challenge, ReviewStreak

**Recomendação**: 
```python
# Adicione em TODAS as tabelas que sofrem updates:
updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), 
    default=datetime.utcnow, 
    onupdate=datetime.utcnow
)
```

**Quando**: Migration para adicionar coluna + trigger `ON UPDATE` no PostgreSQL.

---

### ⚠️ CRÍTICO-02: Sem `deleted_at` (soft delete)

**Impacto**: Dados de usuários e progresso são irrecuperavelmente deletados. Impossível auditoria legal/compliance.

**Afetadas**: Users, Progress, Certificates, SRSCard, Challenge, ReviewStreak

**Recomendação**: Implementar soft delete:
```python
deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
```

Adicionar filtro em todas as queries:
```sql
WHERE deleted_at IS NULL
```

**Impacto no código**: Todas as queries em `routes.py` precisam filtrar por `deleted_at IS NULL`.

---

### ⚠️ CRÍTICO-03: Sem índice em `user_id` nas tabelas filhas

**Impacto**: Queries lentas ao buscar progresso/SRS/certificados por usuário.

**Afetadas**:
- `progress(user_id)` — 6 queries usam `Progress.user_id` (linhas 78, 86, 270)
- `srs_cards(user_id)` — 5 queries (linhas 168, 175, 186, 272)
- `certificates(user_id)` — 3 queries (linhas 121, 142, 271)
- `challenges(user_id)` — 2 queries (linhas 243, 251, 273)
- `review_streaks(user_id)` — 4 queries (linhas 211, 233, 274)

**Recomendação**: Criar índices:
```sql
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_srs_cards_user_id ON srs_cards(user_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_challenges_user_id ON challenges(user_id);
CREATE INDEX idx_review_streaks_user_id ON review_streaks(user_id);
```

**Impacto**: Melhoria de 10-100x em queries de listagem por usuário.

---

### ⚠️ CRÍTICO-04: Sem índice em `chapter_id` (coluna de negócio)

**Impacto**: Impossível buscar rapidamente qual capítulo um usuário atingiu, ranking de capítulos, etc.

**Afetadas**:
- `progress(chapter_id)` — usado em reset_chapter (linha 110)
- `srs_cards(chapter_id)` — usado em reset_chapter (linha 111)

**Recomendação**:
```sql
CREATE INDEX idx_progress_chapter_id ON progress(chapter_id);
CREATE INDEX idx_srs_cards_chapter_id ON srs_cards(chapter_id);
```

---

### ⚠️ CRÍTICO-05: `password_hash` sem validação de comprimento mínimo

**Impacto**: Senhas fracas podem ser armazenadas (bcrypt gera 60 chars, mas a coluna String(255) poderia aceitar lixo).

**Recomendação**: Validação em `auth.py` já existe (8+ chars + letra + número), mas o banco deveria enforçar:

```python
password_hash: Mapped[str] = mapped_column(String(60), nullable=False)
# bcrypt sempre gera 60 caracteres exatamente
```

---

### ⚠️ CRÍTICO-06: Sem `created_at` em `Progress` e `Challenge`

**Impacto**: Impossível saber quando um desafio foi iniciado ou quando uma tentativa de quiz foi feita.

**Afetadas**:
- `Progress` — já tem `last_attempt`, falta `created_at`
- `Challenge` — tem `completed_at`, falta `created_at`

**Recomendação**: Adicionar em ambas:
```python
created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
```

---

## 3. Problemas de Padronização

### 📋 PADRÃO-01: `current_page` em Users vs progresso por capítulo

**Inconsistência**: A tabela `Progress` rastreia por `chapter_id`, mas `Users.current_page` é um inteiro genérico.

**Questão**: O que é `current_page`? Page absoluta do PDF? Ou `chapter_id`?

**Recomendação**: Clarificar o domínio:
- Se for page absoluta → renomear para `last_page_read` e documentar
- Se for chapter_id → mudar tipo para `String(20)` e adicionar FK para `Progress`

**Nota**: As rotas (`routes.py:69-72`) salvam um inteiro simples. Presumo ser page absoluta do conteúdo estático.

---

### 📋 PADRÃO-02: Nomes inconsistentes em `Certificate`

- `target_type` (default "chapter") — OK
- `target_id` (String(20)) — OK, mas não tem FK
- `target_title` (denormalizado) — acoplado; mudanças no nome do capítulo não atualizam aqui

**Recomendação**: 
- `target_id` deveria referenciar `chapters` (tabela estática ou mapeado como ENUM)
- `target_title` deveria ser calculado em SELECT, não armazenado
- Se denormalização é necessária (para performance/auditoria), adicionar migration para manter sincronizado

---

### 📋 PADRÃO-03: `SRSCard.card_key` vs estrutura de composite

**Problema**: `card_key = f"{chapter_id}-q{i}"` é parsing manual na app (`routes.py:185`).

**Recomendação**: Melhor modelagem seria:
```python
chapter_id: Mapped[str]
question_index: Mapped[int]
# Sem card_key, usar composite unique constraint
__table_args__ = (UniqueConstraint("user_id", "chapter_id", "question_index"),)
```

**Benefício**: Menos parsing, melhor normalização, mais seguro.

---

### 📋 PADRÃO-04: Falta de convenção de nomes em FKs

**Padrão Atual**: `user_id` (OK, singular)  
**Recomendação**: Manter consistente. Já está bom.

---

### 📋 PADRÃO-05: `question_results` armazenado como JSON sem schema

**Problema**: Nenhuma validação de estrutura. Qualquer JSON é aceito.

**Recomendação**: Usar `JSON` com constraint ou `JSONB` (PostgreSQL):
```python
question_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)
# Implementar schema validation na app antes de salvar
```

**Nota**: Já está como `JSON` no schema, mas sem validação de forma.

---

## 4. Oportunidades de Performance

### 🚀 PERF-01: Índices compostos para queries comuns

**Queries frequentes**:
1. `SELECT * FROM progress WHERE user_id = ? AND chapter_id = ?` (linha 86)
2. `SELECT * FROM srs_cards WHERE user_id = ? AND card_key = ?` (linha 186, 198)
3. `SELECT * FROM challenges WHERE user_id = ? AND challenge_id = ?` (linha 251)

**Índices criados**:
- `Progress`: já tem UQ(user_id, chapter_id) ✓
- `SRSCard`: já tem UQ(user_id, card_key) ✓
- `Challenge`: já tem UQ(user_id, challenge_id) ✓

**Recomendação**: Manter UQs como estão; são índices compostos implícitos.

---

### 🚀 PERF-02: Índice em `Certificate.code` para validações

**Query**: `SELECT * FROM certificates WHERE code = ?` (linha 150)

**Status**: Já tem índice único (`ix_certificates_code`) ✓

---

### 🚀 PERF-03: Índice em `SRSCard.next_review` para encontrar cartões vencidos

**Query**: `SELECT * FROM srs_cards WHERE user_id = ? AND next_review <= TODAY` (linha 168)

**Status**: Sem índice em `next_review`.

**Impacto**: O(n) ao buscar cartões para revisar.

**Recomendação**:
```sql
CREATE INDEX idx_srs_cards_next_review ON srs_cards(next_review, user_id);
```

**Nota**: Índice composto colocando `next_review` primeiro permite filtro eficiente por intervalo de datas.

---

### 🚀 PERF-04: Lazy loading em `User` → progresso/certificados

**Problema**: Endpoint `/sync` faz 5 queries separadas (linhas 270-274):
```python
progress = await db.execute(select(Progress).where(...))
certs = await db.execute(select(Certificate).where(...))
cards = await db.execute(select(SRSCard).where(...))
challenges = await db.execute(select(Challenge).where(...))
streak_r = await db.execute(select(ReviewStreak).where(...))
```

**Oportunidade**: Usar eager loading com `selectinload`:
```python
from sqlalchemy.orm import selectinload
stmt = select(User).where(User.id == user_id).options(
    selectinload(User.progress),
    selectinload(User.certificates),
    selectinload(User.srs_cards),
    selectinload(User.challenges),
    selectinload(User.streak)
)
user = await db.execute(stmt)
# Depois: user.progress, user.certificates, etc. sem queries adicionais
```

**Impacto**: Reduz de 5 queries para 1 (com JOINs).

---

### 🚀 PERF-05: Batch deletions em `reset_chapter`

**Problema**: Dois `DELETE` separados (linhas 110-111):
```python
await db.execute(delete(Progress).where(...))
await db.execute(delete(SRSCard).where(...))
```

**Melhoria**: Combinar em uma transação (já está, mas sem índice em `chapter_id`):
- Adicionar índice `idx_progress_chapter_id` e `idx_srs_cards_chapter_id` (ver CRÍTICO-04)

---

## 5. Integridade e Constraints

### ✓ OK-01: Foreign Keys com CASCADE

Todas as FKs têm `ondelete='CASCADE'`:
```python
user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
```

**Status**: Correto. Deletar um usuário remove progresso, certs, SRS, desafios, streak.

---

### ✓ OK-02: UNIQUE constraints onde esperado

- `users(email)` — ✓
- `certificates(code)` — ✓
- `progress(user_id, chapter_id)` — ✓
- `srs_cards(user_id, card_key)` — ✓
- `challenges(user_id, challenge_id)` — ✓
- `review_streaks(user_id)` — ✓

**Status**: Completo. Previne duplicatas.

---

### ✓ OK-03: NOT NULL constraints

Colunas críticas têm `nullable=False`:
- `users`: name, email, password_hash ✓
- `progress`: user_id, chapter_id, score, passed, attempts ✓
- `certificates`: code, user_id, holder_name, target_id, target_title, score ✓
- `srs_cards`: user_id, card_key, chapter_id, question_index, box, next_review ✓
- `challenges`: user_id, challenge_id, completed ✓
- `review_streaks`: user_id, current_streak, longest_streak, total_reviews ✓

**Status**: Bem coberto.

---

### ⚠️ INTEGRIDADE-01: Sem CHECK constraints em valores enumerados

**Problema**: Colunas como `Certificate.target_type` (default "chapter") e `SRSCard.box` (1-5) não têm constraints.

**Recomendação**:
```python
# Em SRSCard
__table_args__ = (
    CheckConstraint("box >= 1 AND box <= 5", name="ck_srs_box_range"),
    UniqueConstraint("user_id", "card_key"),
)

# Em Certificate
__table_args__ = (
    CheckConstraint("target_type IN ('chapter', 'course')", name="ck_cert_target_type"),
)
```

**Impacto**: Evita dados inválidos no banco (atualmente a validação é só na app).

---

### ⚠️ INTEGRIDADE-02: Sem validação de `calibration_score` e `score`

**Problema**: `Progress.score` e `calibration_score` podem ser negativos ou maiores que 100.

**Recomendação**:
```python
score: Mapped[int] = mapped_column(Integer)
calibration_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

# No banco:
CheckConstraint("score >= 0 AND score <= 100", name="ck_progress_score")
CheckConstraint("calibration_score IS NULL OR (calibration_score >= 0 AND calibration_score <= 100)", name="ck_progress_calib_score")
```

---

## 6. Migrations (Alembic)

### ✓ OK-01: Migration única ordenada

- **Arquivo**: `678c718b2eb4_initial_schema.py` (data 2026-03-31)
- **Upgrade**: Cria todas as 7 tabelas
- **Downgrade**: Drop de todas (reversível) ✓

**Status**: Simples, funcional.

---

### ⚠️ MIGRATIONS-01: Sem revisão de dados antes de destructive changes

**Problema**: O downgrade destrói dados. Nenhuma proteção.

**Recomendação**: Documentar em comments:
```python
def downgrade() -> None:
    # WARNING: This destroys all user data, progress, certificates, etc.
    # Use only in development. In production, create a new migration instead.
    op.drop_table('srs_cards')
    # ...
```

---

### ⚠️ MIGRATIONS-02: Sem validação de DATABASE_URL

**Problema**: Se Alembic rodar contra banco errado, dados podem ser perdidos.

**Recomendação**: Adicionar verificação em `alembic/env.py`:
```python
import os
if "production" in os.getenv("DATABASE_URL", ""):
    raise RuntimeError("Refusing to run migrations against PRODUCTION database")
```

---

## 7. Segurança no Banco

### ✓ OK-01: Senhas em bcrypt

**Status**: `hash_password()` em `auth.py:15` usa bcrypt ✓

```python
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt()).decode()
```

---

### ✓ OK-02: Sem dados sensíveis em plain text

**Status**: Não há SSNs, CPFs, cartões de crédito. Apenas email (ok, é público no contexto) ✓

---

### ⚠️ SEGURANÇA-01: Permissões do usuário PostgreSQL

**Configuração** (`docker-compose.yml`):
```yaml
POSTGRES_USER=${POSTGRES_USER:-mastery}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-mastery_secret}
```

**Problema**: Usuário `mastery` tem acesso completo a todos os schemas/tabelas.

**Recomendação** (em produção):
```sql
-- Criar usuário restrito
CREATE USER mastery_app WITH PASSWORD '...';
GRANT CONNECT ON DATABASE claude_mastery TO mastery_app;
GRANT USAGE ON SCHEMA public TO mastery_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mastery_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mastery_app;

-- Negar DROP, ALTER, etc.
REVOKE ALL ON SCHEMA public FROM mastery_app;
GRANT USAGE ON SCHEMA public TO mastery_app;
```

**Status**: Deve-se fazer em produção (não afeta local).

---

### ⚠️ SEGURANÇA-02: JWT_SECRET vazio como default

**Arquivo**: `backend/app/config.py:5`
```python
JWT_SECRET = os.getenv("JWT_SECRET", "")
```

**Problema**: Se `JWT_SECRET` não for setado, tokens são assinados com string vazia!

**Recomendação**:
```python
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET must be set in environment variables")
```

**Nota**: CLAUDE.md menciona que isso foi resolvido em commit `1134cf4` (move validação do import para startup do FastAPI).

---

## 8. Relatório de Qualidade — Scores por Dimensão

| Dimensão | Score | Status | Comentário |
|----------|-------|--------|-----------|
| **Modelagem** | 7/10 | ⚠️ Bom, mas incompleto | Entidades fazem sentido, relacionamentos corretos, mas faltam timestamps e soft delete |
| **Padronização** | 7/10 | ⚠️ Consistente | Snake_case OK, PKs SERIAL OK, mas nomes inconsistentes em Certificate e SRSCard |
| **Performance** | 6/10 | ⚠️ Crítico | Índices em FKs faltando, query em `/sync` poderia ser eager-loaded |
| **Integridade** | 8/10 | ✓ Bom | FKs + UQs bem implementados, mas sem CHECK constraints |
| **Segurança** | 7/10 | ⚠️ Bom | Bcrypt OK, mas JWT_SECRET validation e database permissions precisam de atenção |

---

## 9. Recomendações Prioritizadas

### 🔴 **Prioridade 1 — Crítico (fazer ASAP)**

1. **Adicionar `updated_at` em todas as tabelas** (migration + trigger ON UPDATE)
   - Afeta: Users, Progress, Certs, SRS, Challenge, ReviewStreak
   - Impacto: Auditoria, compliance, debugging

2. **Implementar soft delete (`deleted_at`)** 
   - Afeta: Users, Progress, Certs, SRS, Challenge, ReviewStreak
   - Impacto: Recuperação de dados, auditoria legal

3. **Adicionar índices em `user_id` nas tabelas filhas**
   - SQL: 5 índices simples
   - Impacto: 10-100x performance em listagens por usuário

4. **Validar JWT_SECRET em startup** (já documentado em CLAUDE.md como resolvido)
   - Impacto: Segurança crítica

### 🟠 **Prioridade 2 — Importante (próximas 2 semanas)**

5. **Adicionar `created_at` em Progress e Challenge**
   - Falta informação de negócio crucial

6. **Criar índice em `SRSCard.next_review`**
   - Queries de "cartões vencidos" ficam O(n)

7. **Usar eager loading em `/sync`**
   - Reduz 5 queries para 1

8. **Adicionar CHECK constraints** em box, score, calibration_score, target_type
   - Valida dados no banco, não só na app

9. **Documentar o domínio de `current_page` em Users**
   - Esclarecer: page absoluta vs chapter_id?

### 🟡 **Prioridade 3 — Nice-to-have (próximas 4 semanas)**

10. **Refatorar `SRSCard.card_key`** para composite PK (chapter_id, question_index)
    - Menos parsing, melhor normalização

11. **Denormalizar `Certificate.target_title`** com trigger de sincronização
    - Ou fazer SELECT calculado

12. **Adicionar schema validation em `question_results` JSON**
    - Usar Pydantic model para validar forma

13. **Manter índices para `chapter_id`** (já recomendado em CRÍTICO-04)
    - Queries de reset ficam mais rápidas

14. **Criar usuário PostgreSQL restrito** em produção
    - Principle of least privilege

---

## 10. Query de Verificação

Para validar o estado atual:

```sql
-- Listar índices criados
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;

-- Contar registros por tabela
SELECT tablename, (SELECT COUNT(*) FROM users) as users,
       (SELECT COUNT(*) FROM progress) as progress,
       (SELECT COUNT(*) FROM certificates) as certs,
       (SELECT COUNT(*) FROM srs_cards) as srs,
       (SELECT COUNT(*) FROM challenges) as challenges,
       (SELECT COUNT(*) FROM review_streaks) as streaks
FROM pg_tables WHERE schemaname = 'public' LIMIT 1;

-- Verificar constraints
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name, constraint_type;
```

---

## Conclusão

A arquitetura do banco é **sólida para MVP**, com modelagem sensata e boas práticas em FKs e UQs. Porém, **precisa de investimento em observabilidade** (updated_at, created_at, deleted_at) **e performance** (índices em FKs, eager loading) antes de escalar.

**Ações imediatas**:
1. Adicionar timestamps (created_at, updated_at, deleted_at)
2. Criar índices em FKs
3. Validar JWT_SECRET em startup
4. Implementar eager loading em `/sync`

**Tempo estimado**: 2-3 horas para Prioridade 1 + 2.


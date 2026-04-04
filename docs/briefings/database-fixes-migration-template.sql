-- ============================================================================
-- DATABASE AUDIT FIXES — Migration Template for claude-mastery
-- ============================================================================
-- This file contains SQL snippets to fix critical issues identified in the audit.
-- Copy these into Alembic migration files as needed.
--
-- Order of execution:
-- 1. Add missing columns (updated_at, deleted_at, created_at)
-- 2. Create indexes
-- 3. Add CHECK constraints
-- 4. Create trigger for automatic updated_at
-- ============================================================================

-- ============================================================================
-- PART 1: ADD MISSING TIMESTAMPS (Alembic migration)
-- ============================================================================

-- 1.1 Add updated_at to users table
ALTER TABLE users
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 1.2 Add timestamps to progress table
ALTER TABLE progress
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 1.3 Add updated_at to certificates table
ALTER TABLE certificates
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 1.4 Add timestamps to srs_cards table
ALTER TABLE srs_cards
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 1.5 Add timestamps to challenges table
ALTER TABLE challenges
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 1.6 Add timestamps to review_streaks table
ALTER TABLE review_streaks
ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================================================
-- PART 2: CREATE MISSING INDEXES (Alembic migration)
-- ============================================================================

-- 2.1 Foreign key indexes (critical for JOIN performance)
CREATE INDEX idx_progress_user_id ON progress(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_certificates_user_id ON certificates(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_srs_cards_user_id ON srs_cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_challenges_user_id ON challenges(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_review_streaks_user_id ON review_streaks(user_id) WHERE deleted_at IS NULL;

-- 2.2 Business logic indexes
CREATE INDEX idx_progress_chapter_id ON progress(chapter_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_srs_cards_chapter_id ON srs_cards(chapter_id) WHERE deleted_at IS NULL;

-- 2.3 SRS review scheduling (find due cards efficiently)
CREATE INDEX idx_srs_cards_next_review ON srs_cards(next_review, user_id) WHERE deleted_at IS NULL;

-- 2.4 Composite indexes for common queries
-- progress WHERE user_id AND chapter_id (already covered by unique constraint)
-- srs_cards WHERE user_id AND card_key (already covered by unique constraint)
-- challenges WHERE user_id AND challenge_id (already covered by unique constraint)

-- 2.5 Soft delete filter indexes
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_progress_deleted_at ON progress(deleted_at);
CREATE INDEX idx_certificates_deleted_at ON certificates(deleted_at);
CREATE INDEX idx_srs_cards_deleted_at ON srs_cards(deleted_at);
CREATE INDEX idx_challenges_deleted_at ON challenges(deleted_at);
CREATE INDEX idx_review_streaks_deleted_at ON review_streaks(deleted_at);

-- ============================================================================
-- PART 3: ADD CHECK CONSTRAINTS (Alembic migration)
-- ============================================================================

-- 3.1 SRS box range constraint (1-5)
ALTER TABLE srs_cards
ADD CONSTRAINT ck_srs_box_range CHECK (box >= 1 AND box <= 5);

-- 3.2 Progress score constraints (0-100)
ALTER TABLE progress
ADD CONSTRAINT ck_progress_score CHECK (score >= 0 AND score <= 100),
ADD CONSTRAINT ck_progress_calibration_score CHECK (calibration_score IS NULL OR (calibration_score >= 0 AND calibration_score <= 100));

-- 3.3 Certificate target type enum
ALTER TABLE certificates
ADD CONSTRAINT ck_certificate_target_type CHECK (target_type IN ('chapter', 'course'));

-- 3.4 Review count non-negative
ALTER TABLE srs_cards
ADD CONSTRAINT ck_srs_review_count CHECK (review_count >= 0);

-- 3.5 Streak counts non-negative
ALTER TABLE review_streaks
ADD CONSTRAINT ck_streak_current_nonneg CHECK (current_streak >= 0),
ADD CONSTRAINT ck_streak_longest_nonneg CHECK (longest_streak >= 0),
ADD CONSTRAINT ck_streak_total_nonneg CHECK (total_reviews >= 0);

-- 3.6 Challenge attempts non-negative
ALTER TABLE challenges
ADD CONSTRAINT ck_challenge_completed_at_logic CHECK (
    (completed = FALSE AND completed_at IS NULL) OR
    (completed = TRUE AND completed_at IS NOT NULL)
);

-- ============================================================================
-- PART 4: CREATE TRIGGER FOR AUTOMATIC updated_at (Alembic migration)
-- ============================================================================

-- 4.1 Create trigger function (once, reusable for all tables)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Attach trigger to users
CREATE TRIGGER trigger_users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 4.3 Attach trigger to progress
CREATE TRIGGER trigger_progress_update_timestamp
BEFORE UPDATE ON progress
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 4.4 Attach trigger to certificates
CREATE TRIGGER trigger_certificates_update_timestamp
BEFORE UPDATE ON certificates
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 4.5 Attach trigger to srs_cards
CREATE TRIGGER trigger_srs_cards_update_timestamp
BEFORE UPDATE ON srs_cards
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 4.6 Attach trigger to challenges
CREATE TRIGGER trigger_challenges_update_timestamp
BEFORE UPDATE ON challenges
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 4.7 Attach trigger to review_streaks
CREATE TRIGGER trigger_review_streaks_update_timestamp
BEFORE UPDATE ON review_streaks
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- PART 5: UPDATE EXISTING QUERIES TO FILTER SOFT DELETES (in routes.py)
-- ============================================================================

-- After adding deleted_at, update all queries like this:
-- BEFORE:
--   SELECT * FROM users WHERE id = :id
-- AFTER:
--   SELECT * FROM users WHERE id = :id AND deleted_at IS NULL

-- Note: This must be done in SQLAlchemy ORM using hybrid_property or query filters
-- See example below in the PART 6 section

-- ============================================================================
-- PART 6: SQLALCHEMY MODEL UPDATES
-- ============================================================================

-- Add these fields to models.py for each affected table:

-- users table:
-- from datetime import datetime
-- updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
-- deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

-- progress table:
-- created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
-- updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
-- deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

-- srs_cards table:
-- created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
-- updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
-- deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

-- certificates table:
-- updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
-- deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

-- challenges table:
-- created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
-- updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
-- deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

-- review_streaks table:
-- created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
-- updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
-- deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)

-- ============================================================================
-- PART 7: QUERY UPDATES IN routes.py (pseudocode)
-- ============================================================================

-- Option A: Add global filter with hybrid property (recommended)
-- In models.py, add:
-- @property
-- def is_deleted(self):
--     return self.deleted_at is not None

-- Then in routes.py, wrap queries with .where(Model.deleted_at.is_(None))

-- Option B: Manual filter in each query
-- from sqlalchemy import and_
-- await db.execute(
--     select(User)
--     .where(and_(User.id == user_id, User.deleted_at.is_(None)))
-- )

-- ============================================================================
-- PART 8: OPTIMIZE /sync ENDPOINT (eager loading)
-- ============================================================================

-- BEFORE (5 separate queries):
-- progress = await db.execute(select(Progress).where(Progress.user_id == user.id))
-- certs = await db.execute(select(Certificate).where(Certificate.user_id == user.id))
-- cards = await db.execute(select(SRSCard).where(SRSCard.user_id == user.id))
-- challenges = await db.execute(select(Challenge).where(Challenge.user_id == user.id))
-- streak = await db.execute(select(ReviewStreak).where(ReviewStreak.user_id == user.id))

-- AFTER (1 query with eager loading, in routes.py):
-- from sqlalchemy.orm import selectinload
-- stmt = select(User).where(User.id == user_id).options(
--     selectinload(User.progress),
--     selectinload(User.certificates),
--     selectinload(User.srs_cards),
--     selectinload(User.challenges),
--     selectinload(User.streak)
-- )
-- user = await db.execute(stmt)
-- user = user.scalar_one_or_none()
-- # Now use: user.progress, user.certificates, etc. without additional queries

-- ============================================================================
-- PART 9: VALIDATE JWT_SECRET AT STARTUP (in main.py)
-- ============================================================================

-- Add to FastAPI startup:
-- from fastapi import FastAPI
--
-- app = FastAPI()
--
-- @app.on_event("startup")
-- async def startup():
--     from app.config import JWT_SECRET
--     if not JWT_SECRET or JWT_SECRET == "":
--         raise RuntimeError(
--             "JWT_SECRET environment variable is not set. "
--             "Set it before starting the application."
--         )
--     print("JWT_SECRET validated ✓")

-- ============================================================================
-- PART 10: VALIDATION QUERIES (for testing)
-- ============================================================================

-- Verify all indexes created:
SELECT indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;

-- Verify all constraints added:
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name, constraint_type;

-- Verify triggers created:
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Test soft delete filtering:
SELECT COUNT(*) as total_rows FROM users;
SELECT COUNT(*) as active_rows FROM users WHERE deleted_at IS NULL;

-- Check for orphaned progress records (user deleted but progress remains):
SELECT p.* FROM progress p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- ============================================================================
-- MIGRATION ORDER FOR ALEMBIC
-- ============================================================================

-- File 1: add_timestamps_and_soft_delete.py
--   - Add created_at, updated_at, deleted_at columns
--
-- File 2: add_missing_indexes.py
--   - Create all 13 indexes
--
-- File 3: add_check_constraints.py
--   - Add CHECK constraints for box, score, target_type
--
-- File 4: add_update_timestamp_trigger.py
--   - Create trigger function and attach to all tables
--
-- After migrations applied:
-- - Update models.py to reflect new columns
-- - Update routes.py to filter by deleted_at IS NULL
-- - Update /sync endpoint to use eager loading
-- - Update main.py to validate JWT_SECRET

-- ============================================================================
-- ROLLBACK STRATEGY (downgrade functions in Alembic)
-- ============================================================================

-- Drop triggers first (dependencies):
-- DROP TRIGGER IF EXISTS trigger_users_update_timestamp ON users;
-- DROP TRIGGER IF EXISTS trigger_progress_update_timestamp ON progress;
-- -- ... (repeat for all 6 tables)
-- DROP FUNCTION IF EXISTS update_timestamp();

-- Drop constraints:
-- ALTER TABLE srs_cards DROP CONSTRAINT ck_srs_box_range;
-- ALTER TABLE progress DROP CONSTRAINT ck_progress_score;
-- -- ... (repeat for all constraints)

-- Drop indexes:
-- DROP INDEX IF EXISTS idx_progress_user_id;
-- DROP INDEX IF EXISTS idx_srs_cards_next_review;
-- -- ... (repeat for all indexes)

-- Drop columns (will lose data!):
-- ALTER TABLE users DROP COLUMN updated_at, DROP COLUMN deleted_at;
-- ALTER TABLE progress DROP COLUMN created_at, DROP COLUMN updated_at, DROP COLUMN deleted_at;
-- -- ... (repeat for all affected tables)

-- ============================================================================
-- PRODUCTION CHECKLIST
-- ============================================================================

-- [ ] Test migrations on staging database first
-- [ ] Backup production database before applying
-- [ ] Run migrations during maintenance window (low traffic)
-- [ ] Verify all indexes created: SELECT COUNT(*) FROM pg_indexes WHERE tablename IN (...)
-- [ ] Verify all constraints exist: SELECT * FROM information_schema.table_constraints WHERE ...
-- [ ] Test soft delete: INSERT test user, mark as deleted, verify it's hidden
-- [ ] Test eager loading on /sync endpoint: measure query time before/after
-- [ ] Update application code BEFORE running migrations (add column refs)
-- [ ] Monitor slow queries for 24 hours after deployment
-- [ ] Document rollback procedure in runbook

-- ============================================================================
-- REFERENCES
-- ============================================================================

-- PostgreSQL Documentation:
--   - Indexes: https://www.postgresql.org/docs/16/indexes.html
--   - Constraints: https://www.postgresql.org/docs/16/ddl-constraints.html
--   - Triggers: https://www.postgresql.org/docs/16/plpgsql-trigger.html
--   - Partial Indexes: https://www.postgresql.org/docs/16/indexes-partial.html
--
-- SQLAlchemy:
--   - Relationship loading: https://docs.sqlalchemy.org/en/20/orm/relationships.html#lazy-loading-strategies
--   - selectinload: https://docs.sqlalchemy.org/en/20/orm/loading_relationships.html#selectinload
--
-- Alembic:
--   - Tutorial: https://alembic.sqlalchemy.org/en/latest/tutorial.html
--   - Operation Reference: https://alembic.sqlalchemy.org/en/latest/ops.html

EOF
cat /home/ubuntu/dev/ssh/temp_/claude-mastery/docs/briefings/database-fixes-migration-template.sql

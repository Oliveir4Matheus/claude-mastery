"""Example Alembic Migration for Database Audit Fixes

This file shows how to implement the recommended changes from the database audit
in a real Alembic migration. Use this as a template for the actual migrations.

USAGE:
1. Generate a new migration: alembic revision --autogenerate -m "add_timestamps_and_indexes"
2. Replace the upgrade() and downgrade() functions with the code below
3. Run: alembic upgrade head
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'XXXXX001'  # Replace with actual revision ID from Alembic
down_revision: Union[str, None] = '678c718b2eb4'  # Previous migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Apply all database audit recommendations (Priority 1 & 2)"""

    # ========================================================================
    # STEP 1: Add missing timestamp columns (updated_at, deleted_at, created_at)
    # ========================================================================

    print(">>> Adding updated_at and deleted_at to users...")
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True),
                                     server_default=sa.func.current_timestamp(),
                                     nullable=False))
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(timezone=True),
                                     nullable=True))

    print(">>> Adding timestamps to progress...")
    op.add_column('progress', sa.Column('created_at', sa.DateTime(timezone=True),
                                        server_default=sa.func.current_timestamp(),
                                        nullable=False))
    op.add_column('progress', sa.Column('updated_at', sa.DateTime(timezone=True),
                                        server_default=sa.func.current_timestamp(),
                                        nullable=False))
    op.add_column('progress', sa.Column('deleted_at', sa.DateTime(timezone=True),
                                        nullable=True))

    print(">>> Adding timestamps to certificates...")
    op.add_column('certificates', sa.Column('updated_at', sa.DateTime(timezone=True),
                                            server_default=sa.func.current_timestamp(),
                                            nullable=False))
    op.add_column('certificates', sa.Column('deleted_at', sa.DateTime(timezone=True),
                                            nullable=True))

    print(">>> Adding timestamps to srs_cards...")
    op.add_column('srs_cards', sa.Column('created_at', sa.DateTime(timezone=True),
                                         server_default=sa.func.current_timestamp(),
                                         nullable=False))
    op.add_column('srs_cards', sa.Column('updated_at', sa.DateTime(timezone=True),
                                         server_default=sa.func.current_timestamp(),
                                         nullable=False))
    op.add_column('srs_cards', sa.Column('deleted_at', sa.DateTime(timezone=True),
                                         nullable=True))

    print(">>> Adding timestamps to challenges...")
    op.add_column('challenges', sa.Column('created_at', sa.DateTime(timezone=True),
                                          server_default=sa.func.current_timestamp(),
                                          nullable=False))
    op.add_column('challenges', sa.Column('updated_at', sa.DateTime(timezone=True),
                                          server_default=sa.func.current_timestamp(),
                                          nullable=False))
    op.add_column('challenges', sa.Column('deleted_at', sa.DateTime(timezone=True),
                                          nullable=True))

    print(">>> Adding timestamps to review_streaks...")
    op.add_column('review_streaks', sa.Column('created_at', sa.DateTime(timezone=True),
                                              server_default=sa.func.current_timestamp(),
                                              nullable=False))
    op.add_column('review_streaks', sa.Column('updated_at', sa.DateTime(timezone=True),
                                              server_default=sa.func.current_timestamp(),
                                              nullable=False))
    op.add_column('review_streaks', sa.Column('deleted_at', sa.DateTime(timezone=True),
                                              nullable=True))

    # ========================================================================
    # STEP 2: Create missing indexes (CRITICAL for performance)
    # ========================================================================

    print(">>> Creating foreign key indexes...")
    op.create_index('idx_progress_user_id', 'progress', ['user_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_certificates_user_id', 'certificates', ['user_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_srs_cards_user_id', 'srs_cards', ['user_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_challenges_user_id', 'challenges', ['user_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_review_streaks_user_id', 'review_streaks', ['user_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))

    print(">>> Creating business logic indexes...")
    op.create_index('idx_progress_chapter_id', 'progress', ['chapter_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))
    op.create_index('idx_srs_cards_chapter_id', 'srs_cards', ['chapter_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))

    print(">>> Creating SRS scheduling index...")
    op.create_index('idx_srs_cards_next_review', 'srs_cards', ['next_review', 'user_id'],
                   postgresql_where=sa.text("deleted_at IS NULL"))

    print(">>> Creating soft delete filter indexes...")
    op.create_index('idx_users_deleted_at', 'users', ['deleted_at'])
    op.create_index('idx_progress_deleted_at', 'progress', ['deleted_at'])
    op.create_index('idx_certificates_deleted_at', 'certificates', ['deleted_at'])
    op.create_index('idx_srs_cards_deleted_at', 'srs_cards', ['deleted_at'])
    op.create_index('idx_challenges_deleted_at', 'challenges', ['deleted_at'])
    op.create_index('idx_review_streaks_deleted_at', 'review_streaks', ['deleted_at'])

    # ========================================================================
    # STEP 3: Add CHECK constraints (data integrity)
    # ========================================================================

    print(">>> Adding CHECK constraints...")
    op.create_check_constraint(
        'ck_srs_box_range',
        'srs_cards',
        'box >= 1 AND box <= 5'
    )

    op.create_check_constraint(
        'ck_progress_score',
        'progress',
        'score >= 0 AND score <= 100'
    )

    op.create_check_constraint(
        'ck_progress_calibration_score',
        'progress',
        'calibration_score IS NULL OR (calibration_score >= 0 AND calibration_score <= 100)'
    )

    op.create_check_constraint(
        'ck_certificate_target_type',
        'certificates',
        "target_type IN ('chapter', 'course')"
    )

    op.create_check_constraint(
        'ck_srs_review_count',
        'srs_cards',
        'review_count >= 0'
    )

    op.create_check_constraint(
        'ck_streak_current_nonneg',
        'review_streaks',
        'current_streak >= 0'
    )

    op.create_check_constraint(
        'ck_streak_longest_nonneg',
        'review_streaks',
        'longest_streak >= 0'
    )

    op.create_check_constraint(
        'ck_streak_total_nonneg',
        'review_streaks',
        'total_reviews >= 0'
    )

    op.create_check_constraint(
        'ck_challenge_completed_at_logic',
        'challenges',
        '(completed = FALSE AND completed_at IS NULL) OR (completed = TRUE AND completed_at IS NOT NULL)'
    )

    # ========================================================================
    # STEP 4: Create trigger for automatic updated_at
    # ========================================================================

    print(">>> Creating update_timestamp trigger function...")
    op.execute("""
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    print(">>> Attaching triggers to all tables...")
    for table_name in ['users', 'progress', 'certificates', 'srs_cards', 'challenges', 'review_streaks']:
        trigger_name = f'trigger_{table_name}_update_timestamp'
        op.execute(f"""
            CREATE TRIGGER {trigger_name}
            BEFORE UPDATE ON {table_name}
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """)

    # ========================================================================
    # STEP 5: Print summary
    # ========================================================================

    print("\n" + "="*70)
    print("MIGRATION COMPLETE!")
    print("="*70)
    print("Added:")
    print("  - 6 new timestamp columns (created_at, updated_at, deleted_at)")
    print("  - 13 new indexes (FK, business logic, scheduling, soft delete)")
    print("  - 9 CHECK constraints (data integrity)")
    print("  - 1 trigger function + 6 triggers (automatic updated_at)")
    print("\nNEXT STEPS:")
    print("  1. Update models.py to include new columns")
    print("  2. Update routes.py to filter by deleted_at IS NULL")
    print("  3. Update /sync endpoint to use eager loading (selectinload)")
    print("  4. Update main.py to validate JWT_SECRET at startup")
    print("  5. Restart application and test")
    print("="*70)


def downgrade() -> None:
    """Rollback all changes"""

    print(">>> WARNING: This will destroy all data. Proceeding with rollback...")

    # Drop triggers first (dependencies)
    print(">>> Dropping triggers...")
    for table_name in ['users', 'progress', 'certificates', 'srs_cards', 'challenges', 'review_streaks']:
        trigger_name = f'trigger_{table_name}_update_timestamp'
        op.execute(f"DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};")

    # Drop trigger function
    print(">>> Dropping trigger function...")
    op.execute("DROP FUNCTION IF EXISTS update_timestamp();")

    # Drop constraints
    print(">>> Dropping CHECK constraints...")
    constraints = [
        ('srs_cards', 'ck_srs_box_range'),
        ('progress', 'ck_progress_score'),
        ('progress', 'ck_progress_calibration_score'),
        ('certificates', 'ck_certificate_target_type'),
        ('srs_cards', 'ck_srs_review_count'),
        ('review_streaks', 'ck_streak_current_nonneg'),
        ('review_streaks', 'ck_streak_longest_nonneg'),
        ('review_streaks', 'ck_streak_total_nonneg'),
        ('challenges', 'ck_challenge_completed_at_logic'),
    ]
    for table_name, constraint_name in constraints:
        op.drop_constraint(constraint_name, table_name, type_='check')

    # Drop indexes
    print(">>> Dropping indexes...")
    indexes = [
        'idx_progress_user_id',
        'idx_certificates_user_id',
        'idx_srs_cards_user_id',
        'idx_challenges_user_id',
        'idx_review_streaks_user_id',
        'idx_progress_chapter_id',
        'idx_srs_cards_chapter_id',
        'idx_srs_cards_next_review',
        'idx_users_deleted_at',
        'idx_progress_deleted_at',
        'idx_certificates_deleted_at',
        'idx_srs_cards_deleted_at',
        'idx_challenges_deleted_at',
        'idx_review_streaks_deleted_at',
    ]
    for index_name in indexes:
        op.drop_index(index_name)

    # Drop columns
    print(">>> Dropping timestamp columns...")
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'deleted_at')

    op.drop_column('progress', 'created_at')
    op.drop_column('progress', 'updated_at')
    op.drop_column('progress', 'deleted_at')

    op.drop_column('certificates', 'updated_at')
    op.drop_column('certificates', 'deleted_at')

    op.drop_column('srs_cards', 'created_at')
    op.drop_column('srs_cards', 'updated_at')
    op.drop_column('srs_cards', 'deleted_at')

    op.drop_column('challenges', 'created_at')
    op.drop_column('challenges', 'updated_at')
    op.drop_column('challenges', 'deleted_at')

    op.drop_column('review_streaks', 'created_at')
    op.drop_column('review_streaks', 'updated_at')
    op.drop_column('review_streaks', 'deleted_at')

    print("\n" + "="*70)
    print("ROLLBACK COMPLETE!")
    print("="*70)
    print("WARNING: All new columns, indexes, and constraints have been removed.")
    print("This is for development/testing only. Do NOT use in production!")
    print("="*70)

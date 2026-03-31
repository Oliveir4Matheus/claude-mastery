import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/claude_mastery',
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        chapter_id VARCHAR(20) NOT NULL,
        score INTEGER DEFAULT 0,
        passed BOOLEAN DEFAULT FALSE,
        attempts INTEGER DEFAULT 0,
        calibration_score INTEGER,
        last_attempt TIMESTAMPTZ,
        question_results JSONB,
        UNIQUE(user_id, chapter_id)
      );

      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        code VARCHAR(14) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        holder_name VARCHAR(120) NOT NULL,
        target_type VARCHAR(10) NOT NULL DEFAULT 'chapter',
        target_id VARCHAR(20) NOT NULL,
        target_title VARCHAR(200) NOT NULL,
        score INTEGER NOT NULL,
        issued_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS srs_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        card_key VARCHAR(30) NOT NULL,
        chapter_id VARCHAR(20) NOT NULL,
        question_index INTEGER NOT NULL,
        box INTEGER DEFAULT 1,
        next_review DATE NOT NULL,
        last_review DATE,
        review_count INTEGER DEFAULT 0,
        correct_streak INTEGER DEFAULT 0,
        UNIQUE(user_id, card_key)
      );

      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        challenge_id VARCHAR(30) UNIQUE NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS review_streaks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_review_date DATE,
        total_reviews INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(code);
      CREATE INDEX IF NOT EXISTS idx_srs_user_review ON srs_cards(user_id, next_review);
      CREATE INDEX IF NOT EXISTS idx_challenges_user ON challenges(user_id);
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

export default pool;

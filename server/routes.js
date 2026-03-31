import { Router } from 'express';
import pool from './db.js';
import { authMiddleware, register, login, me } from './auth.js';

const router = Router();

// ── Auth ──
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, me);

// ── Progress ──
router.get('/progress', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM progress WHERE user_id = $1', [req.userId]);
  res.json(result.rows);
});

router.put('/progress/:chapterId', authMiddleware, async (req, res) => {
  const { chapterId } = req.params;
  const { score, passed, calibrationScore, questionResults } = req.body;

  const result = await pool.query(`
    INSERT INTO progress (user_id, chapter_id, score, passed, attempts, calibration_score, question_results, last_attempt)
    VALUES ($1, $2, $3, $4, 1, $5, $6, NOW())
    ON CONFLICT (user_id, chapter_id) DO UPDATE SET
      score = GREATEST(progress.score, $3),
      passed = progress.passed OR $4,
      attempts = progress.attempts + 1,
      calibration_score = COALESCE($5, progress.calibration_score),
      question_results = COALESCE($6, progress.question_results),
      last_attempt = NOW()
    RETURNING *
  `, [req.userId, chapterId, score, passed, calibrationScore || null, questionResults ? JSON.stringify(questionResults) : null]);

  res.json(result.rows[0]);
});

router.delete('/progress/:chapterId', authMiddleware, async (req, res) => {
  await pool.query('DELETE FROM progress WHERE user_id = $1 AND chapter_id = $2', [req.userId, req.params.chapterId]);
  await pool.query('DELETE FROM srs_cards WHERE user_id = $1 AND chapter_id = $2', [req.userId, req.params.chapterId]);
  res.json({ ok: true });
});

// ── Certificates ──
router.post('/certificates', authMiddleware, async (req, res) => {
  const { code, holderName, targetType, targetId, targetTitle, score } = req.body;
  if (!code || !holderName || !targetId || !targetTitle) {
    return res.status(400).json({ error: 'Campos obrigatorios: code, holderName, targetId, targetTitle' });
  }

  const result = await pool.query(`
    INSERT INTO certificates (code, user_id, holder_name, target_type, target_id, target_title, score)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (code) DO NOTHING
    RETURNING *
  `, [code, req.userId, holderName, targetType || 'chapter', targetId, targetTitle, score || 0]);

  res.status(201).json(result.rows[0] || { exists: true });
});

router.get('/certificates', authMiddleware, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC',
    [req.userId]
  );
  res.json(result.rows);
});

// Public validation endpoint (no auth)
router.get('/validate/:code', async (req, res) => {
  const result = await pool.query(`
    SELECT c.code, c.holder_name, c.target_type, c.target_id, c.target_title, c.score, c.issued_at,
           u.name as user_name
    FROM certificates c
    JOIN users u ON u.id = c.user_id
    WHERE c.code = $1
  `, [req.params.code]);

  if (!result.rows[0]) return res.status(404).json({ valid: false, error: 'Certificado nao encontrado' });
  res.json({ valid: true, certificate: result.rows[0] });
});

// ── SRS Cards ──
router.get('/srs/cards', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM srs_cards WHERE user_id = $1', [req.userId]);
  res.json(result.rows);
});

router.get('/srs/due', authMiddleware, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM srs_cards WHERE user_id = $1 AND next_review <= CURRENT_DATE ORDER BY box ASC',
    [req.userId]
  );
  res.json(result.rows);
});

router.post('/srs/init/:chapterId', authMiddleware, async (req, res) => {
  const { chapterId } = req.params;
  const { questionCount } = req.body;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  for (let i = 0; i < questionCount; i++) {
    const key = `${chapterId}-q${i}`;
    await pool.query(`
      INSERT INTO srs_cards (user_id, card_key, chapter_id, question_index, box, next_review, last_review)
      VALUES ($1, $2, $3, $4, 1, $5, CURRENT_DATE)
      ON CONFLICT (user_id, card_key) DO NOTHING
    `, [req.userId, key, chapterId, i, tomorrowStr]);
  }
  res.json({ ok: true });
});

router.put('/srs/review/:cardKey', authMiddleware, async (req, res) => {
  const { correct } = req.body;
  const intervals = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

  const card = await pool.query(
    'SELECT * FROM srs_cards WHERE user_id = $1 AND card_key = $2',
    [req.userId, req.params.cardKey]
  );
  if (!card.rows[0]) return res.status(404).json({ error: 'Card nao encontrado' });

  const c = card.rows[0];
  const newBox = correct ? Math.min(c.box + 1, 5) : 1;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervals[newBox]);

  await pool.query(`
    UPDATE srs_cards SET box = $1, next_review = $2, last_review = CURRENT_DATE,
      review_count = review_count + 1, correct_streak = $3
    WHERE user_id = $4 AND card_key = $5
  `, [newBox, nextDate.toISOString().slice(0, 10), correct ? c.correct_streak + 1 : 0, req.userId, req.params.cardKey]);

  // Update streak
  await pool.query(`
    INSERT INTO review_streaks (user_id, current_streak, longest_streak, last_review_date, total_reviews)
    VALUES ($1, 1, 1, CURRENT_DATE, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak = CASE
        WHEN review_streaks.last_review_date = CURRENT_DATE - INTERVAL '1 day' THEN review_streaks.current_streak + 1
        WHEN review_streaks.last_review_date = CURRENT_DATE THEN review_streaks.current_streak
        ELSE 1
      END,
      longest_streak = GREATEST(review_streaks.longest_streak,
        CASE
          WHEN review_streaks.last_review_date = CURRENT_DATE - INTERVAL '1 day' THEN review_streaks.current_streak + 1
          ELSE 1
        END),
      last_review_date = CURRENT_DATE,
      total_reviews = review_streaks.total_reviews + 1
  `, [req.userId]);

  res.json({ ok: true });
});

router.get('/srs/streak', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM review_streaks WHERE user_id = $1', [req.userId]);
  res.json(result.rows[0] || { current_streak: 0, longest_streak: 0, total_reviews: 0 });
});

// ── Challenges ──
router.get('/challenges', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM challenges WHERE user_id = $1', [req.userId]);
  res.json(result.rows);
});

router.put('/challenges/:challengeId', authMiddleware, async (req, res) => {
  const { completed } = req.body;
  if (completed) {
    await pool.query(`
      INSERT INTO challenges (user_id, challenge_id, completed, completed_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (challenge_id) DO UPDATE SET completed = true, completed_at = NOW()
    `, [req.userId, req.params.challengeId]);
  } else {
    await pool.query('DELETE FROM challenges WHERE user_id = $1 AND challenge_id = $2', [req.userId, req.params.challengeId]);
  }
  res.json({ ok: true });
});

// ── Full sync (download all user data) ──
router.get('/sync', authMiddleware, async (req, res) => {
  const [progress, certs, cards, challenges, streak] = await Promise.all([
    pool.query('SELECT * FROM progress WHERE user_id = $1', [req.userId]),
    pool.query('SELECT * FROM certificates WHERE user_id = $1 ORDER BY issued_at DESC', [req.userId]),
    pool.query('SELECT * FROM srs_cards WHERE user_id = $1', [req.userId]),
    pool.query('SELECT * FROM challenges WHERE user_id = $1', [req.userId]),
    pool.query('SELECT * FROM review_streaks WHERE user_id = $1', [req.userId]),
  ]);

  res.json({
    progress: progress.rows,
    certificates: certs.rows,
    srsCards: cards.rows,
    challenges: challenges.rows,
    streak: streak.rows[0] || { current_streak: 0, longest_streak: 0, total_reviews: 0 },
  });
});

export default router;

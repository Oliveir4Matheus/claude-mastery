import { useState, useEffect, useCallback } from 'react';
import { apiSaveProgress, apiResetChapter as apiResetChapterAPI, apiToggleChallenge, isLoggedIn } from '../api';

const STORAGE_KEY = 'claude-mastery-progress-v2';
const OLD_KEY = 'claude-mastery-progress-v1';

const defaultProgress = {
  currentPage: 0,
  passedChapters: [],
  quizResults: {},
  challenges: {},
  lastSaved: null,
};

function load() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultProgress, ...JSON.parse(raw) };
    raw = localStorage.getItem(OLD_KEY);
    if (raw) {
      const old = JSON.parse(raw);
      const migrated = { ...defaultProgress, currentPage: old.currentPage || 0, passedChapters: old.passedChapters || [], quizResults: old.quizResults || {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...migrated, lastSaved: new Date().toISOString() }));
      return migrated;
    }
    return defaultProgress;
  } catch { return defaultProgress; }
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastSaved: new Date().toISOString() })); } catch {}
}

// Fire-and-forget API sync
function syncToAPI(chapterId, data) {
  if (!isLoggedIn()) return;
  apiSaveProgress(chapterId, data).catch(() => {});
}

export function useProgress() {
  const [progress, setProgress] = useState(load);

  useEffect(() => { save(progress); }, [progress]);

  // Hydrate from server data
  const hydrateFromServer = useCallback((serverData) => {
    if (!serverData) return;
    const { progress: rows, challenges: challRows } = serverData;
    setProgress(p => {
      const passedChapters = [...new Set([...p.passedChapters, ...rows.filter(r => r.passed).map(r => r.chapter_id)])];
      const quizResults = { ...p.quizResults };
      rows.forEach(r => {
        const existing = quizResults[r.chapter_id];
        if (!existing || r.score > (existing.score || 0)) {
          quizResults[r.chapter_id] = {
            score: r.score, passed: r.passed, attempts: r.attempts,
            lastAttempt: r.last_attempt, calibrationScore: r.calibration_score,
            questionResults: r.question_results,
          };
        }
      });
      const challenges = { ...p.challenges };
      challRows?.forEach(c => {
        if (c.completed) challenges[c.challenge_id] = { completed: true, completedAt: c.completed_at };
      });
      return { ...p, passedChapters, quizResults, challenges };
    });
  }, []);

  const saveCurrentPage = useCallback((page) => {
    setProgress(p => { if (p.currentPage === page) return p; return { ...p, currentPage: page }; });
  }, []);

  const recordQuizResult = useCallback((chapterId, score, passed, questionResults = null) => {
    const calScore = questionResults
      ? Math.round((questionResults.filter(q => q.calibrated).length / questionResults.length) * 100)
      : undefined;

    setProgress(p => ({
      ...p,
      passedChapters: passed && !p.passedChapters.includes(chapterId)
        ? [...p.passedChapters, chapterId] : p.passedChapters,
      quizResults: {
        ...p.quizResults,
        [chapterId]: {
          score, passed,
          attempts: (p.quizResults[chapterId]?.attempts || 0) + 1,
          lastAttempt: new Date().toISOString(),
          ...(questionResults ? { questionResults } : {}),
          calibrationScore: calScore ?? p.quizResults[chapterId]?.calibrationScore,
        },
      },
    }));

    // Sync to API
    syncToAPI(chapterId, { score, passed, calibrationScore: calScore, questionResults });
  }, []);

  const completeChallenge = useCallback((challengeId) => {
    setProgress(p => ({
      ...p, challenges: { ...p.challenges, [challengeId]: { completed: true, completedAt: new Date().toISOString() } },
    }));
    if (isLoggedIn()) apiToggleChallenge(challengeId, true).catch(() => {});
  }, []);

  const uncompleteChallenge = useCallback((challengeId) => {
    setProgress(p => { const { [challengeId]: _, ...rest } = p.challenges; return { ...p, challenges: rest }; });
    if (isLoggedIn()) apiToggleChallenge(challengeId, false).catch(() => {});
  }, []);

  const resetProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(OLD_KEY);
    setProgress(defaultProgress);
  }, []);

  const resetChapter = useCallback((chapterId) => {
    setProgress(p => ({
      ...p,
      passedChapters: p.passedChapters.filter(id => id !== chapterId),
      quizResults: Object.fromEntries(Object.entries(p.quizResults).filter(([id]) => id !== chapterId)),
    }));
    if (isLoggedIn()) apiResetChapterAPI(chapterId).catch(() => {});
  }, []);

  return { progress, saveCurrentPage, recordQuizResult, completeChallenge, uncompleteChallenge, resetProgress, resetChapter, hydrateFromServer };
}

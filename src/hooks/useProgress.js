import { useState, useEffect, useCallback } from 'react';

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
    // Try v2 first
    let raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultProgress, ...JSON.parse(raw) };

    // Migrate from v1
    raw = localStorage.getItem(OLD_KEY);
    if (raw) {
      const old = JSON.parse(raw);
      const migrated = {
        ...defaultProgress,
        currentPage: old.currentPage || 0,
        passedChapters: old.passedChapters || [],
        quizResults: old.quizResults || {},
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...migrated, lastSaved: new Date().toISOString() }));
      return migrated;
    }
    return defaultProgress;
  } catch {
    return defaultProgress;
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastSaved: new Date().toISOString() }));
  } catch {
    // storage full or unavailable
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(load);

  useEffect(() => {
    save(progress);
  }, [progress]);

  const saveCurrentPage = useCallback((page) => {
    setProgress(p => {
      if (p.currentPage === page) return p;
      return { ...p, currentPage: page };
    });
  }, []);

  // Extended: stores question-level detail for calibration + SRS
  const recordQuizResult = useCallback((chapterId, score, passed, questionResults = null) => {
    setProgress(p => ({
      ...p,
      passedChapters: passed && !p.passedChapters.includes(chapterId)
        ? [...p.passedChapters, chapterId]
        : p.passedChapters,
      quizResults: {
        ...p.quizResults,
        [chapterId]: {
          score,
          passed,
          attempts: (p.quizResults[chapterId]?.attempts || 0) + 1,
          lastAttempt: new Date().toISOString(),
          ...(questionResults ? { questionResults } : {}),
          calibrationScore: questionResults
            ? Math.round((questionResults.filter(q => q.calibrated).length / questionResults.length) * 100)
            : p.quizResults[chapterId]?.calibrationScore,
        },
      },
    }));
  }, []);

  const completeChallenge = useCallback((challengeId) => {
    setProgress(p => ({
      ...p,
      challenges: {
        ...p.challenges,
        [challengeId]: { completed: true, completedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const uncompleteChallenge = useCallback((challengeId) => {
    setProgress(p => {
      const { [challengeId]: _, ...rest } = p.challenges;
      return { ...p, challenges: rest };
    });
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
      quizResults: Object.fromEntries(
        Object.entries(p.quizResults).filter(([id]) => id !== chapterId)
      ),
    }));
  }, []);

  return {
    progress,
    saveCurrentPage,
    recordQuizResult,
    completeChallenge,
    uncompleteChallenge,
    resetProgress,
    resetChapter,
  };
}

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'claude-mastery-progress-v1';

const defaultProgress = {
  currentPage: 0,
  passedChapters: [],
  quizResults: {},
  lastSaved: null,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return defaultProgress;
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastSaved: new Date().toISOString() }));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(load);

  // Persiste toda vez que o estado muda
  useEffect(() => {
    save(progress);
  }, [progress]);

  // Salva a página atual
  const saveCurrentPage = useCallback((page) => {
    setProgress(p => {
      if (p.currentPage === page) return p;
      return { ...p, currentPage: page };
    });
  }, []);

  // Registra resultado do quiz
  const recordQuizResult = useCallback((chapterId, score, passed) => {
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
        },
      },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProgress(defaultProgress);
  }, []);

  return { progress, saveCurrentPage, recordQuizResult, resetProgress };
}

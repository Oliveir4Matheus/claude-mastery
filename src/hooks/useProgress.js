import { useState, useCallback } from 'react';
import { apiSaveProgress, apiResetChapter, apiToggleChallenge, apiSavePage } from '../api';

const defaultProgress = {
  currentPage: 0,
  passedChapters: [],
  quizResults: {},
  challenges: {},
};

export function useProgress() {
  const [progress, setProgress] = useState(defaultProgress);

  // Hydrate from server sync response
  const hydrateFromServer = useCallback((data) => {
    if (!data) return;
    const passedChapters = data.progress.filter(r => r.passed).map(r => r.chapter_id);
    const quizResults = {};
    data.progress.forEach(r => {
      quizResults[r.chapter_id] = {
        score: r.score, passed: r.passed, attempts: r.attempts,
        lastAttempt: r.last_attempt, calibrationScore: r.calibration_score,
        questionResults: r.question_results,
      };
    });
    const challenges = {};
    data.challenges?.forEach(c => {
      if (c.completed) challenges[c.challenge_id] = { completed: true, completedAt: c.completed_at };
    });
    setProgress({ currentPage: data.current_page || 0, passedChapters, quizResults, challenges });
  }, []);

  const saveCurrentPage = useCallback((page) => {
    setProgress(p => { if (p.currentPage === page) return p; return { ...p, currentPage: page }; });
    apiSavePage(page).catch(() => {});
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

    apiSaveProgress(chapterId, { score, passed, calibration_score: calScore, question_results: questionResults }).catch(() => {});
  }, []);

  const completeChallenge = useCallback((challengeId) => {
    setProgress(p => ({
      ...p, challenges: { ...p.challenges, [challengeId]: { completed: true, completedAt: new Date().toISOString() } },
    }));
    apiToggleChallenge(challengeId, true).catch(() => {});
  }, []);

  const uncompleteChallenge = useCallback((challengeId) => {
    setProgress(p => { const { [challengeId]: _, ...rest } = p.challenges; return { ...p, challenges: rest }; });
    apiToggleChallenge(challengeId, false).catch(() => {});
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
  }, []);

  const resetChapter = useCallback((chapterId) => {
    setProgress(p => ({
      ...p,
      passedChapters: p.passedChapters.filter(id => id !== chapterId),
      quizResults: Object.fromEntries(Object.entries(p.quizResults).filter(([id]) => id !== chapterId)),
    }));
    apiResetChapter(chapterId).catch(() => {});
  }, []);

  return { progress, saveCurrentPage, recordQuizResult, completeChallenge, uncompleteChallenge, resetProgress, resetChapter, hydrateFromServer };
}

import { useState, useEffect, useCallback, useMemo } from 'react';

const SRS_KEY = 'claude-mastery-srs-v1';
const INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }; // days per Leitner box

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / 86400000);
}

const defaultSRS = {
  cards: {},
  streak: { current: 0, lastReviewDate: null, longest: 0 },
  totalReviews: 0,
};

function loadSRS() {
  try {
    const raw = localStorage.getItem(SRS_KEY);
    if (!raw) return defaultSRS;
    return { ...defaultSRS, ...JSON.parse(raw) };
  } catch {
    return defaultSRS;
  }
}

function saveSRS(data) {
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(data));
  } catch {}
}

export function useSpacedRepetition() {
  const [srs, setSRS] = useState(loadSRS);

  useEffect(() => {
    saveSRS(srs);
  }, [srs]);

  // Initialize cards for a chapter when quiz is passed
  const initChapterCards = useCallback((chapterId, questionCount) => {
    setSRS(s => {
      const newCards = { ...s.cards };
      const t = today();
      const nextDay = addDays(t, 1);
      for (let i = 0; i < questionCount; i++) {
        const key = `${chapterId}-q${i}`;
        if (!newCards[key]) {
          newCards[key] = {
            chapterId,
            questionIndex: i,
            box: 1,
            nextReview: nextDay,
            lastReview: t,
            reviewCount: 0,
            correctStreak: 0,
          };
        }
      }
      return { ...s, cards: newCards };
    });
  }, []);

  // Remove cards for a chapter (when resetting)
  const removeChapterCards = useCallback((chapterId) => {
    setSRS(s => ({
      ...s,
      cards: Object.fromEntries(
        Object.entries(s.cards).filter(([_, c]) => c.chapterId !== chapterId)
      ),
    }));
  }, []);

  // Process a single card review
  const processReview = useCallback((cardId, correct) => {
    setSRS(s => {
      const card = s.cards[cardId];
      if (!card) return s;

      const t = today();
      const newBox = correct ? Math.min(card.box + 1, 5) : 1;

      const updatedCard = {
        ...card,
        box: newBox,
        nextReview: addDays(t, INTERVALS[newBox]),
        lastReview: t,
        reviewCount: card.reviewCount + 1,
        correctStreak: correct ? card.correctStreak + 1 : 0,
      };

      // Update streak
      const streak = { ...s.streak };
      if (streak.lastReviewDate !== t) {
        const daysSince = streak.lastReviewDate ? daysBetween(streak.lastReviewDate, t) : 999;
        if (daysSince === 1) {
          streak.current += 1;
        } else if (daysSince > 1) {
          streak.current = 1;
        }
        streak.lastReviewDate = t;
        streak.longest = Math.max(streak.longest, streak.current);
      }

      return {
        ...s,
        cards: { ...s.cards, [cardId]: updatedCard },
        streak,
        totalReviews: s.totalReviews + 1,
      };
    });
  }, []);

  // Get cards due for review today
  const dueCards = useMemo(() => {
    const t = today();
    return Object.entries(srs.cards)
      .filter(([_, c]) => c.nextReview <= t)
      .map(([id, c]) => ({ id, ...c }))
      .sort((a, b) => a.box - b.box); // prioritize lower boxes
  }, [srs.cards]);

  // Get all cards (for analytics)
  const allCards = useMemo(() => {
    return Object.entries(srs.cards).map(([id, c]) => ({ id, ...c }));
  }, [srs.cards]);

  // Box distribution
  const boxDistribution = useMemo(() => {
    const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    Object.values(srs.cards).forEach(c => { dist[c.box] = (dist[c.box] || 0) + 1; });
    return dist;
  }, [srs.cards]);

  // Decay level per chapter (for JourneyMap rings)
  // Returns 0-1 where 0 = just reviewed, 1 = very overdue
  const getChapterDecay = useCallback((chapterId) => {
    const t = today();
    const chapterCards = Object.values(srs.cards).filter(c => c.chapterId === chapterId);
    if (chapterCards.length === 0) return 0;

    const avgOverdue = chapterCards.reduce((sum, c) => {
      const overdueDays = Math.max(0, daysBetween(c.nextReview, t));
      return sum + overdueDays;
    }, 0) / chapterCards.length;

    return Math.min(1, avgOverdue / 14); // cap at 14 days overdue = fully decayed
  }, [srs.cards]);

  return {
    srs,
    dueCards,
    allCards,
    boxDistribution,
    streak: srs.streak,
    totalReviews: srs.totalReviews,
    initChapterCards,
    removeChapterCards,
    processReview,
    getChapterDecay,
  };
}

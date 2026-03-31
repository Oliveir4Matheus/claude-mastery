import { useState, useCallback, useMemo } from 'react';
import { apiInitSRS, apiReviewCard } from '../api';

const INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }

const defaultSRS = { cards: {}, streak: { current: 0, lastReviewDate: null, longest: 0 }, totalReviews: 0 };

export function useSpacedRepetition() {
  const [srs, setSRS] = useState(defaultSRS);

  const hydrateFromServer = useCallback((data) => {
    if (!data) return;
    const cards = {};
    data.srs_cards?.forEach(c => {
      cards[c.card_key] = {
        chapterId: c.chapter_id, questionIndex: c.question_index,
        box: c.box, nextReview: c.next_review?.slice?.(0, 10) || c.next_review,
        lastReview: c.last_review?.slice?.(0, 10) || c.last_review,
        reviewCount: c.review_count, correctStreak: c.correct_streak,
      };
    });
    const s = data.streak || {};
    setSRS({
      cards,
      streak: { current: s.current_streak || 0, longest: s.longest_streak || 0, lastReviewDate: s.last_review_date?.slice?.(0, 10) || s.last_review_date },
      totalReviews: s.total_reviews || 0,
    });
  }, []);

  const initChapterCards = useCallback((chapterId, questionCount) => {
    const t = today(), next = addDays(t, 1);
    setSRS(s => {
      const newCards = { ...s.cards };
      for (let i = 0; i < questionCount; i++) {
        const key = `${chapterId}-q${i}`;
        if (!newCards[key]) newCards[key] = { chapterId, questionIndex: i, box: 1, nextReview: next, lastReview: t, reviewCount: 0, correctStreak: 0 };
      }
      return { ...s, cards: newCards };
    });
    apiInitSRS(chapterId, questionCount).catch(() => {});
  }, []);

  const removeChapterCards = useCallback((chapterId) => {
    setSRS(s => ({ ...s, cards: Object.fromEntries(Object.entries(s.cards).filter(([_, c]) => c.chapterId !== chapterId)) }));
  }, []);

  const processReview = useCallback((cardId, correct) => {
    setSRS(s => {
      const card = s.cards[cardId];
      if (!card) return s;
      const t = today();
      const newBox = correct ? Math.min(card.box + 1, 5) : 1;
      const updatedCard = { ...card, box: newBox, nextReview: addDays(t, INTERVALS[newBox]), lastReview: t, reviewCount: card.reviewCount + 1, correctStreak: correct ? card.correctStreak + 1 : 0 };
      const streak = { ...s.streak };
      if (streak.lastReviewDate !== t) {
        const d = streak.lastReviewDate ? daysBetween(streak.lastReviewDate, t) : 999;
        streak.current = d === 1 ? streak.current + 1 : 1;
        streak.lastReviewDate = t;
        streak.longest = Math.max(streak.longest, streak.current);
      }
      return { ...s, cards: { ...s.cards, [cardId]: updatedCard }, streak, totalReviews: s.totalReviews + 1 };
    });
    apiReviewCard(cardId, correct).catch(() => {});
  }, []);

  const dueCards = useMemo(() => {
    const t = today();
    return Object.entries(srs.cards).filter(([_, c]) => c.nextReview <= t).map(([id, c]) => ({ id, ...c })).sort((a, b) => a.box - b.box);
  }, [srs.cards]);

  const allCards = useMemo(() => Object.entries(srs.cards).map(([id, c]) => ({ id, ...c })), [srs.cards]);

  const boxDistribution = useMemo(() => {
    const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    Object.values(srs.cards).forEach(c => { d[c.box] = (d[c.box] || 0) + 1; });
    return d;
  }, [srs.cards]);

  const getChapterDecay = useCallback((chapterId) => {
    const t = today();
    const ch = Object.values(srs.cards).filter(c => c.chapterId === chapterId);
    if (!ch.length) return 0;
    return Math.min(1, ch.reduce((s, c) => s + Math.max(0, daysBetween(c.nextReview, t)), 0) / ch.length / 14);
  }, [srs.cards]);

  return { srs, dueCards, allCards, boxDistribution, streak: srs.streak, totalReviews: srs.totalReviews, initChapterCards, removeChapterCards, processReview, getChapterDecay, hydrateFromServer };
}

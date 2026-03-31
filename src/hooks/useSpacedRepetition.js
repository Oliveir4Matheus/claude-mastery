import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiInitSRS, apiReviewCard, isLoggedIn } from '../api';

const SRS_KEY = 'claude-mastery-srs-v1';
const INTERVALS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
function daysBetween(a, b) { return Math.floor((new Date(b) - new Date(a)) / 86400000); }

const defaultSRS = { cards: {}, streak: { current: 0, lastReviewDate: null, longest: 0 }, totalReviews: 0 };

function loadSRS() { try { const r = localStorage.getItem(SRS_KEY); return r ? { ...defaultSRS, ...JSON.parse(r) } : defaultSRS; } catch { return defaultSRS; } }
function saveSRS(d) { try { localStorage.setItem(SRS_KEY, JSON.stringify(d)); } catch {} }

export function useSpacedRepetition() {
  const [srs, setSRS] = useState(loadSRS);
  useEffect(() => { saveSRS(srs); }, [srs]);

  // Hydrate from server
  const hydrateFromServer = useCallback((serverData) => {
    if (!serverData) return;
    const { srsCards, streak: serverStreak } = serverData;
    setSRS(s => {
      const cards = { ...s.cards };
      srsCards?.forEach(c => {
        const key = c.card_key;
        const existing = cards[key];
        // Server wins if more reviews or doesn't exist locally
        if (!existing || c.review_count > (existing.reviewCount || 0)) {
          cards[key] = {
            chapterId: c.chapter_id, questionIndex: c.question_index,
            box: c.box, nextReview: c.next_review?.slice(0, 10),
            lastReview: c.last_review?.slice(0, 10), reviewCount: c.review_count, correctStreak: c.correct_streak,
          };
        }
      });
      const streak = serverStreak?.current_streak > s.streak.current
        ? { current: serverStreak.current_streak, longest: serverStreak.longest_streak, lastReviewDate: serverStreak.last_review_date?.slice(0, 10) }
        : s.streak;
      return { ...s, cards, streak, totalReviews: Math.max(s.totalReviews, serverStreak?.total_reviews || 0) };
    });
  }, []);

  const initChapterCards = useCallback((chapterId, questionCount) => {
    setSRS(s => {
      const newCards = { ...s.cards };
      const t = today(), next = addDays(t, 1);
      for (let i = 0; i < questionCount; i++) {
        const key = `${chapterId}-q${i}`;
        if (!newCards[key]) newCards[key] = { chapterId, questionIndex: i, box: 1, nextReview: next, lastReview: t, reviewCount: 0, correctStreak: 0 };
      }
      return { ...s, cards: newCards };
    });
    if (isLoggedIn()) apiInitSRS(chapterId, questionCount).catch(() => {});
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
    if (isLoggedIn()) apiReviewCard(cardId, correct).catch(() => {});
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
    const avg = ch.reduce((s, c) => s + Math.max(0, daysBetween(c.nextReview, t)), 0) / ch.length;
    return Math.min(1, avg / 14);
  }, [srs.cards]);

  return { srs, dueCards, allCards, boxDistribution, streak: srs.streak, totalReviews: srs.totalReviews, initChapterCards, removeChapterCards, processReview, getChapterDecay, hydrateFromServer };
}

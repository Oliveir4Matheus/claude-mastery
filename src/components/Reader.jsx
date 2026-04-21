import { useState, useCallback, useEffect } from 'react';
import { CHAPTERS } from '../data/chapters';
import { COURSE } from '../config/course.config';
import { useProgress } from '../hooks/useProgress';
import { useSpacedRepetition } from '../hooks/useSpacedRepetition';
import Cover from './Cover';
import TOC from './TOC';
import ModuleLanding from './ModuleLanding';
import ChapterContent from './ChapterContent';
import Quiz from './Quiz';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import ProgressBar from './ProgressBar';
import JourneyMap from './JourneyMap';
import Certificate from './Certificate';
import ReviewDashboard from './ReviewDashboard';
import ProfilePage from './ProfilePage';

function buildPages(chapters) {
  const pages = [
    { type: 'cover', id: 'cover', title: 'Capa' },
    { type: 'toc', id: 'toc', title: 'Indice' },
  ];
  chapters.forEach(ch => {
    pages.push({ type: 'landing', id: `landing-${ch.id}`, chId: ch.id, title: `${ch.num} — ${ch.title}` });
    pages.push({ type: 'chapter', id: ch.id, chId: ch.id, title: ch.title });
    pages.push({ type: 'quiz', id: `quiz-${ch.id}`, chId: ch.id, title: `Avaliação: ${ch.title}` });
  });
  return pages;
}

const PAGES = buildPages(CHAPTERS);

export default function Reader({ auth }) {
  const { progress, saveCurrentPage, recordQuizResult, resetChapter, completeChallenge, uncompleteChallenge, hydrateFromServer } = useProgress();
  const srs = useSpacedRepetition();
  const [currentPage, setCurrentPage] = useState(() => progress.currentPage || 0);

  // Sync from server on mount if authenticated
  useEffect(() => {
    if (auth?.isAuthenticated && auth.syncFromServer) {
      auth.syncFromServer().then(data => {
        if (data) {
          hydrateFromServer(data);
          srs.hydrateFromServer(data);
        }
      });
    }
  }, [auth?.isAuthenticated]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [animDir, setAnimDir] = useState('forward');
  const [certData, setCertData] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const page = PAGES[currentPage];

  const canGoNext = useCallback(() => {
    if (currentPage >= PAGES.length - 1) return false;
    if (page.type === 'quiz') return progress.passedChapters.includes(page.chId);
    return true;
  }, [currentPage, page, progress.passedChapters]);

  const goTo = useCallback((idx, dir = 'forward') => {
    setAnimDir(dir);
    setCurrentPage(idx);
    saveCurrentPage(idx);
    setSidebarOpen(false);
    setShowReview(false);
    setShowProfile(false);
  }, [saveCurrentPage]);

  const goNext = useCallback(() => { if (canGoNext()) goTo(currentPage + 1, 'forward'); }, [canGoNext, currentPage, goTo]);
  const goPrev = useCallback(() => { if (currentPage > 0) goTo(currentPage - 1, 'back'); }, [currentPage, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const handleQuizResult = useCallback((score, passed, questionResults = null) => {
    const alreadyPassed = progress.passedChapters.includes(page.chId);
    recordQuizResult(page.chId, score, passed, questionResults);

    // Init SRS cards for this chapter on first pass
    if (passed && !alreadyPassed) {
      const ch = CHAPTERS.find(c => c.id === page.chId);
      srs.initChapterCards(page.chId, ch.quiz.length);
      if (COURSE.features.certificates) {
        setCertData({ chapter: ch, score });
      }
    }
  }, [page, recordQuizResult, progress.passedChapters, srs]);

  const handleSelectChapter = useCallback((chId) => {
    const idx = PAGES.findIndex(p => p.type === 'landing' && p.chId === chId);
    if (idx !== -1) goTo(idx);
  }, [goTo]);

  const handleResetChapter = useCallback((chId) => {
    resetChapter(chId);
    srs.removeChapterCards(chId);
  }, [resetChapter, srs]);

  const renderPage = () => {
    if (showReview) {
      return (
        <ReviewDashboard
          dueCards={srs.dueCards}
          boxDistribution={srs.boxDistribution}
          streak={srs.streak}
          totalReviews={srs.totalReviews}
          onReview={srs.processReview}
          onClose={() => setShowReview(false)}
          passedCount={progress.passedChapters.length}
        />
      );
    }

    if (showProfile) {
      return (
        <ProfilePage
          user={auth?.user}
          progress={progress}
          boxDistribution={srs.boxDistribution}
          streak={srs.streak}
          totalReviews={srs.totalReviews}
          allCards={srs.allCards}
          onClose={() => setShowProfile(false)}
          onLogout={auth?.logout}
        />
      );
    }

    switch (page.type) {
      case 'cover':
        return <Cover onStart={() => goTo(1)} />;
      case 'toc':
        return (
          <TOC
            chapters={CHAPTERS}
            passedChapters={progress.passedChapters}
            onChapterClick={(chId) => {
              const idx = PAGES.findIndex(p => p.type === 'landing' && p.chId === chId);
              if (idx !== -1) goTo(idx);
            }}
          />
        );
      case 'landing': {
        const ch = CHAPTERS.find(c => c.id === page.chId);
        return (
          <ModuleLanding
            chapter={ch}
            onStart={goNext}
            passed={progress.passedChapters.includes(page.chId)}
            quizResult={progress.quizResults[page.chId]}
            onReset={() => handleResetChapter(page.chId)}
            challenges={progress.challenges}
            onToggleChallenge={(id) => {
              progress.challenges[id]?.completed ? uncompleteChallenge(id) : completeChallenge(id);
            }}
          />
        );
      }
      case 'chapter': {
        const ch = CHAPTERS.find(c => c.id === page.chId);
        return <ChapterContent chapter={ch} onQuiz={goNext} />;
      }
      case 'quiz': {
        const ch = CHAPTERS.find(c => c.id === page.chId);
        const result = progress.quizResults[page.chId];
        return (
          <Quiz
            chapter={ch}
            existingResult={result}
            onResult={handleQuizResult}
            onNext={goNext}
            onReview={() => goTo(currentPage - 1)}
          />
        );
      }
      default: return null;
    }
  };

  const isQuizLocked = page.type === 'quiz' && !progress.passedChapters.includes(page.chId);

  return (
    <div className="reader-wrap">
      <ProgressBar current={currentPage} total={PAGES.length} />
      <div className="reader-stage">
        <div className={`reader-page active anim-${animDir}`} key={showReview ? 'review' : showProfile ? 'profile' : currentPage}>
          {renderPage()}
        </div>
      </div>
      <NavBar
        onPrev={goPrev}
        onNext={goNext}
        canPrev={currentPage > 0 && !showReview && !showProfile}
        canNext={canGoNext() && !showReview && !showProfile}
        currentPage={currentPage}
        totalPages={PAGES.length}
        pageTitle={showReview ? 'Revisao Espacada' : showProfile ? 'Meu Perfil' : page.title}
        onToggleSidebar={() => setSidebarOpen(true)}
        onToggleJourney={() => setJourneyOpen(true)}
        onToggleReview={() => setShowReview(r => !r)}
        onToggleProfile={() => setShowProfile(p => !p)}
        isQuizLocked={isQuizLocked}
        dueReviewCount={srs.dueCards.length}
        showReview={showReview}
        showProfile={showProfile}
        userName={auth?.user?.name}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chapters={CHAPTERS}
        pages={PAGES}
        currentPage={currentPage}
        passedChapters={progress.passedChapters}
        onNavigate={goTo}
      />
      {journeyOpen && COURSE.features.journeyMap && (
        <JourneyMap
          onClose={() => setJourneyOpen(false)}
          onSelectChapter={handleSelectChapter}
          onGenerateCertificate={(chapter, score) => {
            setJourneyOpen(false);
            setCertData({ chapter, score });
          }}
          onResetChapter={(chId) => {
            handleResetChapter(chId);
          }}
          onResetAndNavigate={(chId) => {
            handleResetChapter(chId);
            const idx = PAGES.findIndex(p => p.type === 'landing' && p.chId === chId);
            if (idx !== -1) goTo(idx);
            setJourneyOpen(false);
          }}
          progress={progress}
          getChapterDecay={srs.getChapterDecay}
        />
      )}
      {certData && COURSE.features.certificates && (
        <Certificate
          chapter={certData.chapter}
          score={certData.score}
          onClose={() => setCertData(null)}
          userName={auth?.user?.name}
        />
      )}
    </div>
  );
}

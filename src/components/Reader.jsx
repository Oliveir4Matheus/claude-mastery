import { useState, useCallback, useEffect } from 'react';
import { CHAPTERS } from '../data/chapters';
import { useProgress } from '../hooks/useProgress';
import Cover from './Cover';
import TOC from './TOC';
import ModuleLanding from './ModuleLanding';
import ChapterContent from './ChapterContent';
import Quiz from './Quiz';
import NavBar from './NavBar';
import Sidebar from './Sidebar';
import ProgressBar from './ProgressBar';

function buildPages(chapters) {
  const pages = [
    { type: 'cover', id: 'cover', title: 'Capa' },
    { type: 'toc', id: 'toc', title: 'Índice' },
  ];
  chapters.forEach(ch => {
    pages.push({ type: 'landing', id: `landing-${ch.id}`, chId: ch.id, title: `${ch.num} — ${ch.title}` });
    pages.push({ type: 'chapter', id: ch.id, chId: ch.id, title: ch.title });
    pages.push({ type: 'quiz', id: `quiz-${ch.id}`, chId: ch.id, title: `Avaliação: ${ch.title}` });
  });
  return pages;
}

const PAGES = buildPages(CHAPTERS);

export default function Reader() {
  const { progress, saveCurrentPage, recordQuizResult } = useProgress();
  const [currentPage, setCurrentPage] = useState(() => progress.currentPage || 0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animDir, setAnimDir] = useState('forward');

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

  const handleQuizResult = useCallback((score, passed) => {
    recordQuizResult(page.chId, score, passed);
  }, [page, recordQuizResult]);

  const renderPage = () => {
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
        <div className={`reader-page active anim-${animDir}`} key={currentPage}>
          {renderPage()}
        </div>
      </div>
      <NavBar
        onPrev={goPrev}
        onNext={goNext}
        canPrev={currentPage > 0}
        canNext={canGoNext()}
        currentPage={currentPage}
        totalPages={PAGES.length}
        pageTitle={page.title}
        onToggleSidebar={() => setSidebarOpen(true)}
        isQuizLocked={isQuizLocked}
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
    </div>
  );
}

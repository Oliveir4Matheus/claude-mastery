export default function NavBar({ onPrev, onNext, canPrev, canNext, currentPage, totalPages, pageTitle, onToggleSidebar, isQuizLocked }) {
  return (
    <nav className="reader-nav">
      <button className="nav-btn" onClick={onPrev} disabled={!canPrev}>
        ← Anterior
      </button>

      <div className="nav-center">
        <div className="nav-counter">
          <strong>{currentPage + 1}</strong> / {totalPages}
        </div>
        <div className="nav-page-title">{pageTitle}</div>
      </div>

      <button
        className="nav-btn"
        onClick={onNext}
        disabled={!canNext}
        title={isQuizLocked ? 'Complete a avaliação com ≥70% para avançar' : ''}
      >
        {isQuizLocked ? '🔒 Aprovação necessária' : 'Próximo →'}
      </button>

      <button className="nav-toc-btn" onClick={onToggleSidebar}>
        ☰ Capítulos
      </button>
    </nav>
  );
}

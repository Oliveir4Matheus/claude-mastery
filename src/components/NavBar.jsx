export default function NavBar({
  onPrev, onNext, canPrev, canNext, currentPage, totalPages, pageTitle,
  onToggleSidebar, onToggleJourney, onToggleReview, onToggleAnalytics,
  isQuizLocked, dueReviewCount, showReview, showAnalytics,
}) {
  return (
    <nav className="reader-nav">
      <button className="nav-btn" onClick={onPrev} disabled={!canPrev} aria-label="Anterior">
        ← <span className="nav-btn-label">Anterior</span>
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
        aria-label={isQuizLocked ? 'Aprovação necessária' : 'Próximo'}
        title={isQuizLocked ? 'Complete a avaliação com ≥70% para avançar' : ''}
      >
        {isQuizLocked
          ? <><span className="nav-btn-label">🔒 Aprovação</span> 🔒</>
          : <><span className="nav-btn-label">Próximo</span> →</>
        }
      </button>

      <button
        className={`nav-toc-btn ${showReview ? 'active' : ''}`}
        onClick={onToggleReview}
        aria-label="Revisão Espaçada"
        title="Revisão Espaçada (Leitner)"
      >
        🧠
        {dueReviewCount > 0 && (
          <span className="nav-review-badge">{dueReviewCount > 99 ? '99+' : dueReviewCount}</span>
        )}
      </button>

      <button
        className={`nav-toc-btn ${showAnalytics ? 'active' : ''}`}
        onClick={onToggleAnalytics}
        aria-label="Estatísticas"
        title="Estatísticas de Aprendizado"
      >
        📊
      </button>

      <button className="nav-toc-btn" onClick={onToggleJourney} aria-label="Mapa da Jornada">
        🗺 <span className="nav-toc-label">Mapa</span>
      </button>

      <button className="nav-toc-btn" onClick={onToggleSidebar} aria-label="Capítulos">
        ☰ <span className="nav-toc-label">Capítulos</span>
      </button>
    </nav>
  );
}

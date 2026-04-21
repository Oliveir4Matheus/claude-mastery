import { COURSE } from '../config/course.config';

export default function NavBar({
  onPrev, onNext, canPrev, canNext, currentPage, totalPages, pageTitle,
  onToggleSidebar, onToggleJourney, onToggleReview, onToggleProfile,
  isQuizLocked, dueReviewCount, showReview, showProfile, userName,
}) {
  const f = COURSE.features;
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

      {f.journeyMap && (
        <button className="nav-toc-btn" onClick={onToggleJourney} aria-label="Mapa da Jornada">
          🗺 <span className="nav-toc-label">Mapa</span>
        </button>
      )}

      <button className="nav-toc-btn" onClick={onToggleSidebar} aria-label="Capítulos">
        ☰ <span className="nav-toc-label">Capítulos</span>
      </button>

      <button
        className={`nav-toc-btn nav-profile-btn ${showProfile ? 'active' : ''}`}
        onClick={onToggleProfile}
        aria-label="Perfil"
        title="Perfil e Estatísticas"
      >
        <span className="nav-profile-avatar">{userName?.charAt(0)?.toUpperCase() || '?'}</span>
      </button>
    </nav>
  );
}

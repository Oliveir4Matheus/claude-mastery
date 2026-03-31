export default function Sidebar({ open, onClose, chapters, pages, currentPage, passedChapters, onNavigate }) {
  const coverIdx = pages.findIndex(p => p.type === 'cover');
  const tocIdx = pages.findIndex(p => p.type === 'toc');

  return (
    <>
      <div className={`sidebar-overlay${open ? ' visible' : ''}`} onClick={onClose} />
      <div className={`reader-sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span>Capítulos</span>
          <button className="sidebar-close" onClick={onClose}>✕</button>
        </div>
        <div className="sidebar-list">
          <div
            className={`sidebar-special${currentPage === coverIdx ? ' active' : ''}`}
            onClick={() => onNavigate(coverIdx)}
          >◆ Capa</div>
          <div
            className={`sidebar-special${currentPage === tocIdx ? ' active' : ''}`}
            onClick={() => onNavigate(tocIdx)}
          >◆ Índice</div>
          <div className="sidebar-divider" />
          {chapters.map((ch, idx) => {
            const landingIdx = pages.findIndex(p => p.type === 'landing' && p.chId === ch.id);
            const chapterIdx = pages.findIndex(p => p.type === 'chapter' && p.chId === ch.id);
            const quizIdx = pages.findIndex(p => p.type === 'quiz' && p.chId === ch.id);
            const isActive = [landingIdx, chapterIdx, quizIdx].includes(currentPage);
            const passed = passedChapters.includes(ch.id);
            const prevPassed = idx === 0 || passedChapters.includes(chapters[idx - 1]?.id);
            const locked = !passed && !prevPassed;

            return (
              <div
                key={ch.id}
                className={`sidebar-item${isActive ? ' active' : ''}${locked ? ' locked' : ''}`}
                onClick={() => !locked && onNavigate(landingIdx)}
                title={locked ? 'Complete o capítulo anterior para desbloquear' : ch.title}
              >
                <span className="sidebar-num">{ch.num.replace('Capítulo ', '').replace('Apêndice', 'AP')}</span>
                <span className="sidebar-item-title">{ch.title}</span>
                {passed
                  ? <span className="sidebar-status passed" title="Aprovado">✓</span>
                  : locked
                    ? <span className="sidebar-status locked" title="Bloqueado">🔒</span>
                    : <span className="sidebar-status" title="Disponível">○</span>
                }
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

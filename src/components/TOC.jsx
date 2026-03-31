import { TOC_HTML } from '../data/content';

export default function TOC({ chapters, passedChapters, onChapterClick }) {
  return (
    <div className="toc-page">
      <div dangerouslySetInnerHTML={{ __html: TOC_HTML }} />
      <div className="toc-progress-section">
        <div className="toc-progress-header">
          <span className="section-label">Seu Progresso</span>
          <span className="toc-progress-count">
            {passedChapters.length} / {chapters.length} capítulos concluídos
          </span>
        </div>
        <div className="toc-progress-bar">
          <div
            className="toc-progress-fill"
            style={{ width: (passedChapters.length / chapters.length * 100).toFixed(1) + '%' }}
          />
        </div>
        <div className="toc-chapter-list">
          {chapters.map((ch, idx) => {
            const passed = passedChapters.includes(ch.id);
            const prevPassed = idx === 0 || passedChapters.includes(chapters[idx - 1]?.id);
            const locked = !passed && !prevPassed;

            return (
              <div
                key={ch.id}
                className={`toc-chapter-item${passed ? ' passed' : ''}${locked ? ' locked' : ''}`}
                onClick={() => !locked && onChapterClick(ch.id)}
                title={locked ? 'Complete o capítulo anterior para desbloquear' : ''}
              >
                <span className="toc-ch-icon">{locked ? '🔒' : ch.icon}</span>
                <span className="toc-ch-num">{ch.num}</span>
                <span className="toc-ch-title">{locked ? '???' : ch.title}</span>
                <span className={`toc-ch-status${passed ? ' passed' : ''}`}>
                  {passed ? '✓ Concluído' : locked ? '🔒' : '→ Iniciar'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

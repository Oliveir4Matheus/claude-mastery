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
          {chapters.map(ch => (
            <div
              key={ch.id}
              className={`toc-chapter-item${passedChapters.includes(ch.id) ? ' passed' : ''}`}
              onClick={() => onChapterClick(ch.id)}
            >
              <span className="toc-ch-icon">{ch.icon}</span>
              <span className="toc-ch-num">{ch.num}</span>
              <span className="toc-ch-title">{ch.title}</span>
              <span className={`toc-ch-status${passedChapters.includes(ch.id) ? ' passed' : ''}`}>
                {passedChapters.includes(ch.id) ? '✓ Concluído' : '→ Iniciar'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

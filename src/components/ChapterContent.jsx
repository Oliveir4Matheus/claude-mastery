import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CONTENT } from '../data/content';
import RetrievalCheckpoint from './RetrievalCheckpoint';

export default function ChapterContent({ chapter, onQuiz }) {
  const containerRef = useRef(null);
  const [mountPoints, setMountPoints] = useState([]);

  // Inject checkpoint mount points into the rendered HTML
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chapter.checkpoints?.length) {
      setMountPoints([]);
      return;
    }

    // Clean up old mount points
    el.querySelectorAll('.checkpoint-mount').forEach(m => m.remove());

    const points = [];
    chapter.checkpoints.forEach((cp, i) => {
      const anchor = el.querySelector(cp.insertAfter);
      if (anchor) {
        const mount = document.createElement('div');
        mount.className = 'checkpoint-mount';
        mount.dataset.idx = i;
        anchor.after(mount);
        points.push({ idx: i, el: mount, cp });
      }
    });
    setMountPoints(points);
  }, [chapter.id, chapter.checkpoints]);

  return (
    <div className="chapter-page">
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: CONTENT[chapter.id] || '' }} />

      {/* Render checkpoints via portals */}
      {mountPoints.map(mp => (
        createPortal(
          <RetrievalCheckpoint
            key={`${chapter.id}-cp-${mp.idx}`}
            prompt={mp.cp.prompt}
            expectedAnswer={mp.cp.expectedAnswer}
          />,
          mp.el
        )
      ))}

      <div className="chapter-footer">
        <p className="chapter-footer-label">Conteudo concluido? Teste seus conhecimentos.</p>
        <button className="chapter-quiz-btn" onClick={onQuiz}>
          Fazer Avaliacao →
        </button>
      </div>
    </div>
  );
}

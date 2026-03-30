import { useState } from 'react';

export default function RetrievalCheckpoint({ prompt, expectedAnswer }) {
  const [expanded, setExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  return (
    <div className={`checkpoint ${expanded ? 'open' : ''}`}>
      <button className="checkpoint-toggle" onClick={() => setExpanded(!expanded)}>
        <span className="checkpoint-icon">🧪</span>
        <span className="checkpoint-label">Checkpoint — Teste seu entendimento</span>
        <span className="checkpoint-arrow">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="checkpoint-body">
          <p className="checkpoint-prompt">{prompt}</p>

          <textarea
            className="checkpoint-input"
            placeholder="Tente responder sem consultar o texto acima..."
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            rows={3}
          />

          {!revealed ? (
            <button
              className="checkpoint-reveal-btn"
              onClick={() => setRevealed(true)}
            >
              Revelar resposta
            </button>
          ) : (
            <div className="checkpoint-answer">
              <div className="checkpoint-answer-label">Resposta esperada:</div>
              <p className="checkpoint-answer-text">{expectedAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

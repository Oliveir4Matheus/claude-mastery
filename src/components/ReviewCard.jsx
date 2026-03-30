import { useState } from 'react';
import { CHAPTERS } from '../data/chapters';

export default function ReviewCard({ card, onResult }) {
  const [flipped, setFlipped] = useState(false);

  const chapter = CHAPTERS.find(c => c.id === card.chapterId);
  if (!chapter) return null;

  const question = chapter.quiz[card.questionIndex];
  if (!question) return null;

  const boxLabels = { 1: 'Caixa 1 — Diário', 2: 'Caixa 2 — 3 dias', 3: 'Caixa 3 — Semanal', 4: 'Caixa 4 — Quinzenal', 5: 'Caixa 5 — Mensal' };

  return (
    <div className={`review-card ${flipped ? 'flipped' : ''}`}>
      <div className="rc-header">
        <span className="rc-chapter-tag">{chapter.icon} {chapter.title}</span>
        <span className="rc-box-tag">Caixa {card.box}</span>
      </div>

      {!flipped ? (
        <div className="rc-front">
          <div className="rc-question">{question.question}</div>
          <div className="rc-hint">Tente lembrar a resposta sem ver as opcoes</div>
          <button className="rc-flip-btn" onClick={() => setFlipped(true)}>
            Revelar resposta
          </button>
        </div>
      ) : (
        <div className="rc-back">
          <div className="rc-answer-label">Resposta correta:</div>
          <div className="rc-answer">
            <span className="rc-answer-letter">{String.fromCharCode(65 + question.correct)}</span>
            {question.options[question.correct]}
          </div>
          <div className="rc-explanation">
            <span className="rc-exp-icon">💡</span>
            {question.explanation}
          </div>
          <div className="rc-self-rate">
            <span className="rc-rate-label">Voce lembrou?</span>
            <button className="rc-rate-btn rc-rate-wrong" onClick={() => onResult(card.id, false)}>
              ✗ Errei
            </button>
            <button className="rc-rate-btn rc-rate-right" onClick={() => onResult(card.id, true)}>
              ✓ Acertei
            </button>
          </div>
        </div>
      )}

      <div className="rc-meta">
        <span>Revisoes: {card.reviewCount}</span>
        <span>Sequencia: {card.correctStreak}</span>
      </div>
    </div>
  );
}

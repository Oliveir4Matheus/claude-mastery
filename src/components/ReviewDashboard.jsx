import { useState, useMemo } from 'react';
import ReviewCard from './ReviewCard';

export default function ReviewDashboard({ dueCards, boxDistribution, streak, totalReviews, onReview, onClose, passedCount }) {
  const [mode, setMode] = useState('sequential'); // 'sequential' | 'mixed'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionResults, setSessionResults] = useState({ correct: 0, wrong: 0 });

  const cards = useMemo(() => {
    if (mode === 'mixed') {
      // Shuffle cards across chapters
      const shuffled = [...dueCards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return dueCards;
  }, [dueCards, mode]);

  const currentCard = cards[currentIdx];
  const totalCards = Object.values(boxDistribution).reduce((a, b) => a + b, 0);
  const mastered = boxDistribution[5] || 0;

  const handleResult = (cardId, correct) => {
    onReview(cardId, correct);
    setSessionResults(r => ({
      correct: r.correct + (correct ? 1 : 0),
      wrong: r.wrong + (correct ? 0 : 1),
    }));
    setCurrentIdx(i => i + 1);
  };

  const sessionDone = currentIdx >= cards.length;

  return (
    <div className="review-dashboard">
      <div className="rd-inner">
        {/* Header */}
        <div className="rd-header">
          <div className="rd-header-left">
            <h2 className="rd-title">🧠 Revisao Espacada</h2>
            <p className="rd-subtitle">Sistema Leitner — Reforce sua memoria</p>
          </div>
          <button className="rd-close" onClick={onClose}>← Voltar</button>
        </div>

        {/* Stats */}
        <div className="rd-stats">
          <div className="rd-stat">
            <div className="rd-stat-num">{dueCards.length}</div>
            <div className="rd-stat-label">Pendentes hoje</div>
          </div>
          <div className="rd-stat">
            <div className="rd-stat-num">{streak.current}</div>
            <div className="rd-stat-label">Dias seguidos</div>
          </div>
          <div className="rd-stat">
            <div className="rd-stat-num">{totalReviews}</div>
            <div className="rd-stat-label">Revisoes totais</div>
          </div>
          <div className="rd-stat">
            <div className="rd-stat-num">{totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0}%</div>
            <div className="rd-stat-label">Dominados</div>
          </div>
        </div>

        {/* Leitner boxes */}
        <div className="rd-boxes">
          <div className="rd-boxes-title">Distribuicao por Caixa</div>
          <div className="rd-boxes-row">
            {[1, 2, 3, 4, 5].map(box => {
              const count = boxDistribution[box] || 0;
              const pct = totalCards > 0 ? (count / totalCards) * 100 : 0;
              const labels = ['Diario', '3 dias', 'Semanal', 'Quinzenal', 'Dominado'];
              return (
                <div key={box} className={`rd-box rd-box-${box}`}>
                  <div className="rd-box-bar" style={{ height: `${Math.max(pct, 4)}%` }} />
                  <div className="rd-box-count">{count}</div>
                  <div className="rd-box-label">{labels[box - 1]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mode toggle */}
        {passedCount >= 3 && dueCards.length > 0 && !sessionDone && (
          <div className="rd-mode-toggle">
            <button
              className={`rd-mode-btn ${mode === 'sequential' ? 'active' : ''}`}
              onClick={() => { setMode('sequential'); setCurrentIdx(0); }}
            >
              Por capitulo
            </button>
            <button
              className={`rd-mode-btn ${mode === 'mixed' ? 'active' : ''}`}
              onClick={() => { setMode('mixed'); setCurrentIdx(0); }}
            >
              Revisao mista (interleaving)
            </button>
          </div>
        )}

        {/* Review area */}
        {dueCards.length === 0 ? (
          <div className="rd-empty">
            <div className="rd-empty-icon">✨</div>
            <h3>Nenhuma revisao pendente!</h3>
            <p>
              {totalCards === 0
                ? 'Complete quizzes para comecar a revisar.'
                : 'Voce esta em dia. Volte amanha para manter sua sequencia.'
              }
            </p>
          </div>
        ) : sessionDone ? (
          <div className="rd-session-done">
            <div className="rd-done-icon">🎉</div>
            <h3>Sessao de revisao concluida!</h3>
            <div className="rd-done-stats">
              <span className="rd-done-right">✓ {sessionResults.correct} acertos</span>
              <span className="rd-done-wrong">✗ {sessionResults.wrong} erros</span>
            </div>
            {sessionResults.wrong > 0 && (
              <p className="rd-done-tip">Cartoes errados voltaram para Caixa 1 — voce vera novamente amanha.</p>
            )}
          </div>
        ) : (
          <div className="rd-review-area">
            <div className="rd-progress-label">
              Cartao {currentIdx + 1} de {cards.length}
            </div>
            <ReviewCard
              key={currentCard.id}
              card={currentCard}
              onResult={handleResult}
            />
          </div>
        )}
      </div>
    </div>
  );
}

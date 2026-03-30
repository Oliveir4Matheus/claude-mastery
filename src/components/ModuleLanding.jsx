export default function ModuleLanding({ chapter, onStart, passed, quizResult, onReset }) {
  return (
    <div className="module-landing">
      <div className="ml-inner">
        <div className="ml-week">{chapter.week}</div>
        <div className="ml-icon">{chapter.icon}</div>
        <div className="ml-num">{chapter.num}</div>
        <h2 className="ml-title">{chapter.title}</h2>
        {chapter.objective && <p className="ml-obj">{chapter.objective}</p>}

        <div className="ml-quiz-count">
          <span className="ml-quiz-badge">📝 {chapter.quiz.length} questões de múltipla escolha · Mínimo 70% para avançar</span>
        </div>

        {passed && quizResult && (
          <div className="ml-passed-badge">
            <span>✓ Concluído</span>
            <span className="ml-passed-score">{quizResult.score}%</span>
          </div>
        )}

        <div className="ml-actions">
          {passed && (
            <button className="ml-btn-reset" onClick={onReset} title="Apaga o progresso deste módulo e recomeça do zero">
              ↺ Refazer módulo
            </button>
          )}
          <button className="ml-btn" onClick={onStart}>
            {passed ? 'Rever capítulo' : 'Começar'} <span className="ml-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

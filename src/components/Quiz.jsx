import { useState, useEffect } from 'react';

export default function Quiz({ chapter, existingResult, onResult, onNext, onReview }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [passed, setPassed] = useState(false);

  // Reset ao trocar de capítulo; se já passou, mostra resultado
  useEffect(() => {
    if (existingResult?.passed) {
      const correct = {};
      chapter.quiz.forEach((q, i) => { correct[i] = q.correct; });
      setAnswers(correct);
      setScore(existingResult.score);
      setPassed(true);
      setSubmitted(true);
    } else {
      setAnswers({});
      setScore(null);
      setPassed(false);
      setSubmitted(false);
    }
  }, [chapter.id]);

  const allAnswered = Object.keys(answers).length === chapter.quiz.length;
  const correctCount = chapter.quiz.filter((q, i) => answers[i] === q.correct).length;
  const minToPass = Math.ceil(chapter.quiz.length * 0.7);

  const handleSubmit = () => {
    let correct = 0;
    chapter.quiz.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    const pct = Math.round((correct / chapter.quiz.length) * 100);
    const pass = pct >= 70;
    setScore(pct);
    setPassed(pass);
    setSubmitted(true);
    onResult(pct, pass);
    // Scroll to top of quiz
    document.querySelector('.quiz-page')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setAnswers({});
    setScore(null);
    setPassed(false);
    setSubmitted(false);
    document.querySelector('.quiz-page')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="quiz-page">
      <div className="quiz-inner">

        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-badge">{chapter.num}</div>
          <h2 className="quiz-title">Avaliação</h2>
          <p className="quiz-subtitle">{chapter.title}</p>
          {!submitted && (
            <div className="quiz-info-row">
              <span>✓ {chapter.quiz.length} questões</span>
              <span>✓ Mínimo {minToPass} certas ({Math.round(minToPass / chapter.quiz.length * 100)}%) para avançar</span>
              {allAnswered
                ? <span className="quiz-info-ready">✓ Pronto para enviar</span>
                : <span>{Object.keys(answers).length} / {chapter.quiz.length} respondidas</span>
              }
            </div>
          )}
        </div>

        {/* Result banner */}
        {submitted && (
          <div className={`quiz-result-banner ${passed ? 'pass' : 'fail'}`}>
            <div className="qrb-score">{score}%</div>
            <div className="qrb-label">{passed ? '🎉 Aprovado!' : '📚 Não atingiu o mínimo'}</div>
            <div className="qrb-detail">
              {passed
                ? `Você acertou ${correctCount} de ${chapter.quiz.length} questões. Pode avançar para o próximo capítulo.`
                : `Você acertou ${correctCount} de ${chapter.quiz.length}. Precisa de pelo menos ${minToPass} para avançar. Revise o capítulo e tente novamente.`
              }
            </div>
            {existingResult?.attempts > 1 && (
              <div className="qrb-attempts">Tentativa {existingResult.attempts}</div>
            )}
          </div>
        )}

        {/* Questions */}
        <div className="quiz-questions">
          {chapter.quiz.map((q, qi) => {
            const selected = answers[qi];
            const isAnswered = selected !== undefined;
            const isCorrect = submitted && selected === q.correct;
            const isWrong = submitted && isAnswered && selected !== q.correct;

            return (
              <div
                key={qi}
                className={`quiz-q${submitted ? (isCorrect ? ' correct' : isWrong ? ' wrong' : ' unanswered') : isAnswered ? ' answered' : ''}`}
              >
                <div className="quiz-q-header">
                  <span className="quiz-q-num">Q{qi + 1}</span>
                  {submitted && (
                    <span className={`quiz-q-result ${isCorrect ? 'correct' : 'wrong'}`}>
                      {isCorrect ? '✓ Correta' : '✗ Incorreta'}
                    </span>
                  )}
                </div>
                <div className="quiz-q-text">{q.question}</div>

                <div className="quiz-options">
                  {q.options.map((opt, oi) => {
                    let cls = 'quiz-option';
                    if (!submitted && selected === oi) cls += ' selected';
                    if (submitted && oi === q.correct) cls += ' correct';
                    if (submitted && selected === oi && oi !== q.correct) cls += ' wrong';

                    return (
                      <button
                        key={oi}
                        className={cls}
                        onClick={() => !submitted && setAnswers(a => ({ ...a, [qi]: oi }))}
                        disabled={submitted}
                      >
                        <span className="quiz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                        <span className="quiz-opt-text">{opt}</span>
                        {submitted && oi === q.correct && <span className="quiz-opt-icon correct">✓</span>}
                        {submitted && selected === oi && oi !== q.correct && <span className="quiz-opt-icon wrong">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="quiz-explanation">
                    <span className="quiz-exp-icon">💡</span>
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="quiz-actions">
          {!submitted ? (
            <>
              <button className="quiz-btn-secondary" onClick={onReview}>
                ← Revisar capítulo
              </button>
              <button
                className="quiz-btn-primary"
                onClick={handleSubmit}
                disabled={!allAnswered}
              >
                {allAnswered ? 'Enviar respostas' : `Responda todas (${Object.keys(answers).length}/${chapter.quiz.length})`}
              </button>
            </>
          ) : passed ? (
            <>
              <button className="quiz-btn-secondary" onClick={onReview}>← Rever capítulo</button>
              <button className="quiz-btn-primary" onClick={onNext}>Próximo capítulo →</button>
            </>
          ) : (
            <>
              <button className="quiz-btn-secondary" onClick={onReview}>← Rever capítulo</button>
              <button className="quiz-btn-primary" onClick={handleRetry}>🔄 Tentar novamente</button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

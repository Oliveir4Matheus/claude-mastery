import { useState, useEffect, useMemo } from 'react';

const CONFIDENCE_LEVELS = [
  { key: 'guess', label: 'Chutando', icon: '🎲' },
  { key: 'think', label: 'Acho que sei', icon: '🤔' },
  { key: 'certain', label: 'Tenho certeza', icon: '💯' },
];

const QUIZ_SIZE = 5;

// Seeded shuffle for reproducible randomization per attempt
function seededShuffle(arr, seed) {
  const shuffled = arr.map((_, i) => i);
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Quiz({ chapter, existingResult, onResult, onNext, onReview }) {
  const [answers, setAnswers] = useState({});
  const [confidence, setConfidence] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [passed, setPassed] = useState(false);
  const [expandedWhy, setExpandedWhy] = useState({});

  const attemptNum = (existingResult?.attempts || 0);

  // Select QUIZ_SIZE questions from pool (randomized per attempt)
  const selectedIndices = useMemo(() => {
    const pool = chapter.quiz;
    if (pool.length <= QUIZ_SIZE) return pool.map((_, i) => i);
    const seed = chapter.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 1000 + attemptNum;
    return seededShuffle(pool, seed).slice(0, QUIZ_SIZE);
  }, [chapter.id, chapter.quiz, attemptNum]);

  const questions = useMemo(() => selectedIndices.map(i => chapter.quiz[i]), [selectedIndices, chapter.quiz]);

  // Reset on chapter change; restore if already passed
  useEffect(() => {
    if (existingResult?.passed) {
      const correct = {};
      questions.forEach((q, i) => { correct[i] = q.correct; });
      setAnswers(correct);
      setConfidence({});
      setScore(existingResult.score);
      setPassed(true);
      setSubmitted(true);
    } else {
      setAnswers({});
      setConfidence({});
      setScore(null);
      setPassed(false);
      setSubmitted(false);
      setExpandedWhy({});
    }
  }, [chapter.id]);

  const allAnswered = Object.keys(answers).length === questions.length;
  const allConfident = Object.keys(confidence).length === questions.length;
  const correctCount = questions.filter((q, i) => answers[i] === q.correct).length;
  const minToPass = Math.ceil(questions.length * 0.7);

  const handleSubmit = () => {
    let correct = 0;
    const qResults = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correct;
      if (isCorrect) correct++;
      const conf = confidence[i] || 'guess';
      const calibrated =
        (isCorrect && conf !== 'guess') || (!isCorrect && conf === 'guess');
      return {
        questionIndex: selectedIndices[i],
        selectedAnswer: answers[i],
        correct: isCorrect,
        confidence: conf,
        calibrated,
      };
    });

    const pct = Math.round((correct / questions.length) * 100);
    const pass = pct >= 70;
    setScore(pct);
    setPassed(pass);
    setSubmitted(true);
    onResult(pct, pass, qResults);
    document.querySelector('.quiz-page')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setAnswers({});
    setConfidence({});
    setScore(null);
    setPassed(false);
    setSubmitted(false);
    setExpandedWhy({});
    document.querySelector('.quiz-page')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calibration stats
  const calibrationStats = useMemo(() => {
    if (!submitted) return null;
    let overconfident = 0, underconfident = 0, calibrated = 0;
    questions.forEach((q, i) => {
      const isCorrect = answers[i] === q.correct;
      const conf = confidence[i] || 'guess';
      if (isCorrect && conf === 'guess') underconfident++;
      else if (!isCorrect && conf === 'certain') overconfident++;
      else if ((isCorrect && conf !== 'guess') || (!isCorrect && conf === 'guess')) calibrated++;
    });
    return { overconfident, underconfident, calibrated, total: questions.length };
  }, [submitted, answers, confidence, questions]);

  return (
    <div className="quiz-page">
      <div className="quiz-inner">

        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-badge">{chapter.num}</div>
          <h2 className="quiz-title">Avaliacao</h2>
          <p className="quiz-subtitle">{chapter.title}</p>
          {!submitted && (
            <div className="quiz-info-row">
              <span>{questions.length} questoes</span>
              <span>Minimo {minToPass} certas ({Math.round(minToPass / questions.length * 100)}%)</span>
              {chapter.quiz.length > QUIZ_SIZE && (
                <span className="quiz-info-pool">
                  Sorteadas de um banco de {chapter.quiz.length}
                </span>
              )}
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
                ? `Você acertou ${correctCount} de ${questions.length} questões.`
                : `Acertou ${correctCount} de ${questions.length}. Precisa de ${minToPass} para avançar.`
              }
            </div>
            {existingResult?.attempts > 1 && (
              <div className="qrb-attempts">Tentativa {existingResult.attempts}</div>
            )}

            {/* Calibration summary */}
            {calibrationStats && Object.keys(confidence).length > 0 && (
              <div className="qrb-calibration">
                <div className="qrb-cal-title">Calibracao de Confianca</div>
                <div className="qrb-cal-row">
                  <span className="qrb-cal-item cal-good">{calibrationStats.calibrated} calibradas</span>
                  {calibrationStats.overconfident > 0 && (
                    <span className="qrb-cal-item cal-over">{calibrationStats.overconfident} superestimadas</span>
                  )}
                  {calibrationStats.underconfident > 0 && (
                    <span className="qrb-cal-item cal-under">{calibrationStats.underconfident} subestimadas</span>
                  )}
                </div>
                {calibrationStats.overconfident > 0 && (
                  <div className="qrb-cal-tip">Revise os temas onde marcou "Tenho certeza" mas errou.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Questions */}
        <div className="quiz-questions">
          {questions.map((q, qi) => {
            const selected = answers[qi];
            const isAnswered = selected !== undefined;
            const isCorrect = submitted && selected === q.correct;
            const isWrong = submitted && isAnswered && selected !== q.correct;
            const conf = confidence[qi];

            // Calibration badge
            let calBadge = null;
            if (submitted && conf) {
              if (isCorrect && conf === 'guess') calBadge = { cls: 'cal-under', label: 'Subestimou' };
              else if (!isCorrect && conf === 'certain') calBadge = { cls: 'cal-over', label: 'Superestimou' };
              else if ((isCorrect && conf !== 'guess') || (!isCorrect && conf === 'guess')) calBadge = { cls: 'cal-good', label: 'Calibrada' };
            }

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
                  {calBadge && (
                    <span className={`quiz-cal-badge ${calBadge.cls}`}>{calBadge.label}</span>
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

                {/* Confidence selector (before submit) */}
                {!submitted && isAnswered && (
                  <div className="quiz-confidence">
                    <span className="quiz-conf-label">Confianca:</span>
                    {CONFIDENCE_LEVELS.map(cl => (
                      <button
                        key={cl.key}
                        className={`quiz-conf-btn ${confidence[qi] === cl.key ? 'active' : ''}`}
                        onClick={() => setConfidence(c => ({ ...c, [qi]: cl.key }))}
                      >
                        {cl.icon} {cl.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Explanation */}
                {submitted && (
                  <div className="quiz-explanation">
                    <span className="quiz-exp-icon">💡</span>
                    <span>{q.explanation}</span>
                  </div>
                )}

                {/* "Why?" elaboration prompt */}
                {submitted && q.whyPrompt && (
                  <div className="quiz-why">
                    <button
                      className={`quiz-why-toggle ${expandedWhy[qi] ? 'open' : ''}`}
                      onClick={() => setExpandedWhy(w => ({ ...w, [qi]: !w[qi] }))}
                    >
                      🧠 Reflita: por que?
                    </button>
                    {expandedWhy[qi] && (
                      <div className="quiz-why-content">
                        <p className="quiz-why-prompt">{q.whyPrompt}</p>
                        <textarea
                          className="quiz-why-input"
                          placeholder="Escreva sua reflexao aqui (opcional, nao avaliada)..."
                          rows={3}
                        />
                      </div>
                    )}
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
                ← Revisar capitulo
              </button>
              <button
                className="quiz-btn-primary"
                onClick={handleSubmit}
                disabled={!allAnswered}
              >
                {allAnswered
                  ? (allConfident ? 'Enviar respostas' : 'Enviar (confiança opcional)')
                  : `Responda todas (${Object.keys(answers).length}/${questions.length})`
                }
              </button>
            </>
          ) : passed ? (
            <>
              <button className="quiz-btn-secondary" onClick={onReview}>← Rever capitulo</button>
              <button className="quiz-btn-secondary" onClick={handleRetry}>🔄 Refazer avaliacao</button>
              <button className="quiz-btn-primary" onClick={onNext}>Proximo capitulo →</button>
            </>
          ) : (
            <>
              <button className="quiz-btn-secondary" onClick={onReview}>← Rever capitulo</button>
              <button className="quiz-btn-primary" onClick={handleRetry}>🔄 Tentar novamente</button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

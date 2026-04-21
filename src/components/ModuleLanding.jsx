import ChallengeCard from './ChallengeCard';
import { COURSE } from '../config/course.config';

export default function ModuleLanding({ chapter, onStart, passed, quizResult, onReset, challenges = {}, onToggleChallenge }) {
  const showChallenges = COURSE.features.challenges;
  return (
    <div className="module-landing">
      <div className="ml-inner">
        <div className="ml-week">{chapter.week}</div>
        <div className="ml-icon">{chapter.icon}</div>
        <div className="ml-num">{chapter.num}</div>
        <h2 className="ml-title">{chapter.title}</h2>
        {chapter.objective && <p className="ml-obj">{chapter.objective}</p>}

        <div className="ml-quiz-count">
          <span className="ml-quiz-badge">
            📝 {chapter.quiz.length > 5 ? `${chapter.quiz.length} questões no banco · 5 sorteadas por tentativa` : `${chapter.quiz.length} questões`} · Mínimo 70% para avançar
          </span>
        </div>

        {passed && quizResult && (
          <div className="ml-passed-badge">
            <span>✓ Concluido</span>
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

        {/* Practical challenges (visible after passing) */}
        {showChallenges && passed && chapter.challenges?.length > 0 && (
          <div className="ml-challenges">
            <h3 className="ml-challenges-title">🎯 Desafios Práticos</h3>
            <p className="ml-challenges-desc">Aplique o que aprendeu no seu próprio ambiente</p>
            {chapter.challenges.map(ch => (
              <ChallengeCard
                key={ch.id}
                challenge={ch}
                completed={challenges[ch.id]?.completed}
                onToggle={onToggleChallenge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChallengeCard({ challenge, completed, onToggle }) {
  return (
    <div className={`challenge-card ${completed ? 'done' : ''}`}>
      <div className="chall-header">
        <span className="chall-icon">🎯</span>
        <span className="chall-title">{challenge.title}</span>
        {completed && <span className="chall-done-badge">✓ Concluido</span>}
      </div>

      <p className="chall-desc">{challenge.description}</p>

      {challenge.criteria && (
        <ul className="chall-criteria">
          {challenge.criteria.map((c, i) => (
            <li key={i} className="chall-criterion">{c}</li>
          ))}
        </ul>
      )}

      <button
        className={`chall-toggle-btn ${completed ? 'completed' : ''}`}
        onClick={() => onToggle(challenge.id)}
      >
        {completed ? '↺ Desmarcar' : '✓ Marcar como concluido'}
      </button>
    </div>
  );
}

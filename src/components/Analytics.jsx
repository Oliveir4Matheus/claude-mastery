import { CHAPTERS } from '../data/chapters';

function BarChart({ data, maxVal, color = 'var(--co)', height = 120 }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="analytics-bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="abc-col" title={`${d.label}: ${d.value}`}>
          <div
            className="abc-bar"
            style={{
              height: `${Math.max((d.value / max) * 100, 3)}%`,
              background: d.color || color,
            }}
          />
          <div className="abc-val">{d.value}</div>
          <div className="abc-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics({ progress, boxDistribution, streak, totalReviews, allCards, onClose }) {
  const chapters = CHAPTERS.filter(ch => ch.id !== 'appendix');

  // Quiz scores per chapter
  const quizData = chapters.map(ch => ({
    label: ch.icon,
    value: progress.quizResults[ch.id]?.score || 0,
    color: progress.passedChapters.includes(ch.id) ? 'var(--grn)' : 'var(--brd)',
  }));

  // Calibration per chapter
  const calData = chapters
    .filter(ch => progress.quizResults[ch.id]?.calibrationScore !== undefined)
    .map(ch => ({
      label: ch.icon,
      value: progress.quizResults[ch.id]?.calibrationScore || 0,
      color: 'var(--blu)',
    }));

  // Weakest chapters (most box-1 cards)
  const box1ByChapter = {};
  allCards.forEach(c => {
    if (c.box === 1) box1ByChapter[c.chapterId] = (box1ByChapter[c.chapterId] || 0) + 1;
  });
  const weakest = Object.entries(box1ByChapter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([chId, count]) => {
      const ch = CHAPTERS.find(c => c.id === chId);
      return { label: ch?.icon || chId, value: count, color: 'var(--red)' };
    });

  // Challenges completed
  const totalChallenges = CHAPTERS.reduce((sum, ch) => sum + (ch.challenges?.length || 0), 0);
  const completedChallenges = Object.values(progress.challenges || {}).filter(c => c.completed).length;

  const totalCards = allCards.length;
  const mastered = boxDistribution[5] || 0;
  const retentionEstimate = totalCards > 0 ? Math.round(((mastered + (boxDistribution[4] || 0) * 0.8 + (boxDistribution[3] || 0) * 0.6) / totalCards) * 100) : 0;

  return (
    <div className="analytics-page">
      <div className="analytics-inner">
        <div className="an-header">
          <h2 className="an-title">📊 Estatisticas de Aprendizado</h2>
          <button className="an-close" onClick={onClose}>← Voltar</button>
        </div>

        {/* KPIs */}
        <div className="an-kpis">
          <div className="an-kpi">
            <div className="an-kpi-num">{progress.passedChapters.length}/{chapters.length}</div>
            <div className="an-kpi-label">Modulos concluidos</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-num">{streak.current}</div>
            <div className="an-kpi-label">Dias de revisao seguidos</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-num">{retentionEstimate}%</div>
            <div className="an-kpi-label">Retencao estimada</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-num">{completedChallenges}/{totalChallenges}</div>
            <div className="an-kpi-label">Desafios praticos</div>
          </div>
        </div>

        {/* Score per chapter */}
        <div className="an-section">
          <h3 className="an-section-title">Pontuacao por Modulo</h3>
          <BarChart data={quizData} maxVal={100} color="var(--co)" />
        </div>

        {/* Calibration */}
        {calData.length > 0 && (
          <div className="an-section">
            <h3 className="an-section-title">Calibracao de Confianca</h3>
            <p className="an-section-desc">Quanto maior, melhor voce avalia sua propria certeza</p>
            <BarChart data={calData} maxVal={100} color="var(--blu)" />
          </div>
        )}

        {/* SRS Distribution */}
        {totalCards > 0 && (
          <div className="an-section">
            <h3 className="an-section-title">Caixas de Leitner</h3>
            <p className="an-section-desc">{totalCards} cartoes · {totalReviews} revisoes totais</p>
            <BarChart
              data={[1, 2, 3, 4, 5].map(b => ({
                label: `Cx${b}`,
                value: boxDistribution[b] || 0,
                color: b >= 4 ? 'var(--grn)' : b >= 2 ? 'var(--co)' : 'var(--red)',
              }))}
              height={100}
            />
          </div>
        )}

        {/* Weakest topics */}
        {weakest.length > 0 && (
          <div className="an-section">
            <h3 className="an-section-title">Topicos Mais Fracos</h3>
            <p className="an-section-desc">Modulos com mais cartoes na Caixa 1 (revisao diaria)</p>
            <BarChart data={weakest} color="var(--red)" height={80} />
          </div>
        )}
      </div>
    </div>
  );
}

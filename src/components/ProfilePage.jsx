import { useState, useEffect } from 'react';
import { CHAPTERS } from '../data/chapters';
import { apiGetCertificates } from '../api';

function BarChart({ data, maxVal, color = 'var(--co)', height = 120 }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="analytics-bar-chart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="abc-col" title={`${d.label}: ${d.value}`}>
          <div className="abc-bar" style={{ height: `${Math.max((d.value / max) * 100, 3)}%`, background: d.color || color }} />
          <div className="abc-val">{d.value}</div>
          <div className="abc-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ProfilePage({ user, progress, boxDistribution, streak, totalReviews, allCards, onClose, onLogout }) {
  const [certificates, setCertificates] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  useEffect(() => {
    apiGetCertificates()
      .then(setCertificates)
      .catch(() => {})
      .finally(() => setLoadingCerts(false));
  }, []);

  const chapters = CHAPTERS.filter(ch => ch.id !== 'appendix');

  const quizData = chapters.map(ch => ({
    label: ch.icon,
    value: progress.quizResults[ch.id]?.score || 0,
    color: progress.passedChapters.includes(ch.id) ? 'var(--grn)' : 'var(--brd)',
  }));

  const calData = chapters
    .filter(ch => progress.quizResults[ch.id]?.calibrationScore !== undefined)
    .map(ch => ({ label: ch.icon, value: progress.quizResults[ch.id]?.calibrationScore || 0, color: 'var(--blu)' }));

  const box1ByChapter = {};
  allCards.forEach(c => { if (c.box === 1) box1ByChapter[c.chapterId] = (box1ByChapter[c.chapterId] || 0) + 1; });
  const weakest = Object.entries(box1ByChapter).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([chId, count]) => ({ label: CHAPTERS.find(c => c.id === chId)?.icon || chId, value: count, color: 'var(--red)' }));

  const totalChallenges = CHAPTERS.reduce((sum, ch) => sum + (ch.challenges?.length || 0), 0);
  const completedChallenges = Object.values(progress.challenges || {}).filter(c => c.completed).length;
  const totalCards = allCards.length;
  const mastered = boxDistribution[5] || 0;
  const retentionEstimate = totalCards > 0 ? Math.round(((mastered + (boxDistribution[4] || 0) * 0.8 + (boxDistribution[3] || 0) * 0.6) / totalCards) * 100) : 0;

  return (
    <div className="profile-page">
      <div className="profile-inner">

        {/* Header */}
        <div className="pf-header">
          <div className="pf-header-left">
            <div className="pf-avatar">{user.name?.charAt(0)?.toUpperCase() || '?'}</div>
            <div>
              <h2 className="pf-name">{user.name}</h2>
              <p className="pf-email">{user.email}</p>
              <p className="pf-since">Membro desde {formatDate(user.created_at)}</p>
            </div>
          </div>
          <div className="pf-header-right">
            <button className="pf-close" onClick={onClose}>← Voltar</button>
            <button className="pf-logout" onClick={onLogout}>Sair</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="an-kpis">
          <div className="an-kpi">
            <div className="an-kpi-num">{progress.passedChapters.length}/{chapters.length}</div>
            <div className="an-kpi-label">Modulos concluidos</div>
          </div>
          <div className="an-kpi">
            <div className="an-kpi-num">{streak.current}</div>
            <div className="an-kpi-label">Dias de revisao</div>
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

        {/* Certificates */}
        <div className="pf-section">
          <h3 className="pf-section-title">🏆 Certificados Obtidos</h3>
          {loadingCerts ? (
            <p className="pf-section-empty">Carregando...</p>
          ) : certificates.length === 0 ? (
            <p className="pf-section-empty">Nenhum certificado emitido. Conclua modulos e gere seus certificados.</p>
          ) : (
            <div className="pf-certs-grid">
              {certificates.map(c => (
                <a key={c.code} href={`/validate/${c.code}`} className="pf-cert-card" target="_blank" rel="noopener">
                  <div className="pf-cert-top">
                    <span className="pf-cert-title">{c.target_title}</span>
                    <span className="pf-cert-type">{c.target_type === 'world' ? 'Mundo' : 'Capitulo'}</span>
                  </div>
                  <div className="pf-cert-bottom">
                    <span className="pf-cert-score">{c.score}%</span>
                    <span className="pf-cert-date">{formatDate(c.issued_at)}</span>
                    <span className="pf-cert-code">{c.code}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
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
                label: `Cx${b}`, value: boxDistribution[b] || 0,
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
            <p className="an-section-desc">Modulos com mais cartoes na Caixa 1</p>
            <BarChart data={weakest} color="var(--red)" height={80} />
          </div>
        )}
      </div>
    </div>
  );
}

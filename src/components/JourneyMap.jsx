import { useMemo, useEffect, useRef, useState } from 'react';
import { CHAPTERS } from '../data/chapters';

const COLS = 4;
const CELL_W = 196;
const CELL_H = 218;
const NODE_SIZE = 90;

const WORLDS = [
  { id: 'forest', rows: [0],    label: 'MUNDO 1',  sub: 'FUNDAMENTOS',   emoji: '🌲' },
  { id: 'desert', rows: [1],    label: 'MUNDO 2',  sub: 'CONFIGURAÇÃO',  emoji: '⚙' },
  { id: 'ocean',  rows: [2],    label: 'MUNDO 3',  sub: 'AUTOMAÇÃO',     emoji: '🤖' },
  { id: 'castle', rows: [3, 4], label: 'MUNDO 4',  sub: 'PRODUÇÃO',      emoji: '🏰' },
];

function getStars(score) {
  if (!score || score < 70) return 0;
  if (score < 80) return 1;
  if (score < 85) return 2;
  if (score < 90) return 3;
  if (score < 95) return 4;
  return 5;
}

function getDisplayNum(ch, idx) {
  if (ch.id === 'appendix') return 'AP';
  return String(idx + 1).padStart(2, '0');
}

export default function JourneyMap({ onClose, onSelectChapter, onGenerateCertificate, onResetChapter, progress, getChapterDecay }) {
  const scrollRef = useRef(null);
  const heroRef = useRef(null);
  const [popupNode, setPopupNode] = useState(null);

  const currentChId = useMemo(() => {
    return (
      CHAPTERS.find(ch => !progress.passedChapters.includes(ch.id))?.id ||
      CHAPTERS[CHAPTERS.length - 1].id
    );
  }, [progress.passedChapters]);

  const nodes = useMemo(() => {
    return CHAPTERS.map((ch, idx) => {
      const row = Math.floor(idx / COLS);
      const pos = idx % COLS;
      const col = row % 2 === 0 ? pos : COLS - 1 - pos;
      const cx = col * CELL_W + CELL_W / 2;
      const cy = row * CELL_H + CELL_H / 2;

      const isCompleted = progress.passedChapters.includes(ch.id);
      const isCurrent = ch.id === currentChId;
      const prevPassed = idx === 0 || progress.passedChapters.includes(CHAPTERS[idx - 1]?.id);
      const isAvailable = !isCompleted && prevPassed;

      let status = 'locked';
      if (isCompleted) status = 'completed';
      else if (isCurrent) status = 'current';
      else if (isAvailable) status = 'available';

      return {
        ch, idx, row, col, cx, cy, status,
        stars: getStars(progress.quizResults[ch.id]?.score),
        score: progress.quizResults[ch.id]?.score || 0,
      };
    });
  }, [progress, currentChId]);

  const numRows = Math.ceil(CHAPTERS.length / COLS);
  const mapW = COLS * CELL_W;
  const mapH = numRows * CELL_H + 24;

  // Auto-scroll para o capítulo atual
  useEffect(() => {
    const t = setTimeout(() => {
      if (heroRef.current && scrollRef.current) {
        const heroTop = heroRef.current.offsetTop;
        const half = scrollRef.current.clientHeight / 2;
        scrollRef.current.scrollTop = heroTop - half + 20;
      }
    }, 60);
    return () => clearTimeout(t);
  }, []);

  // Fechar com ESC
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        if (popupNode) { setPopupNode(null); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, popupNode]);

  const handleNodeClick = (node) => {
    if (node.status === 'locked') return;
    if (node.status === 'completed') {
      setPopupNode(prev => prev?.ch.id === node.ch.id ? null : node);
      return;
    }
    onSelectChapter(node.ch.id);
    onClose();
  };

  const done = progress.passedChapters.length;
  const total = CHAPTERS.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="jm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Mapa da Jornada">
      <div className="jm-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────────── */}
        <div className="jm-header">
          <div className="jm-header-brand">
            <span className="jm-header-icon">🗺</span>
            <div className="jm-header-text">
              <div className="jm-header-title">MAPA DA JORNADA</div>
              <div className="jm-header-sub">CLAUDE CODE MASTERY</div>
            </div>
          </div>

          <div className="jm-xp-block">
            <div className="jm-xp-bar-track">
              <div className="jm-xp-bar-fill" style={{ width: `${pct}%` }} />
              <div className="jm-xp-bar-pixels" />
            </div>
            <div className="jm-xp-label">{done} / {total} concluídos &nbsp;·&nbsp; {pct}%</div>
          </div>

          <button className="jm-close-btn" onClick={onClose} aria-label="Fechar mapa">
            ✕ ESC
          </button>
        </div>

        {/* ── Mapa ────────────────────────────────── */}
        <div className="jm-scroll" ref={scrollRef} onClick={() => setPopupNode(null)}>
          <div className="jm-map" style={{ width: mapW, height: mapH }}>

            {/* Zonas-mundo */}
            {WORLDS.map(w => (
              <div
                key={w.id}
                className={`jm-zone jm-zone-${w.id}`}
                style={{
                  top: Math.min(...w.rows) * CELL_H,
                  height: w.rows.length * CELL_H,
                  width: mapW,
                }}
              >
                <span className="jm-zone-tag">{w.emoji} {w.label} — {w.sub}</span>
              </div>
            ))}

            {/* SVG — paths entre nós */}
            <svg
              className="jm-svg"
              width={mapW}
              height={mapH}
              aria-hidden="true"
            >
              {nodes.slice(0, -1).map((n, i) => {
                const next = nodes[i + 1];
                const done = n.status === 'completed';

                // Calcula pontos intermediários para pixel dots
                const dx = next.cx - n.cx;
                const dy = next.cy - n.cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const steps = Math.floor(dist / 22);

                return (
                  <g key={i}>
                    {/* Halo do path concluído */}
                    {done && (
                      <line
                        x1={n.cx} y1={n.cy} x2={next.cx} y2={next.cy}
                        stroke="#E87040" strokeWidth={16} opacity={0.12}
                        strokeLinecap="square"
                      />
                    )}
                    {/* Path principal */}
                    <line
                      x1={n.cx} y1={n.cy} x2={next.cx} y2={next.cy}
                      stroke={done ? '#E87040' : '#252535'}
                      strokeWidth={done ? 5 : 3}
                      strokeDasharray={done ? 'none' : '9 7'}
                      strokeLinecap="square"
                      opacity={done ? 1 : 0.45}
                    />
                    {/* Pixel dots no path concluído */}
                    {done && Array.from({ length: steps - 1 }, (_, k) => {
                      const t = (k + 1) / steps;
                      return (
                        <rect
                          key={k}
                          x={n.cx + dx * t - 2.5}
                          y={n.cy + dy * t - 2.5}
                          width={5} height={5}
                          fill="#F4A261"
                          opacity={0.55}
                        />
                      );
                    })}
                  </g>
                );
              })}
              {/* Decay rings for completed nodes */}
              {getChapterDecay && nodes.filter(n => n.status === 'completed').map(n => {
                const decay = getChapterDecay(n.ch.id);
                if (decay <= 0) return null;
                const r = NODE_SIZE / 2 + 6;
                const hue = Math.round(120 * (1 - decay)); // 120=green → 0=red
                return (
                  <circle
                    key={`decay-${n.ch.id}`}
                    cx={n.cx} cy={n.cy} r={r}
                    fill="none"
                    stroke={`hsl(${hue}, 65%, 50%)`}
                    strokeWidth={3}
                    opacity={0.5 + decay * 0.4}
                    strokeDasharray={`${2 * Math.PI * r * (1 - decay * 0.7)}`}
                    strokeDashoffset={0}
                    transform={`rotate(-90 ${n.cx} ${n.cy})`}
                  />
                );
              })}
            </svg>

            {/* Popup de módulo concluído */}
            {popupNode && (() => {
              const popupH = 170;
              const aboveTop = popupNode.cy - NODE_SIZE / 2 - popupH - 12;
              const belowTop = popupNode.cy + NODE_SIZE / 2 + 12;
              const showBelow = aboveTop < 10;
              return (
              <div
                className={`jm-node-popup ${showBelow ? 'below' : ''}`}
                onClick={e => e.stopPropagation()}
                style={{
                  left: Math.max(8, popupNode.cx - 105),
                  top: showBelow ? belowTop : aboveTop,
                }}
              >
                <div className="jm-popup-title">{popupNode.ch.icon} {popupNode.ch.title}</div>
                <div className="jm-popup-score">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={s <= popupNode.stars ? 'jm-star-on' : 'jm-star-off'}>★</span>
                  ))}
                  <span className="jm-popup-pct">&nbsp;{popupNode.score}%</span>
                </div>
                <div className="jm-popup-actions">
                  <button
                    className="jm-popup-btn jm-popup-btn-go"
                    onClick={() => { onSelectChapter(popupNode.ch.id); onClose(); }}
                  >
                    Ir ao módulo
                  </button>
                  <button
                    className="jm-popup-btn jm-popup-btn-cert"
                    onClick={() => onGenerateCertificate(popupNode.ch, popupNode.score)}
                  >
                    🏆 Gerar Certificado
                  </button>
                  <button
                    className="jm-popup-btn jm-popup-btn-reset"
                    onClick={() => onResetChapter(popupNode.ch.id)}
                  >
                    ↺ Refazer módulo
                  </button>
                </div>
                <div className={`jm-popup-arrow ${showBelow ? 'arrow-top' : ''}`} />
              </div>
              );
            })()}

            {/* Nós dos capítulos */}
            {nodes.map(n => (
              <div key={n.ch.id}>

                {/* Herói — marcador "você está aqui" */}
                {n.status === 'current' && (
                  <div
                    className="jm-hero"
                    ref={heroRef}
                    style={{ left: n.cx - 12, top: n.cy - NODE_SIZE / 2 - 34 }}
                    aria-hidden="true"
                  >
                    ▼
                  </div>
                )}

                {/* Nó */}
                <div
                  className={`jm-node jm-node-${n.status}`}
                  style={{
                    left: n.cx - NODE_SIZE / 2,
                    top: n.cy - NODE_SIZE / 2,
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                  }}
                  onClick={() => handleNodeClick(n)}
                  role={n.status !== 'locked' ? 'button' : undefined}
                  tabIndex={n.status !== 'locked' ? 0 : undefined}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleNodeClick(n)}
                  title={
                    n.status === 'locked'
                      ? 'Complete o capítulo anterior para desbloquear'
                      : n.ch.title
                  }
                >
                  <div className="jm-node-icon">
                    {n.status === 'locked' ? '🔒' : n.ch.icon}
                  </div>

                  <div className="jm-node-num">{getDisplayNum(n.ch, n.idx)}</div>

                  {n.status === 'completed' && (
                    <div className="jm-node-badge jm-node-badge-done" aria-hidden="true">✓</div>
                  )}
                  {n.status === 'available' && (
                    <div className="jm-node-badge jm-node-badge-avail" aria-hidden="true">!</div>
                  )}
                </div>

                {/* Estrelas (1–5) abaixo do nó */}
                {n.status === 'completed' && (
                  <div
                    className="jm-stars"
                    style={{
                      left: n.cx - NODE_SIZE / 2,
                      top: n.cy + NODE_SIZE / 2 + 3,
                      width: NODE_SIZE,
                    }}
                    aria-label={`${n.stars} de 5 estrelas`}
                  >
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={s <= n.stars ? 'jm-star-on' : 'jm-star-off'}>
                        ★
                      </span>
                    ))}
                  </div>
                )}

                {/* Label do capítulo */}
                <div
                  className={`jm-label jm-label-${n.status}`}
                  style={{
                    left: n.cx - CELL_W / 2 + 2,
                    top: n.cy + NODE_SIZE / 2 + (n.status === 'completed' ? 22 : 5),
                    width: CELL_W - 4,
                  }}
                >
                  {n.status === 'locked' ? '???' : n.ch.title}
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* ── Legenda ─────────────────────────────── */}
        <div className="jm-legend">
          <div className="jm-legend-states">
            {[
              { status: 'completed', label: 'Concluído' },
              { status: 'current',   label: 'Em andamento' },
              { status: 'available', label: 'Disponível' },
              { status: 'locked',    label: 'Bloqueado' },
            ].map(item => (
              <div key={item.status} className="jm-legend-item">
                <div className={`jm-legend-dot jm-node-${item.status}`} />
                <span className="jm-legend-text">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="jm-legend-stars-guide">
            <span className="jm-legend-text">Estrelas:</span>
            {[
              { n: 5, label: '100%' },
              { n: 4, label: '95%+' },
              { n: 3, label: '90%+' },
              { n: 2, label: '85%+' },
              { n: 1, label: '80%+' },
            ].map(item => (
              <span key={item.n} className="jm-legend-star-item">
                <span className="jm-star-on">{'★'.repeat(item.n)}</span>
                <span className="jm-star-off">{'★'.repeat(5 - item.n)}</span>
                <span className="jm-legend-text">&nbsp;{item.label}</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

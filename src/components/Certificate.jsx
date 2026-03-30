import { useRef, useState, useEffect } from 'react'

const TODAY = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

function drawCertificate(canvas, name, chapter, score) {
  const ctx = canvas.getContext('2d')
  const W = 1200, H = 840
  canvas.width = W
  canvas.height = H

  // Background cream
  ctx.fillStyle = '#FDFAF5'
  ctx.fillRect(0, 0, W, H)

  // Outer orange border
  ctx.strokeStyle = '#E87040'
  ctx.lineWidth = 10
  ctx.strokeRect(16, 16, W - 32, H - 32)

  // Inner dark border
  ctx.strokeStyle = '#2A2A35'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, W - 60, H - 60)

  // Header band
  ctx.fillStyle = '#1C1C26'
  ctx.fillRect(16, 16, W - 32, 135)

  // Orange accent stripe
  ctx.fillStyle = '#E87040'
  ctx.fillRect(16, 151, W - 32, 6)

  // Header label
  ctx.fillStyle = '#E87040'
  ctx.font = 'bold 13px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.letterSpacing = '4px'
  ctx.fillText('CLAUDE CODE MASTERY', W / 2, 58)

  ctx.letterSpacing = '0px'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 36px Georgia, "Times New Roman", serif'
  ctx.fillText('CERTIFICADO DE CONCLUSÃO', W / 2, 110)

  // Corner brackets
  const bSize = 36
  const bPad = 42
  const brackets = [
    [bPad, 168], [W - bPad - bSize, 168],
    [bPad, H - bPad - bSize], [W - bPad - bSize, H - bPad - bSize],
  ]
  brackets.forEach(([x, y]) => {
    ctx.strokeStyle = '#E87040'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x + bSize, y); ctx.lineTo(x, y); ctx.lineTo(x, y + bSize)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y + bSize); ctx.moveTo(x + bSize, y + bSize + bSize - bSize)
    ctx.moveTo(x + bSize, y + bSize); ctx.lineTo(x + bSize, y + bSize); ctx.moveTo(x, y + bSize)
    ctx.stroke()
  })
  // Simplified corners
  [[bPad, 168], [W - bPad - bSize, 168], [bPad, H - bPad - bSize], [W - bPad - bSize, H - bPad - bSize]].forEach(([x, y]) => {
    ctx.strokeStyle = '#E87040'
    ctx.lineWidth = 3
    // top-left L shape
    ctx.beginPath()
    ctx.moveTo(x + bSize, y); ctx.lineTo(x, y); ctx.lineTo(x, y + bSize)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y + bSize + 2); ctx.lineTo(x, y + bSize + 2)
    ctx.stroke()
  })

  // "Certificamos que"
  ctx.fillStyle = '#6B6560'
  ctx.font = 'italic 22px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('Certificamos que', W / 2, 250)

  // Name
  ctx.fillStyle = '#1C1C26'
  ctx.font = 'bold 54px Georgia, "Times New Roman", serif'
  ctx.fillText(name, W / 2, 335)

  // Underline name
  const nw = Math.min(ctx.measureText(name).width, W - 200)
  ctx.strokeStyle = '#E87040'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(W / 2 - nw / 2, 352)
  ctx.lineTo(W / 2 + nw / 2, 352)
  ctx.stroke()

  // "concluiu com êxito"
  ctx.fillStyle = '#6B6560'
  ctx.font = 'italic 22px Georgia, serif'
  ctx.fillText('concluiu com êxito o módulo', W / 2, 410)

  // Chapter title
  ctx.fillStyle = '#E87040'
  ctx.font = 'bold 30px Georgia, serif'
  ctx.fillText(`${chapter.icon}  ${chapter.title}`, W / 2, 470)

  // Score
  ctx.fillStyle = '#3A7D44'
  ctx.font = 'bold 20px "Courier New", monospace'
  ctx.fillText(`★  Aprovado com ${score}% de aproveitamento  ★`, W / 2, 528)

  // Dashed divider
  ctx.strokeStyle = '#2A2A35'
  ctx.lineWidth = 1
  ctx.setLineDash([10, 7])
  ctx.beginPath()
  ctx.moveTo(120, 612); ctx.lineTo(W - 120, 612)
  ctx.stroke()
  ctx.setLineDash([])

  // Date
  ctx.fillStyle = '#9B9690'
  ctx.font = '18px Georgia, serif'
  ctx.fillText(TODAY, W / 2, 652)

  // Footer band
  ctx.fillStyle = '#1C1C26'
  ctx.fillRect(16, H - 78, W - 32, 62)
  ctx.fillStyle = '#6B6560'
  ctx.font = '13px "Courier New", monospace'
  ctx.fillText('Claude Code Mastery · Plataforma de Aprendizagem Interativa · Certificado gerado automaticamente', W / 2, H - 40)
}

export default function Certificate({ chapter, score, onClose }) {
  const [name, setName] = useState('')
  const [step, setStep] = useState('input')
  const canvasRef = useRef(null)

  useEffect(() => {
    if (step === 'preview' && canvasRef.current) {
      drawCertificate(canvasRef.current, name.trim(), chapter, score)
    }
  }, [step, name, chapter, score])

  const handleDownload = () => {
    if (!canvasRef.current) return
    drawCertificate(canvasRef.current, name.trim(), chapter, score)
    const a = document.createElement('a')
    a.download = `certificado-${chapter.id}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="cert-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cert-modal">
        <button className="cert-close" onClick={onClose} aria-label="Fechar">✕</button>

        {step === 'input' && (
          <>
            <div className="cert-trophy">🏆</div>
            <h2 className="cert-heading">Módulo Concluído!</h2>
            <p className="cert-chapter-label">{chapter.icon} {chapter.title}</p>
            <p className="cert-score-label">Aproveitamento: <span>{score}%</span></p>

            <div className="cert-form">
              <label className="cert-label">Seu nome para o certificado</label>
              <input
                className="cert-input"
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && name.trim() && setStep('preview')}
              />
              <div className="cert-actions">
                <button className="cert-btn-ghost" onClick={onClose}>Agora não</button>
                <button
                  className="cert-btn-primary"
                  disabled={!name.trim()}
                  onClick={() => setStep('preview')}
                >
                  Visualizar Certificado →
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="cert-preview-header">
              <span className="cert-preview-label">Prévia do Certificado</span>
              <span className="cert-preview-name">{name}</span>
            </div>
            <div className="cert-canvas-wrap">
              <canvas ref={canvasRef} className="cert-canvas" />
            </div>
            <div className="cert-actions">
              <button className="cert-btn-ghost" onClick={() => setStep('input')}>← Editar nome</button>
              <button className="cert-btn-primary" onClick={handleDownload}>⬇ Baixar PNG</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

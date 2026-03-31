import { useRef, useState, useEffect } from 'react'

const TODAY = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

function drawCertificate(canvas, name, chapter, score) {
  try {
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

    // Header text
    ctx.textAlign = 'center'
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 14px "Courier New", monospace'
    ctx.fillText('C L A U D E   C O D E   M A S T E R Y', W / 2, 58)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px Georgia, "Times New Roman", serif'
    ctx.fillText('CERTIFICADO DE CONCLUSAO', W / 2, 110)

    // Corner L-brackets
    const cs = 36, cp = 42
    ;[[cp, 168], [W - cp - cs, 168], [cp, H - cp - cs], [W - cp - cs, H - cp - cs]].forEach(([x, y]) => {
      ctx.strokeStyle = '#E87040'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x + cs, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + cs)
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
    ctx.fillText(name || 'Aluno', W / 2, 335)

    // Underline
    const nw = Math.min(ctx.measureText(name || 'Aluno').width, W - 200)
    ctx.strokeStyle = '#E87040'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(W / 2 - nw / 2, 352)
    ctx.lineTo(W / 2 + nw / 2, 352)
    ctx.stroke()

    // "concluiu com exito"
    ctx.fillStyle = '#6B6560'
    ctx.font = 'italic 22px Georgia, serif'
    ctx.fillText('concluiu com exito', W / 2, 410)

    // Chapter/World title
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 30px Georgia, serif'
    const titleText = chapter.icon ? `${chapter.icon}  ${chapter.title}` : chapter.title
    ctx.fillText(titleText, W / 2, 470)

    // Score
    ctx.fillStyle = '#3A7D44'
    ctx.font = 'bold 20px "Courier New", monospace'
    ctx.fillText(`Aprovado com ${score}% de aproveitamento`, W / 2, 530)

    // Divider
    ctx.strokeStyle = '#2A2A35'
    ctx.lineWidth = 1
    ctx.setLineDash([10, 7])
    ctx.beginPath()
    ctx.moveTo(120, 610)
    ctx.lineTo(W - 120, 610)
    ctx.stroke()
    ctx.setLineDash([])

    // Date
    ctx.fillStyle = '#9B9690'
    ctx.font = '18px Georgia, serif'
    ctx.fillText(TODAY, W / 2, 650)

    // Footer
    ctx.fillStyle = '#1C1C26'
    ctx.fillRect(16, H - 78, W - 32, 62)
    ctx.fillStyle = '#6B6560'
    ctx.font = '13px "Courier New", monospace'
    ctx.fillText('Claude Code Mastery - Plataforma de Aprendizagem Interativa', W / 2, H - 40)
  } catch (err) {
    console.error('Certificate draw error:', err)
  }
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

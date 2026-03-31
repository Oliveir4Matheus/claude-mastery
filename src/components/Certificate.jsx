import { useRef, useState, useEffect, useMemo } from 'react'
import { apiSaveCertificate, isLoggedIn } from '../api'

const TODAY = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const arr = crypto.getRandomValues(new Uint8Array(12))
  for (let i = 0; i < 12; i++) code += chars[arr[i] % chars.length]
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`
}

function drawCertificate(canvas, name, chapter, score, code) {
  try {
    const ctx = canvas.getContext('2d')
    const W = 1200, H = 840
    canvas.width = W
    canvas.height = H

    // Dark background
    ctx.fillStyle = '#0F0F14'
    ctx.fillRect(0, 0, W, H)

    // Outer orange border
    ctx.strokeStyle = '#E87040'
    ctx.lineWidth = 4
    ctx.strokeRect(12, 12, W - 24, H - 24)

    // Inner subtle border
    ctx.strokeStyle = '#2A2A35'
    ctx.lineWidth = 1
    ctx.strokeRect(24, 24, W - 48, H - 48)

    // Header band
    ctx.fillStyle = '#16161D'
    ctx.fillRect(12, 12, W - 24, 130)

    // Orange accent stripe
    ctx.fillStyle = '#E87040'
    ctx.fillRect(12, 142, W - 24, 3)

    // Header text
    ctx.textAlign = 'center'
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 13px "Courier New", monospace'
    ctx.fillText('C L A U D E   C O D E   M A S T E R Y', W / 2, 55)

    ctx.fillStyle = '#E8E4DF'
    ctx.font = 'bold 34px Georgia, "Times New Roman", serif'
    ctx.fillText('CERTIFICADO DE CONCLUSAO', W / 2, 105)

    // Corner L-brackets
    const cs = 32, cp = 36
    ;[[cp, 158], [W - cp - cs, 158], [cp, H - cp - cs], [W - cp - cs, H - cp - cs]].forEach(([x, y]) => {
      ctx.strokeStyle = '#E87040'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + cs, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + cs)
      ctx.stroke()
    })

    // "Certificamos que"
    ctx.fillStyle = '#9B9690'
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText('Certificamos que', W / 2, 235)

    // Name
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 50px Georgia, "Times New Roman", serif'
    ctx.fillText(name || 'Aluno', W / 2, 310)

    // Underline
    const nw = Math.min(ctx.measureText(name || 'Aluno').width, W - 200)
    ctx.strokeStyle = '#E87040'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.moveTo(W / 2 - nw / 2, 325)
    ctx.lineTo(W / 2 + nw / 2, 325)
    ctx.stroke()
    ctx.globalAlpha = 1

    // "concluiu com exito"
    ctx.fillStyle = '#9B9690'
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText('concluiu com exito', W / 2, 385)

    // Chapter/World title
    ctx.fillStyle = '#E8E4DF'
    ctx.font = 'bold 28px Georgia, serif'
    const titleText = chapter.icon ? `${chapter.icon}  ${chapter.title}` : chapter.title
    ctx.fillText(titleText, W / 2, 440)

    // Score
    ctx.fillStyle = '#6BCB77'
    ctx.font = 'bold 18px "Courier New", monospace'
    ctx.fillText(`Aprovado com ${score}% de aproveitamento`, W / 2, 495)

    // Divider
    ctx.strokeStyle = '#2A2A35'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(100, 560)
    ctx.lineTo(W - 100, 560)
    ctx.stroke()
    ctx.setLineDash([])

    // Date (left) + Validation code (right)
    ctx.fillStyle = '#6B6560'
    ctx.font = '16px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText(TODAY, 100, 600)

    ctx.textAlign = 'right'
    ctx.font = '12px "Courier New", monospace'
    ctx.fillStyle = '#9B9690'
    ctx.fillText(`Codigo de validacao:`, W - 100, 590)
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 16px "Courier New", monospace'
    ctx.fillText(code, W - 100, 612)

    // Validation URL
    ctx.fillStyle = '#6B6560'
    ctx.font = '11px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`Valide em: claude-mastery.app/validate/${code}`, W / 2, 660)

    // Footer band
    ctx.fillStyle = '#16161D'
    ctx.fillRect(12, H - 70, W - 24, 58)

    // Footer text
    ctx.fillStyle = '#6B6560'
    ctx.font = '12px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Claude Code Mastery  |  Plataforma de Aprendizagem Interativa  |  Certificado verificavel', W / 2, H - 35)
  } catch (err) {
    console.error('Certificate draw error:', err)
  }
}

export default function Certificate({ chapter, score, onClose, isAuthenticated }) {
  const [name, setName] = useState('')
  const [step, setStep] = useState('input')
  const canvasRef = useRef(null)

  const validationCode = useMemo(() => generateCode(), [chapter.id, score])

  useEffect(() => {
    if (step === 'preview' && canvasRef.current) {
      drawCertificate(canvasRef.current, name.trim(), chapter, score, validationCode)
    }
  }, [step, name, chapter, score, validationCode])

  const handleDownload = () => {
    if (!canvasRef.current) return
    drawCertificate(canvasRef.current, name.trim(), chapter, score, validationCode)
    const a = document.createElement('a')
    a.download = `certificado-${chapter.id}-${validationCode}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()

    // Save to database
    if (isLoggedIn()) {
      apiSaveCertificate({
        code: validationCode,
        holderName: name.trim(),
        targetType: chapter.id?.startsWith('ch') ? 'chapter' : 'world',
        targetId: chapter.id,
        targetTitle: chapter.icon ? `${chapter.icon} ${chapter.title}` : chapter.title,
        score,
      }).catch(() => {})
    }
  }

  return (
    <div className="cert-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cert-modal">
        <button className="cert-close" onClick={onClose} aria-label="Fechar">✕</button>

        {step === 'input' && (
          <>
            <div className="cert-trophy">🏆</div>
            <h2 className="cert-heading">Modulo Concluido!</h2>
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
                <button className="cert-btn-ghost" onClick={onClose}>Agora nao</button>
                <button
                  className="cert-btn-primary"
                  disabled={!name.trim()}
                  onClick={() => setStep('preview')}
                >
                  Visualizar Certificado
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="cert-preview-header">
              <span className="cert-preview-label">Previa do Certificado</span>
              <span className="cert-preview-code">{validationCode}</span>
            </div>
            <div className="cert-canvas-wrap">
              <canvas ref={canvasRef} className="cert-canvas" />
            </div>
            <div className="cert-actions">
              <button className="cert-btn-ghost" onClick={() => setStep('input')}>← Editar nome</button>
              <button className="cert-btn-primary" onClick={handleDownload}>Baixar PNG</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

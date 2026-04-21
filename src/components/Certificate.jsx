import { useRef, useEffect, useMemo } from 'react'
import { apiSaveCertificate } from '../api'
import { COURSE } from '../config/course.config'

const TODAY = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const VALIDATE_URL = COURSE.brand.validateUrl

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

    const t = COURSE.theme
    const PRIMARY = t.primary
    const BG0 = t.bg0
    const BG1 = t.bg1
    const BORDER = t.border
    const TX = t.tx
    const TX2 = t.tx2
    const TX3 = t.tx3
    const GREEN = t.green

    ctx.fillStyle = BG0
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = PRIMARY
    ctx.lineWidth = 4
    ctx.strokeRect(12, 12, W - 24, H - 24)

    ctx.strokeStyle = BORDER
    ctx.lineWidth = 1
    ctx.strokeRect(24, 24, W - 48, H - 48)

    ctx.fillStyle = BG1
    ctx.fillRect(12, 12, W - 24, 130)

    ctx.fillStyle = PRIMARY
    ctx.fillRect(12, 142, W - 24, 3)

    ctx.textAlign = 'center'
    ctx.fillStyle = PRIMARY
    ctx.font = 'bold 13px "Courier New", monospace'
    ctx.fillText(COURSE.brand.certificateWatermark, W / 2, 55)

    ctx.fillStyle = TX
    ctx.font = 'bold 34px Georgia, "Times New Roman", serif'
    ctx.fillText('CERTIFICADO DE CONCLUSAO', W / 2, 105)

    const cs = 32, cp = 36
    ;[[cp, 158], [W - cp - cs, 158], [cp, H - cp - cs], [W - cp - cs, H - cp - cs]].forEach(([x, y]) => {
      ctx.strokeStyle = PRIMARY
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + cs, y)
      ctx.lineTo(x, y)
      ctx.lineTo(x, y + cs)
      ctx.stroke()
    })

    ctx.fillStyle = TX2
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText('Certificamos que', W / 2, 235)

    ctx.fillStyle = PRIMARY
    ctx.font = 'bold 50px Georgia, "Times New Roman", serif'
    ctx.fillText(name || 'Aluno', W / 2, 310)

    const nw = Math.min(ctx.measureText(name || 'Aluno').width, W - 200)
    ctx.strokeStyle = PRIMARY
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.moveTo(W / 2 - nw / 2, 325)
    ctx.lineTo(W / 2 + nw / 2, 325)
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.fillStyle = TX2
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText('concluiu com exito', W / 2, 385)

    ctx.fillStyle = TX
    ctx.font = 'bold 28px Georgia, serif'
    const titleText = chapter.icon ? `${chapter.icon}  ${chapter.title}` : chapter.title
    ctx.fillText(titleText, W / 2, 440)

    ctx.fillStyle = GREEN
    ctx.font = 'bold 18px "Courier New", monospace'
    ctx.fillText(`Aprovado com ${score}% de aproveitamento`, W / 2, 495)

    ctx.strokeStyle = BORDER
    ctx.lineWidth = 1
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(100, 560)
    ctx.lineTo(W - 100, 560)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = TX3
    ctx.font = '16px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText(TODAY, 100, 600)

    ctx.textAlign = 'right'
    ctx.font = '12px "Courier New", monospace'
    ctx.fillStyle = TX2
    ctx.fillText('Codigo de validacao:', W - 100, 590)
    ctx.fillStyle = PRIMARY
    ctx.font = 'bold 16px "Courier New", monospace'
    ctx.fillText(code, W - 100, 612)

    ctx.fillStyle = TX3
    ctx.font = '11px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`Valide em: ${VALIDATE_URL}/${code}`, W / 2, 660)

    ctx.fillStyle = BG1
    ctx.fillRect(12, H - 70, W - 24, 58)
    ctx.fillStyle = TX3
    ctx.font = '12px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${COURSE.brand.name}  |  ${COURSE.brand.certificateFooter}`, W / 2, H - 35)
  } catch (err) {
    console.error('Certificate draw error:', err)
  }
}

export default function Certificate({ chapter, score, onClose, userName }) {
  const canvasRef = useRef(null)
  const validationCode = useMemo(() => generateCode(), [chapter.id, score])
  const holderName = userName || 'Aluno'

  useEffect(() => {
    if (canvasRef.current) {
      drawCertificate(canvasRef.current, holderName, chapter, score, validationCode)
    }
  }, [holderName, chapter, score, validationCode])

  const handleDownload = () => {
    if (!canvasRef.current) return
    drawCertificate(canvasRef.current, holderName, chapter, score, validationCode)
    const a = document.createElement('a')
    a.download = `certificado-${chapter.id}-${validationCode}.png`
    a.href = canvasRef.current.toDataURL('image/png')
    a.click()

    apiSaveCertificate({
      code: validationCode,
      holder_name: holderName,
      target_type: chapter.id?.startsWith('ch') ? 'chapter' : 'world',
      target_id: chapter.id,
      target_title: chapter.icon ? `${chapter.icon} ${chapter.title}` : chapter.title,
      score,
    }).catch(() => {})
  }

  return (
    <div className="cert-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cert-modal">
        <button className="cert-close" onClick={onClose} aria-label="Fechar">✕</button>

        <div className="cert-preview-header">
          <span className="cert-preview-label">{chapter.icon} {chapter.title}</span>
          <span className="cert-preview-code">{validationCode}</span>
        </div>
        <div className="cert-canvas-wrap">
          <canvas ref={canvasRef} className="cert-canvas" />
        </div>
        <div className="cert-actions">
          <button className="cert-btn-ghost" onClick={onClose}>Fechar</button>
          <button className="cert-btn-primary" onClick={handleDownload}>Baixar Certificado</button>
        </div>
      </div>
    </div>
  )
}

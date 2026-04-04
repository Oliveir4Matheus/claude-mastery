import { useState, useEffect, useRef } from 'react'
import { apiValidateCertificate } from '../api'

const APP_URL = import.meta.env.VITE_APP_URL || ''
const VALIDATE_URL = import.meta.env.VITE_VALIDATE_URL || `${APP_URL}/validate`

const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function drawCertificate(canvas, name, title, score, code, issuedAt) {
  try {
    const ctx = canvas.getContext('2d')
    const W = 1200, H = 840
    canvas.width = W
    canvas.height = H

    ctx.fillStyle = '#0F0F14'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#E87040'
    ctx.lineWidth = 4
    ctx.strokeRect(12, 12, W - 24, H - 24)
    ctx.strokeStyle = '#2A2A35'
    ctx.lineWidth = 1
    ctx.strokeRect(24, 24, W - 48, H - 48)
    ctx.fillStyle = '#16161D'
    ctx.fillRect(12, 12, W - 24, 130)
    ctx.fillStyle = '#E87040'
    ctx.fillRect(12, 142, W - 24, 3)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 13px "Courier New", monospace'
    ctx.fillText('C L A U D E   C O D E   M A S T E R Y', W / 2, 55)
    ctx.fillStyle = '#E8E4DF'
    ctx.font = 'bold 34px Georgia, "Times New Roman", serif'
    ctx.fillText('CERTIFICADO DE CONCLUSAO', W / 2, 105)

    const cs = 32, cp = 36
    ;[[cp, 158], [W - cp - cs, 158], [cp, H - cp - cs], [W - cp - cs, H - cp - cs]].forEach(([x, y]) => {
      ctx.strokeStyle = '#E87040'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + cs, y); ctx.lineTo(x, y); ctx.lineTo(x, y + cs)
      ctx.stroke()
    })

    ctx.fillStyle = '#9B9690'
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText('Certificamos que', W / 2, 235)
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 50px Georgia, "Times New Roman", serif'
    ctx.fillText(name, W / 2, 310)

    const nw = Math.min(ctx.measureText(name).width, W - 200)
    ctx.strokeStyle = '#E87040'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.moveTo(W / 2 - nw / 2, 325); ctx.lineTo(W / 2 + nw / 2, 325)
    ctx.stroke()
    ctx.globalAlpha = 1

    ctx.fillStyle = '#9B9690'
    ctx.font = 'italic 20px Georgia, serif'
    ctx.fillText('concluiu com exito', W / 2, 385)
    ctx.fillStyle = '#E8E4DF'
    ctx.font = 'bold 28px Georgia, serif'
    ctx.fillText(title, W / 2, 440)
    ctx.fillStyle = '#6BCB77'
    ctx.font = 'bold 18px "Courier New", monospace'
    ctx.fillText(`Aprovado com ${score}% de aproveitamento`, W / 2, 495)

    ctx.strokeStyle = '#2A2A35'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(100, 560); ctx.lineTo(W - 100, 560)
    ctx.stroke()
    ctx.setLineDash([])

    const dateStr = new Date(issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    ctx.fillStyle = '#6B6560'
    ctx.font = '16px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText(dateStr, 100, 600)

    ctx.textAlign = 'right'
    ctx.font = '12px "Courier New", monospace'
    ctx.fillStyle = '#9B9690'
    ctx.fillText('Codigo de validacao:', W - 100, 590)
    ctx.fillStyle = '#E87040'
    ctx.font = 'bold 16px "Courier New", monospace'
    ctx.fillText(code, W - 100, 612)

    ctx.fillStyle = '#6B6560'
    ctx.font = '11px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`Valide em: ${VALIDATE_URL}/${code}`, W / 2, 660)

    ctx.fillStyle = '#16161D'
    ctx.fillRect(12, H - 70, W - 24, 58)
    ctx.fillStyle = '#6B6560'
    ctx.font = '12px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Claude Code Mastery  |  Plataforma de Aprendizagem Interativa  |  Certificado verificavel', W / 2, H - 35)
  } catch (err) {
    console.error('Certificate draw error:', err)
  }
}

// Validate certificate code format (14 chars alphanumeric)
function validateCertCode(code) {
  return /^[A-Z0-9]{14}$/.test(code);
}

export default function ValidatePage({ code }) {
  const [status, setStatus] = useState('loading')
  const [cert, setCert] = useState(null)
  const canvasRef = useRef(null)

  // Validate code format before making request
  if (!validateCertCode(code)) {
    return (
      <div className="vp-wrap">
        <div className="vp-invalid">
          <div className="vp-invalid-icon">✗</div>
          <h1>Codigo invalido</h1>
          <p>O codigo do certificado nao eh valido.</p>
          <a href="/" className="vp-back-btn">Voltar ao curso</a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    apiValidateCertificate(code)
      .then(data => {
        if (data.valid) { setCert(data.certificate); setStatus('valid') }
        else setStatus('invalid')
      })
      .catch(() => setStatus('error'))
  }, [code])

  useEffect(() => {
    if (status === 'valid' && cert && canvasRef.current) {
      drawCertificate(canvasRef.current, cert.holder_name, cert.target_title, cert.score, cert.code, cert.issued_at)
    }
  }, [status, cert])

  if (status === 'loading') {
    return (
      <div className="vp-wrap">
        <div className="vp-loading">
          <div className="vp-loading-icon">⟳</div>
          <p>Verificando certificado...</p>
        </div>
      </div>
    )
  }

  if (status === 'invalid' || status === 'error') {
    return (
      <div className="vp-wrap">
        <div className="vp-invalid">
          <div className="vp-invalid-icon">✗</div>
          <h1>Certificado nao encontrado</h1>
          <p>O codigo <strong>{code}</strong> nao corresponde a nenhum certificado emitido.</p>
          <a href="/" className="vp-back-btn">Voltar ao curso</a>
        </div>
      </div>
    )
  }

  return (
    <div className="vp-wrap">
      <div className="vp-content">
        <div className="vp-cert-side">
          <canvas ref={canvasRef} className="vp-canvas" />
        </div>

        <div className="vp-info-side">
          <div className="vp-valid-badge">
            <span className="vp-check">✓</span> Certificado Valido
          </div>

          <div className="vp-info-card">
            <div className="vp-info-row">
              <span className="vp-info-label">Nome</span>
              <span className="vp-info-value vp-info-name">{cert.holder_name}</span>
            </div>
            <div className="vp-info-row">
              <span className="vp-info-label">Modulo</span>
              <span className="vp-info-value">{cert.target_title}</span>
            </div>
            <div className="vp-info-row">
              <span className="vp-info-label">Tipo</span>
              <span className="vp-info-value">{cert.target_type === 'world' ? 'Mundo completo' : 'Capitulo'}</span>
            </div>
            <div className="vp-info-row">
              <span className="vp-info-label">Aproveitamento</span>
              <span className="vp-info-value vp-info-score">{cert.score}%</span>
            </div>
            <div className="vp-info-row">
              <span className="vp-info-label">Emitido em</span>
              <span className="vp-info-value">{formatDate(cert.issued_at)}</span>
            </div>
            <div className="vp-info-row">
              <span className="vp-info-label">Codigo</span>
              <span className="vp-info-value vp-info-code">{cert.code}</span>
            </div>
          </div>

          <div className="vp-footer-info">
            <p>Este certificado foi emitido pela plataforma <strong>Claude Code Mastery</strong> e pode ser verificado a qualquer momento nesta pagina.</p>
            <a href="/" className="vp-back-btn">Conhecer o curso</a>
          </div>
        </div>
      </div>
    </div>
  )
}

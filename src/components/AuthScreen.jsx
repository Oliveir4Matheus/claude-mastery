import { useState } from 'react';

export default function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Sanitize and validate inputs
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      // Basic validation
      if (!trimmedEmail || !trimmedPassword) {
        throw new Error('Email e senha sao obrigatorios');
      }

      if (mode === 'register') {
        const trimmedName = name.trim();
        if (!trimmedName) {
          throw new Error('Nome eh obrigatorio');
        }
        // Basic name validation (no special chars that could cause XSS)
        if (!/^[\p{L}\p{N}\s'-]+$/u.test(trimmedName)) {
          throw new Error('Nome contem caracteres invalidos');
        }
        await onRegister(trimmedName, trimmedEmail, trimmedPassword);
      } else {
        await onLogin(trimmedEmail, trimmedPassword);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">⟳</div>
          <h1 className="auth-title">Claude Code Mastery</h1>
          <p className="auth-tagline">Domine o Claude Code em 15 capítulos</p>
        </div>

        <div className="auth-body">
          <p className="auth-subtitle">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <input
                className="auth-input"
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            )}
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-btn-primary" type="submit" disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button
            className="auth-toggle"
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
          </button>

          <p className="auth-hint">Seu progresso, certificados e revisões ficam salvos na sua conta</p>
        </div>
      </div>
    </div>
  );
}

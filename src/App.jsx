import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import Reader from './components/Reader';

export default function App() {
  const auth = useAuth();
  const [skipped, setSkipped] = useState(() => localStorage.getItem('claude-mastery-auth-skip') === '1');

  if (auth.loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card"><div className="auth-logo">⟳</div><p className="auth-subtitle">Carregando...</p></div>
      </div>
    );
  }

  // Show auth screen if not logged in and hasn't skipped
  if (!auth.isAuthenticated && !skipped) {
    return (
      <AuthScreen
        onLogin={auth.login}
        onRegister={auth.register}
        onSkip={() => { localStorage.setItem('claude-mastery-auth-skip', '1'); setSkipped(true); }}
      />
    );
  }

  return <Reader auth={auth} />;
}

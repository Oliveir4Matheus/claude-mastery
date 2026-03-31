import { useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import Reader from './components/Reader';

export default function App() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card"><div className="auth-logo">⟳</div><p className="auth-subtitle">Carregando...</p></div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <AuthScreen onLogin={auth.login} onRegister={auth.register} />;
  }

  return <Reader auth={auth} />;
}

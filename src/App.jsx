import { useState, useMemo } from 'react';
import { useAuth } from './hooks/useAuth';
import { COURSE } from './config/course.config';
import AuthScreen from './components/AuthScreen';
import Reader from './components/Reader';
import ValidatePage from './components/ValidatePage';

function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useState(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  });

  return path;
}

export default function App() {
  const auth = useAuth();
  const path = useRoute();

  // /validate/XXXX-XXXX-XXXX
  const validateCode = useMemo(() => {
    const match = path.match(/^\/validate\/([A-Z0-9-]+)$/i);
    return match ? match[1] : null;
  }, [path]);

  // Validate page is public (no auth required)
  if (validateCode) {
    return <ValidatePage code={validateCode} />;
  }

  if (auth.loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">{COURSE.brand.logo}</div>
            <h1 className="auth-title">{COURSE.brand.name}</h1>
          </div>
          <div className="auth-body" style={{textAlign:'center'}}>
            <p className="auth-subtitle">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <AuthScreen onLogin={auth.login} onRegister={auth.register} />;
  }

  return <Reader auth={auth} />;
}

import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Favorites } from './pages/Favorites';
import { Profile } from './pages/Profile';
import { BottomNav } from './components/BottomNav';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { SharedDevotional } from './pages/SharedDevotional';
import { Mission } from './pages/Mission';
import { useAuth } from './context/AuthContext';
import { AnalyticsService } from './services/AnalyticsService';

type Tab = 'home' | 'explore' | 'favorites' | 'profile';

function App() {
  const { session, loading } = useAuth();
  const pathname = window.location.pathname;
  const isAppPath = pathname === '/app';
  const isLoginPath = pathname === '/login';
  const isSignupPath = pathname === '/signup';
  const isMissionPath = pathname === '/missao';
  const isReferralPath = pathname.startsWith('/r/');
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  useEffect(() => {
    if (isReferralPath) {
      const code = pathname.replace('/r/', '').split('?')[0].replace('/', '');
      const searchParams = new URLSearchParams(window.location.search);
      const devotionalId = searchParams.get('d');

      if (code && devotionalId) {
        AnalyticsService.saveReferralContext(code, devotionalId);
        AnalyticsService.trackEvent('referral_click', { code, devotional_id: devotionalId });
      }
    }
  }, [isReferralPath, pathname]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Carregando...</div>;
  }

  // Se tentar acessar o /app sem sessão, joga pro login
  if (isAppPath && !session) {
    window.location.href = '/login';
    return null;
  }

  // Se tentar acessar o login ou signup com sessão, joga pro /app
  if ((isLoginPath || isSignupPath) && session) {
    window.location.href = '/app';
    return null;
  }

  if (isLoginPath) return <Login />;
  if (isSignupPath) return <Signup />;
  if (isMissionPath) return <Mission />;
  if (isReferralPath) return <SharedDevotional />;

  if (!isAppPath) {
    return <Landing />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home onExplore={() => setCurrentTab('explore')} />;
      case 'explore':
        return <Explore />;
      case 'favorites':
        return <Favorites />;
      case 'profile':
        return <Profile />;
      default:
        return <Home onExplore={() => setCurrentTab('explore')} />;
    }
  };

  return (
    <div className="app-container">
      <main className="content-area">
        {renderContent()}
      </main>
      <BottomNav currentTab={currentTab} setTab={setCurrentTab} />
    </div>
  );
}

export default App;

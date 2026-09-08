import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Favorites } from './pages/Favorites';
import { Profile } from './pages/Profile';
import { BottomNav } from './components/BottomNav';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { SharedDevotional } from './pages/SharedDevotional';
import { Mission } from './pages/Mission';
import { Contribute } from './pages/Contribute';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import { AnalyticsService } from './services/AnalyticsService';

const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(m => ({ default: m.AdminLayout })));

type Tab = 'home' | 'explore' | 'favorites' | 'profile';

const LoadingScreen = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    Carregando...
  </div>
);

// Guard: redirects to /login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// Guard: redirects authenticated users away from login/signup
function RequireGuest({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  const redirectTo = (location.state as any)?.from?.pathname || '/app';
  if (session) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

// The /app shell with bottom navigation and tab routing
function AppShell() {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const renderContent = () => {
    switch (currentTab) {
      case 'home':     return <Home onExplore={() => setCurrentTab('explore')} />;
      case 'explore':  return <Explore />;
      case 'favorites': return <Favorites />;
      case 'profile':  return <Profile />;
      default:         return <Home onExplore={() => setCurrentTab('explore')} />;
    }
  };

  return (
    <div className="app-container">
      <main className="content-area">{renderContent()}</main>
      <BottomNav currentTab={currentTab} setTab={setCurrentTab} />
    </div>
  );
}

// Referral tracking on /r/:code routes
function ReferralTracker() {
  const location = useLocation();
  useEffect(() => {
    const match = location.pathname.match(/^\/r\/([^/?]+)/);
    if (!match) return;
    const code = match[1];
    const searchParams = new URLSearchParams(location.search);
    const devotionalId = searchParams.get('d');
    if (code && devotionalId) {
      AnalyticsService.saveReferralContext(code, devotionalId);
      AnalyticsService.trackEvent('referral_click', { code, devotional_id: devotionalId });
    }
  }, [location]);
  return null;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <>
      <ReferralTracker />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/missao" element={<Mission />} />
        <Route path="/apoiar" element={<Contribute />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/termos" element={<Terms />} />
        <Route path="/r/:code" element={<SharedDevotional />} />

        <Route path="/login" element={<RequireGuest><Auth /></RequireGuest>} />
        <Route path="/signup" element={<Navigate to="/login" replace />} />

        <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>} />

        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <Suspense fallback={<LoadingScreen />}>
                <AdminLayout />
              </Suspense>
            </RequireAuth>
          }
        />

        {/* Catch-all: send unknown paths to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;

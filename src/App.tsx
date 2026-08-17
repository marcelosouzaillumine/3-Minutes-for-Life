import { useState } from 'react';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Favorites } from './pages/Favorites';
import { About } from './pages/About';
import { BottomNav } from './components/BottomNav';
import { Landing } from './pages/Landing';

type Tab = 'home' | 'explore' | 'favorites' | 'about';

function App() {
  const isAppPath = window.location.pathname === '/app';
  const [currentTab, setCurrentTab] = useState<Tab>('home');

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
      case 'about':
        return <About />;
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

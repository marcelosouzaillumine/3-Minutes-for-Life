import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { AdminService } from '../services/AdminService';
import { ConversationService } from '../services/ConversationService';
import { CommunicationInboxService } from '../services/CommunicationInboxService';
import { Sheet } from './Sheet';

type Tab = 'home' | 'explore' | 'plans' | 'family' | 'kids' | 'favorites' | 'profile';

interface BottomNavProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
}

export function BottomNav({ currentTab, setTab }: BottomNavProps) {
  const { t } = useTranslation(['common']);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [more, setMore] = useState(false);

  useEffect(() => {
    AdminService.checkAdminRole().then(setIsAdmin);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      ConversationService.getUnreadCount(),
      CommunicationInboxService.getUnreadCount(),
    ]).then(([replyCount, communicationCount]) => {
      if (active) setUnreadCount(replyCount + communicationCount);
    });
    return () => { active = false; };
  }, [currentTab]);

  return (
    <>
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${currentTab === 'home' ? 'active' : ''}`}
        onClick={() => setTab('home')}
      >
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        {t('today')}
      </button>

      <button 
        className={`nav-item ${currentTab === 'explore' ? 'active' : ''}`}
        onClick={() => setTab('explore')}
      >
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        {t('explore')}
      </button>

      <button
        className={`nav-item ${currentTab === 'plans' ? 'active' : ''}`}
        onClick={() => setTab('plans')}
      >
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        {t('plansNav', 'Planos')}
      </button>

      <button
        className={`nav-item ${currentTab === 'family' ? 'active' : ''}`}
        onClick={() => setTab('family')}
      >
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {t('familyNav', 'Grupo')}
      </button>

      <button
        className={`nav-item ${currentTab === 'kids' ? 'active' : ''}`}
        onClick={() => setTab('kids')}
      >
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t('kidsNav', 'Crianças')}
      </button>

      <button
        className={`nav-item ${currentTab === 'favorites' || currentTab === 'profile' || more ? 'active' : ''}`}
        aria-haspopup="dialog"
        onClick={() => setMore(true)}
      >
        <span className="nav-icon-wrap">
          <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
          </svg>
          {unreadCount > 0 && (
            <span className="nav-badge" aria-hidden="true">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        {t('moreNav', 'Mais')}
      </button>

    </nav>
      {more && (
        <Sheet title={t('moreNav', 'Mais')} onClose={() => setMore(false)}>
          <div className="more-list">
            <button type="button" className="more-row" onClick={() => { setMore(false); setTab('favorites'); }}>{t('savedNav')}</button>
            <button type="button" className="more-row" onClick={() => { setMore(false); setTab('profile'); }}>
              {t('moreProfile', 'Perfil e conta')}
              {unreadCount > 0 && <span className="more-row__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {isAdmin && <a className="more-row" href="/admin">Admin</a>}
          </div>
        </Sheet>
      )}
    </>
  );
}

import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { About } from './About';
import { TestimonialList } from '../components/TestimonialList';
import { LanguageSelector } from '../components/LanguageSelector';
import { ReflectionList } from '../components/ReflectionList';
import { useTranslation } from 'react-i18next';
import './Profile.css';

export function Profile() {
  const { t } = useTranslation(['profile', 'common']);
  const { user, signOut } = useAuth();
  const [showAbout, setShowAbout] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarUrl(imageUrl);
    }
  };

  if (showAbout) {
    return (
      <div className="profile-container about-page-view">
        <button className="back-btn" onClick={() => setShowAbout(false)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common:back')}
        </button>
        <div className="about-content">
          <About />
        </div>
      </div>
    );
  }

  if (showReflections) {
    return (
      <div className="profile-container about-page-view">
        <button className="back-btn" onClick={() => setShowReflections(false)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common:back')}
        </button>
        <div className="about-content" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Anotações Pessoais</h3>
          <ReflectionList />
        </div>
      </div>
    );
  }

  if (showTestimonials) {
    return (
      <div className="profile-container about-page-view">
        <button className="back-btn" onClick={() => setShowTestimonials(false)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common:back')}
        </button>
        <div className="about-content" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)' }}>Testemunhos</h3>
          <TestimonialList />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2 className="page-header">{t('title')}</h2>
      
      <div className="profile-hero">
        <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="avatar-edit-overlay">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>
        <div className="profile-details">
          <p className="profile-name">{user?.user_metadata?.full_name || 'Usuário'}</p>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="section-title">{t('settings')}</h3>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span>{t('dailyNotifications')}</span>
            </div>
            <div className="toggle-switch active"></div>
          </div>
          <div className="settings-item">
             <div className="settings-item-left">
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <span>{t('darkTheme')}</span>
            </div>
            <div className="toggle-switch"></div>
          </div>
          <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', paddingBottom: '1rem' }}>
             <div className="settings-item-left" style={{ width: '100%' }}>
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <span>{t('language')}</span>
            </div>
            <div style={{ paddingLeft: '2.5rem', width: '100%' }}>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="section-title">{t('yourStory')}</h3>
        
        <div className="settings-list" style={{ marginTop: '1rem' }}>
          <div className="settings-item clickable" onClick={() => setShowReflections(true)}>
            <div className="settings-item-left">
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span>Anotações Pessoais</span>
            </div>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20" className="chevron-icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="settings-item clickable" onClick={() => setShowTestimonials(true)}>
            <div className="settings-item-left">
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <span>Testemunhos</span>
            </div>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20" className="chevron-icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="section-title">{t('more')}</h3>
        <div className="settings-list">
          <div className="settings-item clickable" onClick={() => setShowAbout(true)}>
             <div className="settings-item-left">
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>{t('aboutApp')}</span>
            </div>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20" className="chevron-icon">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button onClick={signOut} className="logout-btn-premium">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

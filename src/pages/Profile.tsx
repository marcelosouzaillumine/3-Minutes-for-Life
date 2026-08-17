import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { About } from './About';
import './Profile.css';

export function Profile() {
  const { user, signOut } = useAuth();
  const [showAbout, setShowAbout] = useState(false);
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
          Voltar
        </button>
        <div className="about-content">
          <About />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2 className="page-header">Seu Perfil</h2>
      
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
        <h3 className="section-title">Configurações</h3>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-left">
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span>Notificações Diárias</span>
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
              <span>Tema Escuro</span>
            </div>
            <div className="toggle-switch"></div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <h3 className="section-title">Mais</h3>
        <div className="settings-list">
          <div className="settings-item clickable" onClick={() => setShowAbout(true)}>
             <div className="settings-item-left">
              <div className="settings-icon-bg">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>Sobre o App</span>
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
          Sair da Conta
        </button>
      </div>
    </div>
  );
}

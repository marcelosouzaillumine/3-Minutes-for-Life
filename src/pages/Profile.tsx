import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { illumineAuth } from '../lib/illumine';
import { uploadToStorage } from '../lib/storageUpload';
import { authService } from '../services/authService';
import { About } from './About';
import { TestimonialList } from '../components/TestimonialList';
import { LanguageSelector } from '../components/LanguageSelector';
import { ReflectionList } from '../components/ReflectionList';
import { MySubscriptions } from '../components/MySubscriptions';
import { useTranslation } from 'react-i18next';
import './Profile.css';
import { CommunicationPreferences } from '../components/CommunicationPreferences';
import { Conversations } from '../components/Conversations';
import { CommunicationInbox } from '../components/CommunicationInbox';
import { ConversationService } from '../services/ConversationService';
import { CommunicationInboxService } from '../services/CommunicationInboxService';
import { AdminService } from '../services/AdminService';
import { JourneySummaryCard } from '../components/JourneyStreak';
import { AccountData } from '../components/AccountData';

const ICONS = {
  notes: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  chat: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  language: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  bag: 'M17 9V7a4 4 0 00-8 0v2M5 9h14l-1 11H6L5 9z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

/** Linha de lista do perfil: ícone fino, rótulo e seta; com selo opcional (mensagens não lidas). */
function PfRow({ icon, label, onClick, badge = 0 }: { icon: string; label: string; onClick: () => void; badge?: number }) {
  return (
    <button type="button" className="pf-row" onClick={onClick}>
      <span className="pf-row__icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={icon} /></svg>
      </span>
      <span className="pf-row__label">{label}</span>
      {badge > 0 && <span className="pf-row__badge" aria-label={`${badge}`}>{badge > 9 ? '9+' : badge}</span>}
      <span className="pf-row__chev" aria-hidden="true">›</span>
    </button>
  );
}

export function Profile() {
  const { t } = useTranslation(['profile', 'common']);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reflete a foto salva no perfil (persistida no servidor) — sem isso, ela
  // só aparecia até o usuário sair/voltar, porque nada inicializava o estado
  // a partir de user.avatar.
  useEffect(() => {
    setAvatarUrl(user?.avatar || null);
  }, [user?.avatar]);

  async function copyAdminToken() {
    const token = illumineAuth.getAccessToken();
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  }

  useEffect(() => {
    AdminService.checkAdminRole().then(setIsAdmin);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      ConversationService.getUnreadCount(),
      CommunicationInboxService.getUnreadCount(),
    ]).then(([replyCount, communicationCount]) => {
      if (active) setUnreadMessageCount(replyCount + communicationCount);
    });
    return () => { active = false; };
  }, [user, showMessages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite selecionar o mesmo arquivo de novo depois de um erro
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError(t('profile:avatar.errorType', 'Selecione uma imagem.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError(t('profile:avatar.errorSize', 'A imagem deve ter até 5MB.'));
      return;
    }

    const previousAvatarUrl = avatarUrl;
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarUrl(localPreviewUrl); // feedback imediato enquanto envia
    setAvatarUploading(true);
    setAvatarError('');

    try {
      const publicUrl = await uploadToStorage(file, 'avatars');
      await authService.updateProfile({ avatar: publicUrl });
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      setAvatarUrl(previousAvatarUrl);
      setAvatarError(err?.message || t('profile:avatar.errorGeneric', 'Não foi possível salvar a foto. Tente novamente.'));
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
      setAvatarUploading(false);
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
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            {t('profile:myNotes', 'Anotações Pessoais')}
          </h3>
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
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            {t('profile:testimonials', 'Testemunhos')}
          </h3>
          <TestimonialList />
        </div>
      </div>
    );
  }

  if (showSubscriptions) {
    return (
      <div className="profile-container about-page-view">
        <button className="back-btn" onClick={() => setShowSubscriptions(false)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common:back')}
        </button>
        <div className="about-content" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            {t('profile:subscriptions.title')}
          </h3>
          <MySubscriptions />
        </div>
      </div>
    );
  }

  if (showMessages) {
    return (
      <div className="profile-container about-page-view">
        <button className="back-btn" onClick={() => setShowMessages(false)}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common:back')}
        </button>
        <div className="about-content" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)' }}>
            {t('profile:messages.sectionTitle', 'Suas mensagens')}
          </h3>
          <CommunicationInbox />
          <Conversations />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container pf">
      <h2 className="page-header pf-sr">{t('title')}</h2>

      <header className="pf-id">
        <button
          type="button"
          className="pf-avatar"
          onClick={() => !avatarUploading && fileInputRef.current?.click()}
          disabled={avatarUploading}
          aria-label={t('profile:avatar.change', 'Trocar foto')}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="pf-avatar__img" />
          ) : (
            <span className="pf-avatar__initial">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
          )}
          <span className="pf-avatar__edit" aria-hidden="true">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" disabled={avatarUploading} style={{ display: 'none' }} />
        </button>
        <div className="pf-id__text">
          <p className="pf-id__name">{user?.name || (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || t('profile:userFallback', 'Usuário')}</p>
          <p className="pf-id__email">{user?.email}</p>
          {avatarUploading && <p className="pf-id__note">{t('profile:avatar.uploading', 'Enviando foto...')}</p>}
          {avatarError && <p className="pf-id__note pf-id__note--error">{avatarError}</p>}
        </div>
      </header>

      <section className="pf-group">
        <h3 className="pf-title">{t('yourStory')}</h3>
        <JourneySummaryCard />
        <div className="pf-list">
          <PfRow icon={ICONS.notes} label={t('profile:myNotes', 'Anotações Pessoais')} onClick={() => setShowReflections(true)} />
          <PfRow icon={ICONS.chat} label={t('profile:testimonials', 'Testemunhos')} onClick={() => setShowTestimonials(true)} />
          <PfRow icon={ICONS.mail} label={t('profile:messages.viewAll', 'Ver mensagens')} badge={unreadMessageCount} onClick={() => setShowMessages(true)} />
        </div>
      </section>

      <section className="pf-group">
        <h3 className="pf-title">{t('settings')}</h3>
        <div className="pf-list">
          <div className="pf-row pf-row--static">
            <span className="pf-row__icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={ICONS.language} /></svg></span>
            <span className="pf-row__label">{t('language')}</span>
            <LanguageSelector />
          </div>
        </div>
        <CommunicationPreferences />
      </section>

      <section className="pf-group">
        <h3 className="pf-title">{t('more')}</h3>
        <div className="pf-list">
          <PfRow icon={ICONS.heart} label={t('profile:supportProject', 'Apoiar o projeto')} onClick={() => navigate('/apoiar')} />
          <PfRow icon={ICONS.bag} label={t('profile:mySubscriptions', 'Minha contribuição recorrente')} onClick={() => setShowSubscriptions(true)} />
          <PfRow icon={ICONS.info} label={t('aboutApp')} onClick={() => setShowAbout(true)} />
        </div>
      </section>

      <AccountData />

      <div className="pf-foot">
        {isAdmin && (
          <button type="button" onClick={copyAdminToken} className="pf-ghost">
            {tokenCopied ? 'Token copiado!' : 'Copiar token admin'}
          </button>
        )}
        <button type="button" onClick={signOut} className="pf-logout">{t('logout')}</button>
        <p className="pf-version">v{__APP_VERSION__}</p>
      </div>
    </div>
  );
}

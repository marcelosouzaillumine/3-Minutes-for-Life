import { useTranslation } from 'react-i18next';

interface RelationshipNavProps {
  activeTab: 'overview' | 'testimonials' | 'prayer_requests';
  onTabChange?: (tab: 'overview' | 'testimonials' | 'prayer_requests') => void;
}

export function RelationshipNav({ activeTab, onTabChange }: RelationshipNavProps) {
  const { t } = useTranslation(['common']);

  const handleNavigate = (path: string, tab: 'overview' | 'testimonials' | 'prayer_requests') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      borderBottom: '1px solid var(--color-border)',
      marginBottom: '24px',
      paddingBottom: '4px',
      overflowX: 'auto',
    }}>
      <button
        onClick={() => handleNavigate('/admin/relationship', 'overview')}
        style={{
          padding: '8px 16px',
          background: 'none',
          border: 'none',
          borderBottom: activeTab === 'overview' ? '2px solid var(--color-accent)' : '2px solid transparent',
          color: activeTab === 'overview' ? 'var(--color-accent)' : 'var(--color-text-light)',
          fontWeight: activeTab === 'overview' ? 600 : 400,
          cursor: 'pointer',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        {t('admin.relationship.tabs.overview', 'Visão Geral')}
      </button>

      <button
        onClick={() => handleNavigate('/admin/relationship/testimonials', 'testimonials')}
        style={{
          padding: '8px 16px',
          background: 'none',
          border: 'none',
          borderBottom: activeTab === 'testimonials' ? '2px solid var(--color-accent)' : '2px solid transparent',
          color: activeTab === 'testimonials' ? 'var(--color-accent)' : 'var(--color-text-light)',
          fontWeight: activeTab === 'testimonials' ? 600 : 400,
          cursor: 'pointer',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {t('admin.relationship.tabs.testimonials', 'Testemunhos')}
      </button>

      <button
        onClick={() => handleNavigate('/admin/relationship/prayer-requests', 'prayer_requests')}
        style={{
          padding: '8px 16px',
          background: 'none',
          border: 'none',
          borderBottom: activeTab === 'prayer_requests' ? '2px solid var(--color-accent)' : '2px solid transparent',
          color: activeTab === 'prayer_requests' ? 'var(--color-accent)' : 'var(--color-text-light)',
          fontWeight: activeTab === 'prayer_requests' ? 600 : 400,
          cursor: 'pointer',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap'
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {t('admin.relationship.tabs.prayerRequests', 'Pedidos de Oração')}
      </button>
    </div>
  );
}

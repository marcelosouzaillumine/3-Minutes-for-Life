import { useTranslation } from 'react-i18next';

export function About() {
  const { t } = useTranslation('mission');
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500 }}>{t('about.title1')}</h2>
      
      <p className="about-text">
        {t('about.p1')}
      </p>
      
      <p className="about-text">
        {t('about.p2')}
      </p>

      <p className="about-text">
        {t('about.p3')}
      </p>

      <p className="about-text">
        {t('about.p4')}
      </p>

      <h2 style={{ marginBottom: '1.5rem', fontWeight: 500, marginTop: '2.5rem' }}>{t('about.title2')}</h2>

      <p className="about-text">
        {t('about.p5')}
      </p>

      <p className="about-text" style={{ fontSize: '0.9rem', marginTop: '2rem' }}>
        {t('about.p6')}
      </p>
    </div>
  );
}

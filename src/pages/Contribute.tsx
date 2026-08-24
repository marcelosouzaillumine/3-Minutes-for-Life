import { useTranslation } from 'react-i18next';
import './Mission.css';
import { BrandLogo } from '../components/BrandLogo';

/**
 * Página de contribuição/apoio.
 *
 * Substitui o antigo modal (ContributionModal) que abria por cima da página
 * de missão: agora "Fazer parte da missão" leva direto para esta página
 * dedicada, onde a pessoa escolhe o valor e é redirecionada para o checkout
 * correspondente no Asaas.
 */

type CheckoutOption = {
  key: string;
  url: string;
};

// Links de checkout do Asaas por opção.
const ASAAS_LINKS: Record<string, string> = {
  apoio_mensal: 'https://www.asaas.com/c/ubvo22er3ta93gsu',
  apoio_anual: 'https://www.asaas.com/c/zc0gqi05xcw920e1',
  livre_unica: 'https://www.asaas.com/c/ej6xz049gg63f7qi',
  livre_mensal: 'https://www.asaas.com/c/hju0fp9mzkw9t5g2',
};

export function Contribute() {
  const { t } = useTranslation(['mission', 'contribution']);

  const goToCheckout = (option: CheckoutOption) => {
    if (!option.url) {
      alert(t('contribution:modal.errorNoLink'));
      return;
    }
    window.location.href = option.url;
  };

  return (
    <div className="mission-page">

      {/* ==================================================
          HEADER
      =================================================== */}

      <header className="landing-header">
        <a
          href="/missao"
          className="landing-logo"
          aria-label="3 Minutes for Life"
        >
          <BrandLogo
            variant="light"
            alt="3 Minutes for Life"
            className="landing-logo-img"
            style={{
              height: '90px',
              width: 'auto',
              maxHeight: '90px',
              maxWidth: '220px',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </a>

        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="/missao">
            {t('mission:footer.navMission', 'Nossa Missão')}
          </a>
        </nav>
      </header>

      {/* ==================================================
          CONTEÚDO
      =================================================== */}

      <section
        className="mission-editorial-pricing"
        style={{ paddingTop: '3rem' }}
      >
        <h2>{t('contribution:modal.title', 'Fazer parte da missão')}</h2>

        <p
          style={{
            textAlign: 'center',
            maxWidth: '520px',
            margin: '0 auto 3rem',
            color: 'var(--landing-text-light, #6A6765)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
          }}
        >
          {t(
            'contribution:modal.desc',
            'O 3 Minutos para a Vida é gratuito. Sua contribuição ajuda outra pessoa a receber também.'
          )}
        </p>

        <div className="editorial-tiers simplified-tiers">

          <div className="editorial-tier">
            <h3 className="editorial-tier-name">
              {t('mission:editorial.monthlyTitle', 'Apoio mensal')}
            </h3>

            <div className="editorial-tier-price">
              <span className="editorial-price-main">
                {t('mission:editorial.monthlyPriceMain', 'R$ 9,90')}
                <small>{t('mission:editorial.monthlyPriceUnit', '/mês')}</small>
              </span>
              <span className="editorial-price-sub">
                {t(
                  'mission:editorial.monthlyDesc',
                  'Uma pequena contribuição recorrente para sustentar a missão.'
                )}
              </span>
            </div>

            <button
              type="button"
              className="editorial-btn"
              onClick={() =>
                goToCheckout({ key: 'apoio_mensal', url: ASAAS_LINKS.apoio_mensal })
              }
            >
              {t('mission:editorial.monthlyBtn', 'Apoiar mensalmente')}
            </button>
          </div>

          <div className="editorial-tier highlight-tier">
            <div className="editorial-tier-badge">
              {t('mission:editorial.yearlyBadge', 'Mais econômica')}
            </div>

            <h3 className="editorial-tier-name">
              {t('mission:editorial.yearlyTitle', 'Apoio anual')}
            </h3>

            <div className="editorial-tier-price">
              <span className="editorial-price-main">
                {t('mission:editorial.yearlyPriceMain', 'R$ 59,90')}
                <small>{t('mission:editorial.yearlyPriceUnit', '/ano')}</small>
              </span>
              <span className="editorial-price-sub">
                {t(
                  'mission:editorial.yearlyDesc',
                  'A forma mais econômica de apoiar continuamente o projeto.'
                )}
              </span>
            </div>

            <button
              type="button"
              className="editorial-btn primary"
              onClick={() =>
                goToCheckout({ key: 'apoio_anual', url: ASAAS_LINKS.apoio_anual })
              }
            >
              {t('mission:editorial.yearlyBtn', 'Apoiar anualmente')}
            </button>
          </div>

        </div>

        <div className="editorial-free">
          <h3>{t('mission:editorial.freeTitle', 'Contribuição voluntária')}</h3>
          <p>
            {t(
              'mission:editorial.freeDesc',
              'Quer contribuir com outro valor? Você escolhe quanto e como contribuir.'
            )}
          </p>

          <div className="editorial-free-actions">
            <button
              type="button"
              className="btn-text"
              onClick={() =>
                goToCheckout({ key: 'livre_unica', url: ASAAS_LINKS.livre_unica })
              }
            >
              {t('mission:editorial.freeBtnSingle', 'Contribuição única')}
            </button>

            <span className="editorial-divider" />

            <button
              type="button"
              className="btn-text"
              onClick={() =>
                goToCheckout({ key: 'livre_mensal', url: ASAAS_LINKS.livre_mensal })
              }
            >
              {t('mission:editorial.freeBtnMonthly', 'Contribuição mensal')}
            </button>
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '3rem',
            fontSize: '0.85rem',
            color: 'var(--landing-text-light, #6A6765)',
          }}
        >
          {t(
            'contribution:modal.footer',
            'Ambiente seguro. Você poderá cancelar sua contribuição mensal a qualquer momento.'
          )}
        </p>
      </section>

    </div>
  );
}

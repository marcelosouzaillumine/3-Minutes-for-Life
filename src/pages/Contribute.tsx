import { useState } from 'react';
import { useTranslation } from 'react-i18next';
/* Usa header/nav/logo da Landing além dos cards da Mission. */
import './Landing.css';
import './Mission.css';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { MissionService } from '../services/MissionService';

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

function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

// Links de checkout do Asaas por opção. "livre_unica" agora é atendida por
// um checkout dinâmico (ver handleOneTimeSubmit) — o link estático fica só
// como fallback caso o checkout dinâmico falhe.
const ASAAS_LINKS: Record<string, string> = {
  apoio_mensal: 'https://www.asaas.com/c/ubvo22er3ta93gsu',
  apoio_anual: 'https://www.asaas.com/c/zc0gqi05xcw920e1',
  livre_unica: 'https://www.asaas.com/c/ej6xz049gg63f7qi',
  livre_mensal: 'https://www.asaas.com/c/hju0fp9mzkw9t5g2',
};

export function Contribute() {
  const { t } = useTranslation(['mission', 'contribution', 'common']);
  const { user } = useAuth();

  const [showOneTimeForm, setShowOneTimeForm] = useState(false);
  const [amountReais, setAmountReais] = useState('20');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const goToCheckout = (option: CheckoutOption) => {
    if (!option.url) {
      alert(t('contribution:modal.errorNoLink'));
      return;
    }
    window.location.href = option.url;
  };

  const handleOneTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amountCents = Math.round(Number(amountReais.replace(',', '.')) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 500) {
      setFormError(t('contribution:oneTime.errorMinAmount', 'O valor mínimo é R$ 5,00.'));
      return;
    }
    if (onlyDigits(cpfCnpj).length !== 11 && onlyDigits(cpfCnpj).length !== 14) {
      setFormError(t('contribution:oneTime.errorCpf', 'Informe um CPF ou CNPJ válido.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { checkoutUrl } = await MissionService.createOneTimePixCheckout(amountCents, cpfCnpj);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setFormError(err.message || t('contribution:oneTime.errorGeneric', 'Não foi possível criar o checkout. Tente novamente.'));
      setIsSubmitting(false);
    }
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

        <div className="editorial-tiers three-tiers">

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

          <div className="editorial-tier">
            <h3 className="editorial-tier-name">
              {t('mission:editorial.freeTitle', 'Contribuição voluntária')}
            </h3>

            <div className="editorial-tier-price">
              <span className="editorial-price-sub">
                {t(
                  'mission:editorial.freeDesc',
                  'Quer contribuir com outro valor? Você escolhe quanto e como contribuir.'
                )}
              </span>
            </div>

            {!showOneTimeForm ? (
              <div className="editorial-tier-free-options">
                <button
                  type="button"
                  className="editorial-btn"
                  onClick={() => setShowOneTimeForm(true)}
                >
                  {t('mission:editorial.freeBtnSingle', 'Contribuição única')}
                </button>

                <button
                  type="button"
                  className="editorial-btn"
                  onClick={() =>
                    goToCheckout({ key: 'livre_mensal', url: ASAAS_LINKS.livre_mensal })
                  }
                >
                  {t('mission:editorial.freeBtnMonthly', 'Contribuição mensal')}
                </button>
              </div>
            ) : !user ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--landing-text-light, #6A6765)', marginBottom: '1rem' }}>
                  {t('contribution:oneTime.needsLogin', 'Entre ou crie sua conta para fazer uma contribuição única — assim conseguimos vincular o pagamento a você.')}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a className="editorial-btn" href="/login?redirectTo=/apoiar">
                    {t('contribution:oneTime.login', 'Entrar')}
                  </a>
                  <a className="editorial-btn primary" href="/signup?redirectTo=/apoiar">
                    {t('contribution:oneTime.signup', 'Criar conta')}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOneTimeForm(false)}
                  style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--landing-text-light, #6A6765)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {t('common:back', 'Voltar')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleOneTimeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {t('contribution:oneTime.amountLabel', 'Valor (R$)')}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountReais}
                    onChange={e => setAmountReais(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--landing-border, #ddd)', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </label>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {t('contribution:oneTime.cpfLabel', 'CPF ou CNPJ')}
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={e => setCpfCnpj(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--landing-border, #ddd)', fontSize: '1rem', boxSizing: 'border-box' }}
                  />
                </label>
                {formError && (
                  <p style={{ color: '#c0392b', fontSize: '0.82rem', margin: 0 }}>{formError}</p>
                )}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button type="submit" className="editorial-btn primary" disabled={isSubmitting} style={{ flex: 1 }}>
                    {isSubmitting
                      ? t('contribution:oneTime.submitting', 'Gerando cobrança…')
                      : t('contribution:oneTime.submit', 'Gerar PIX')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowOneTimeForm(false); setFormError(''); }}
                    disabled={isSubmitting}
                    className="editorial-btn"
                  >
                    {t('common:cancel', 'Cancelar')}
                  </button>
                </div>
              </form>
            )}
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

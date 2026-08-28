import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
/* Usa header/nav/logo da Landing além dos cards da Mission. */
import './Landing.css';
import './Mission.css';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { MissionService } from '../services/MissionService';

type ContributionPlan = {
  key: string;
  title: string;
  defaultAmount: string;
  frequency: 'one_time' | 'monthly' | 'yearly';
  isFixedAmount?: boolean;
};

function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

// Plano padrão para cada combinação tier+periodicity (vinda do /missao via query string)
const PLAN_MAP: Record<string, ContributionPlan> = {
  apoio_mensal: { key: 'apoio_mensal', title: 'Apoio Mensal', defaultAmount: '9.90', frequency: 'monthly', isFixedAmount: true },
  apoio_anual:  { key: 'apoio_anual',  title: 'Apoio Anual',  defaultAmount: '59.90', frequency: 'yearly',  isFixedAmount: true },
  livre_unica:  { key: 'livre_unica',  title: 'Contribuição Única', defaultAmount: '20.00', frequency: 'one_time', isFixedAmount: false },
  livre_mensal: { key: 'livre_mensal', title: 'Contribuição Mensal', defaultAmount: '20.00', frequency: 'monthly', isFixedAmount: false },
};

export function Contribute() {
  const { t } = useTranslation(['mission', 'contribution', 'common']);
  const { user } = useAuth();

  const [activePlan, setActivePlan] = useState<ContributionPlan | null>(null);
  const [amountReais, setAmountReais] = useState('20');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Abre automaticamente o modal quando vindo do /missao com ?tier=&periodicity=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier');
    const periodicity = params.get('periodicity');
    if (tier && periodicity) {
      const plan = PLAN_MAP[`${tier}_${periodicity}`];
      if (plan) {
        setAmountReais(plan.defaultAmount);
        setActivePlan(plan);
      }
    }
  }, []);

  const openCheckout = (plan: ContributionPlan) => {
    setFormError('');
    setPaymentMethod('pix');
    setAmountReais(plan.defaultAmount);
    setActivePlan(plan);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activePlan) return;

    const amountCents = Math.round(Number(amountReais.replace(',', '.')) * 100);
    const minAmount = activePlan.frequency === 'yearly' ? 5000 : 500;
    const minText = activePlan.frequency === 'yearly' ? 'R$ 50,00' : 'R$ 5,00';

    if (!Number.isFinite(amountCents) || amountCents < minAmount) {
      setFormError(t('contribution:oneTime.errorMinAmount', `O valor mínimo é ${minText}.`));
      return;
    }

    const cleanCpfCnpj = onlyDigits(cpfCnpj);
    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      setFormError(t('contribution:oneTime.errorCpf', 'Informe um CPF ou CNPJ válido.'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { checkoutUrl } = await MissionService.createCheckout(
        amountCents,
        cleanCpfCnpj,
        activePlan.frequency,
        paymentMethod
      );
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

          {/* Plano Mensal */}
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
                openCheckout({
                  key: 'apoio_mensal',
                  title: t('mission:editorial.monthlyTitle', 'Apoio Mensal'),
                  defaultAmount: '9.90',
                  frequency: 'monthly',
                  isFixedAmount: true,
                })
              }
            >
              {t('mission:editorial.monthlyBtn', 'Apoiar mensalmente')}
            </button>
          </div>

          {/* Plano Anual */}
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
                openCheckout({
                  key: 'apoio_anual',
                  title: t('mission:editorial.yearlyTitle', 'Apoio Anual'),
                  defaultAmount: '59.90',
                  frequency: 'yearly',
                  isFixedAmount: true,
                })
              }
            >
              {t('mission:editorial.yearlyBtn', 'Apoiar anualmente')}
            </button>
          </div>

          {/* Contribuição Voluntária Livre */}
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

            <div className="editorial-tier-free-options">
              <button
                type="button"
                className="editorial-btn"
                onClick={() =>
                  openCheckout({
                    key: 'livre_unica',
                    title: t('mission:editorial.freeBtnSingle', 'Contribuição Única'),
                    defaultAmount: '20.00',
                    frequency: 'one_time',
                    isFixedAmount: false,
                  })
                }
              >
                {t('mission:editorial.freeBtnSingle', 'Contribuição única')}
              </button>

              <button
                type="button"
                className="editorial-btn"
                onClick={() =>
                  openCheckout({
                    key: 'livre_mensal',
                    title: t('mission:editorial.freeBtnMonthly', 'Contribuição Mensal'),
                    defaultAmount: '20.00',
                    frequency: 'monthly',
                    isFixedAmount: false,
                  })
                }
              >
                {t('mission:editorial.freeBtnMonthly', 'Contribuição mensal')}
              </button>
            </div>
          </div>

        </div>

        {/* Modal / Formulário de Checkout Dinâmico */}
        {activePlan && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}>
              <button
                type="button"
                onClick={() => { setActivePlan(null); setFormError(''); }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#666',
                }}
                aria-label="Fechar"
              >
                ✕
              </button>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1a1a1a' }}>
                {activePlan.title}
              </h3>

              {/* Payment method selector */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.5rem',
                    borderRadius: '8px',
                    border: `2px solid ${paymentMethod === 'pix' ? '#2563eb' : '#ddd'}`,
                    background: paymentMethod === 'pix' ? '#eff6ff' : '#fafafa',
                    color: paymentMethod === 'pix' ? '#1d4ed8' : '#555',
                    fontWeight: paymentMethod === 'pix' ? 700 : 400,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  🟢 PIX
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.5rem',
                    borderRadius: '8px',
                    border: `2px solid ${paymentMethod === 'credit_card' ? '#2563eb' : '#ddd'}`,
                    background: paymentMethod === 'credit_card' ? '#eff6ff' : '#fafafa',
                    color: paymentMethod === 'credit_card' ? '#1d4ed8' : '#555',
                    fontWeight: paymentMethod === 'credit_card' ? 700 : 400,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  💳 Cartão
                </button>
              </div>

              {!user ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '1.25rem' }}>
                    {t('contribution:oneTime.needsLogin', 'Entre ou crie sua conta para vincular seu apoio ao seu perfil.')}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <a className="editorial-btn" href="/login?redirectTo=/apoiar" style={{ flex: 1 }}>
                      {t('contribution:oneTime.login', 'Entrar')}
                    </a>
                    <a className="editorial-btn primary" href="/signup?redirectTo=/apoiar" style={{ flex: 1 }}>
                      {t('contribution:oneTime.signup', 'Criar conta')}
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>
                    {t('contribution:oneTime.amountLabel', 'Valor (R$)')}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountReais}
                      onChange={e => setAmountReais(e.target.value)}
                      disabled={activePlan.isFixedAmount}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '0.4rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        fontSize: '1.1rem',
                        boxSizing: 'border-box',
                        backgroundColor: activePlan.isFixedAmount ? '#f5f5f5' : '#fff',
                      }}
                      required
                    />
                  </label>

                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>
                    {t('contribution:oneTime.cpfLabel', 'CPF ou CNPJ')}
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={cpfCnpj}
                      onChange={e => setCpfCnpj(e.target.value)}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '0.4rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                    <span style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.25rem', display: 'block' }}>
                      Exigido pelo Banco Central para emissão do pagamento.
                    </span>
                  </label>

                  {formError && (
                    <div style={{
                      backgroundColor: '#fde8e8',
                      color: '#c0392b',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                    }}>
                      {formError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setActivePlan(null); setFormError(''); }}
                      disabled={isSubmitting}
                      className="editorial-btn"
                      style={{ flex: 1 }}
                    >
                      {t('common:cancel', 'Cancelar')}
                    </button>
                    <button
                      type="submit"
                      className="editorial-btn primary"
                      disabled={isSubmitting}
                      style={{ flex: 2 }}
                    >
                      {isSubmitting
                        ? (paymentMethod === 'credit_card' ? 'Criando link de pagamento…' : 'Gerando PIX…')
                        : (paymentMethod === 'credit_card' ? 'Pagar com Cartão' : 'Pagar com PIX')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

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

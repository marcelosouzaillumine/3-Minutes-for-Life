import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
/* Usa header/nav/logo da Landing além dos cards da Mission. */
import './Landing.css';
import './Mission.css';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { MissionService } from '../services/MissionService';
import { fetchBrlToUsdRate, FALLBACK_BRL_TO_USD_RATE, formatUsdFromBrl } from '../hooks/useBrlToUsdRate';

type ContributionPlan = {
  key: string;
  title: string;
  defaultAmount: string;
  frequency: 'one_time' | 'monthly' | 'yearly';
  isFixedAmount?: boolean;
};

// Fusos horários do Brasil (IANA) — usado só como sugestão inicial de
// método de pagamento; o doador sempre pode trocar manualmente. Nenhuma
// chamada de rede, só o fuso que o próprio navegador já expõe.
const BRAZIL_TIMEZONES = new Set([
  'America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Recife',
  'America/Araguaina', 'America/Maceio', 'America/Belem', 'America/Santarem',
  'America/Manaus', 'America/Boa_Vista', 'America/Porto_Velho', 'America/Cuiaba',
  'America/Campo_Grande', 'America/Rio_Branco', 'America/Eirunepe', 'America/Noronha',
]);

function detectLikelyBrazil(): boolean {
  try {
    return BRAZIL_TIMEZONES.has(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return true; // sem suporte a Intl.DateTimeFormat: mantém o comportamento anterior (Pix por padrão)
  }
}

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
  const { t, i18n } = useTranslation(['mission', 'contribution', 'common']);
  const { user } = useAuth();
  const isPortuguese = i18n.language?.toLowerCase().startsWith('pt');

  const [activePlan, setActivePlan] = useState<ContributionPlan | null>(null);
  const [amountReais, setAmountReais] = useState('20');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'international'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [usdRate, setUsdRate] = useState<number | null>(null);

  // Busca a taxa de câmbio uma vez ao montar, só para "aquecer" o cache —
  // se o doador trocar de método de pagamento antes disso terminar, o
  // handler abaixo busca de novo (aguardando) em vez de usar um valor stale.
  useEffect(() => {
    fetchBrlToUsdRate().then(setUsdRate);
  }, []);

  // Troca de método de pagamento com conversão de moeda: os planos são
  // definidos em R$, então ao entrar em "International" o valor precisa virar
  // USD de verdade (não repetir o mesmo número), e ao sair precisa voltar a
  // ser R$. Feito de forma imperativa (não como efeito reativo) para não ter
  // condição de corrida com a busca assíncrona da taxa.
  const handleSelectPaymentMethod = async (method: 'pix' | 'credit_card' | 'international') => {
    if (!activePlan || method === paymentMethod) {
      setPaymentMethod(method);
      return;
    }

    const enteringInternational = method === 'international';
    const leavingInternational = paymentMethod === 'international';

    if (enteringInternational) {
      const rate = usdRate ?? await fetchBrlToUsdRate();
      if (usdRate === null) setUsdRate(rate);
      const baseBrl = activePlan.isFixedAmount ? Number(activePlan.defaultAmount) : Number(amountReais.replace(',', '.'));
      if (Number.isFinite(baseBrl)) setAmountReais((baseBrl * rate).toFixed(2));
    } else if (leavingInternational) {
      if (activePlan.isFixedAmount) {
        setAmountReais(activePlan.defaultAmount);
      } else {
        const rate = usdRate ?? FALLBACK_BRL_TO_USD_RATE;
        const baseUsd = Number(amountReais.replace(',', '.'));
        if (Number.isFinite(baseUsd)) setAmountReais((baseUsd / rate).toFixed(2));
      }
    }

    setPaymentMethod(method);
  };

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

  const openCheckout = async (plan: ContributionPlan) => {
    setFormError('');
    setActivePlan(plan);

    if (detectLikelyBrazil()) {
      setPaymentMethod('pix');
      setAmountReais(plan.defaultAmount);
      return;
    }

    // Sugestão inicial "International" pra quem parece estar fora do Brasil
    // — já entra com o valor convertido pra USD (mesma conversão usada na
    // troca manual de método), não com o número em R$ como se fosse dólar.
    setPaymentMethod('international');
    const rate = usdRate ?? await fetchBrlToUsdRate();
    if (usdRate === null) setUsdRate(rate);
    const baseBrl = Number(plan.defaultAmount);
    setAmountReais(Number.isFinite(baseBrl) ? (baseBrl * rate).toFixed(2) : plan.defaultAmount);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activePlan) return;

    const amountCents = Math.round(Number(amountReais.replace(',', '.')) * 100);
    const minAmount = activePlan.frequency === 'yearly' ? 5000 : 500;
    const minText = paymentMethod === 'international'
      ? (activePlan.frequency === 'yearly' ? '$50.00' : '$5.00')
      : (activePlan.frequency === 'yearly' ? 'R$ 50,00' : 'R$ 5,00');

    if (!Number.isFinite(amountCents) || amountCents < minAmount) {
      setFormError(t('contribution:oneTime.errorMinAmount', `O valor mínimo é ${minText}.`));
      return;
    }

    setIsSubmitting(true);
    try {
      if (paymentMethod === 'international') {
        const { checkoutUrl } = await MissionService.createInternationalCheckout(amountCents, activePlan.frequency);
        window.location.href = checkoutUrl;
        return;
      }

      const cleanCpfCnpj = onlyDigits(cpfCnpj);
      if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
        setFormError(t('contribution:oneTime.errorCpf', 'Informe um CPF ou CNPJ válido.'));
        setIsSubmitting(false);
        return;
      }

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
                {isPortuguese
                  ? t('mission:editorial.monthlyPriceMain', 'R$ 9,90')
                  : (formatUsdFromBrl(9.90, usdRate) ?? '…')}
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
                {isPortuguese
                  ? t('mission:editorial.yearlyPriceMain', 'R$ 59,90')
                  : (formatUsdFromBrl(59.90, usdRate) ?? '…')}
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
                  onClick={() => handleSelectPaymentMethod('pix')}
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
                  onClick={() => handleSelectPaymentMethod('credit_card')}
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
                <button
                  type="button"
                  onClick={() => handleSelectPaymentMethod('international')}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.5rem',
                    borderRadius: '8px',
                    border: `2px solid ${paymentMethod === 'international' ? '#2563eb' : '#ddd'}`,
                    background: paymentMethod === 'international' ? '#eff6ff' : '#fafafa',
                    color: paymentMethod === 'international' ? '#1d4ed8' : '#555',
                    fontWeight: paymentMethod === 'international' ? 700 : 400,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  🌎 International
                </button>
              </div>

              {!user ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '1.25rem' }}>
                    {t('contribution:oneTime.needsLogin', 'Entre ou crie sua conta para vincular seu apoio ao seu perfil.')}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <a className="editorial-btn primary" href="/login?redirectTo=/apoiar" style={{ flex: 1 }}>
                      {t('contribution:oneTime.login', 'Entrar ou criar conta')}
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#333' }}>
                    {paymentMethod === 'international'
                      ? t('contribution:oneTime.amountLabelUsd', 'Amount (USD)')
                      : t('contribution:oneTime.amountLabel', 'Valor (R$)')}
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

                  {paymentMethod !== 'international' && (
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
                  )}

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
                        ? (paymentMethod === 'credit_card' ? 'Criando link de pagamento…'
                          : paymentMethod === 'international' ? 'Creating checkout…'
                          : 'Gerando PIX…')
                        : (paymentMethod === 'credit_card' ? 'Pagar com Cartão'
                          : paymentMethod === 'international' ? 'Continue to payment'
                          : 'Pagar com PIX')}
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

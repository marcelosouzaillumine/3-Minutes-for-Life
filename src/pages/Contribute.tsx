import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
/* Usa header/nav/logo da Landing além dos cards da Mission. */
import './Landing.css';
import './Mission.css';
import { BrandLogo } from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { MissionService } from '../services/MissionService';
import { fetchBrlToUsdRate, formatUsdFromBrl } from '../hooks/useBrlToUsdRate';

type ContributionPlan = {
  key: string;
  amountCents: number;
  frequency: 'one_time' | 'monthly' | 'yearly';
};

// Planos recorrentes de valor fixo; ?tier=&periodicity= (vindo do /missao) escolhe um deles.
// O apoio único tem valor livre (digitado), com o mínimo aceito pelo Asaas.
const MIN_ONE_TIME_CENTS = 500;
const PLAN_MAP: Record<string, ContributionPlan> = {
  apoio_mensal: { key: 'apoio_mensal', amountCents: 1990, frequency: 'monthly' },
  apoio_anual: { key: 'apoio_anual', amountCents: 9900, frequency: 'yearly' },
};

export function Contribute() {
  const { t, i18n } = useTranslation(['mission', 'contribution', 'common']);
  const { user, loading } = useAuth();
  const isPortuguese = i18n.language?.toLowerCase().startsWith('pt');

  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [customAmount, setCustomAmount] = useState(() => new URLSearchParams(window.location.search).get('amount') ?? '');
  const [usdRate, setUsdRate] = useState<number | null>(null);
  // Volta da página de pagamento do OS (?status=paid&session=…&ref=…).
  const [paidReturn] = useState(() => new URLSearchParams(window.location.search).get('status') === 'paid');

  // Taxa de câmbio só para mostrar o preço em USD a quem usa o site em outro idioma.
  useEffect(() => {
    fetchBrlToUsdRate().then(setUsdRate);
  }, []);

  // Aceita "25", "25,50" ou "25.50"; devolve centavos ou null se inválido.
  const parseAmountCents = (raw: string): number | null => {
    const n = Number(raw.replace(/[^\d,.]/g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  };

  const startOneTime = () => {
    const cents = parseAmountCents(customAmount);
    if (cents === null || cents < MIN_ONE_TIME_CENTS) {
      setFormError(t('contribution:oneTime.amountMin', 'Informe um valor de pelo menos R$ 5,00.'));
      return;
    }
    void startCheckout({ key: 'apoio_unico', amountCents: cents, frequency: 'one_time' });
  };

  // Vai direto para a página de pagamento (o CPF/CNPJ é pedido lá). Sem login, entra e volta já no plano escolhido.
  const startCheckout = async (plan: ContributionPlan) => {
    if (pendingKey) return;
    setFormError('');
    if (!user) {
      const back = `/apoiar?tier=${plan.key.split('_')[0]}&periodicity=${plan.key.split('_')[1]}`
        + (plan.frequency === 'one_time' ? `&amount=${plan.amountCents / 100}` : '');
      window.location.href = `/login?redirectTo=${encodeURIComponent(back)}`;
      return;
    }
    setPendingKey(plan.key);
    try {
      const { checkoutUrl } = await MissionService.createCheckout(plan.amountCents, plan.frequency);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setFormError(err.message || t('contribution:oneTime.errorGeneric', 'Não foi possível criar o checkout. Tente novamente.'));
      setPendingKey(null);
    }
  };

  // Volta do login (ou link do /missao) com ?tier=&periodicity=: segue direto para o pagamento.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (loading || !user || autoStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier');
    const periodicity = params.get('periodicity');
    let plan: ContributionPlan | undefined = tier && periodicity ? PLAN_MAP[`${tier}_${periodicity}`] : undefined;
    if (!plan && periodicity === 'unico') {
      const cents = parseAmountCents(params.get('amount') ?? '');
      if (cents !== null && cents >= MIN_ONE_TIME_CENTS) plan = { key: 'apoio_unico', amountCents: cents, frequency: 'one_time' };
    }
    if (plan) {
      autoStarted.current = true;
      void startCheckout(plan);
    }
  }, [loading, user]);

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

      {paidReturn && (
        <div role="status" style={{ maxWidth: 720, margin: '1rem auto 0', padding: '0.9rem 1.1rem', borderRadius: 10, background: '#ecfdf5', color: '#065f46', fontWeight: 600, textAlign: 'center' }}>
          {t('contribution:paidReturn', 'Pagamento recebido. Obrigado por apoiar a missão!')}
        </div>
      )}

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
            'O 3 Minutos para a Vida é gratuito. Sua contribuição ajuda essa mensagem a chegar a mais pessoas.'
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
                  ? t('mission:editorial.monthlyPriceMain', 'R$ 19,90')
                  : (formatUsdFromBrl(19.90, usdRate) ?? '…')}
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
              style={{ minHeight: 78, marginTop: 'auto' }}
              disabled={!!pendingKey}
              onClick={() => startCheckout(PLAN_MAP.apoio_mensal)}
            >
              {pendingKey === 'apoio_mensal' ? t('contribution:oneTime.submitting', 'Abrindo o pagamento…') : t('mission:editorial.monthlyBtn', 'Apoiar mensalmente')}
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
                  ? t('mission:editorial.yearlyPriceMain', 'R$ 99,00')
                  : (formatUsdFromBrl(99.00, usdRate) ?? '…')}
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
              style={{ minHeight: 78, marginTop: 'auto' }}
              disabled={!!pendingKey}
              onClick={() => startCheckout(PLAN_MAP.apoio_anual)}
            >
              {pendingKey === 'apoio_anual' ? t('contribution:oneTime.submitting', 'Abrindo o pagamento…') : t('mission:editorial.yearlyBtn', 'Apoiar anualmente')}
            </button>
          </div>

          {/* Apoio único (sem recorrência) */}
          <div className="editorial-tier">
            <h3 className="editorial-tier-name">
              {t('mission:editorial.singleTitle', 'Apoio único')}
            </h3>

            <div className="editorial-tier-price">
              <span className="editorial-price-main">
                {t('mission:editorial.singlePriceMain', 'Valor livre')}
                <small>{t('mission:editorial.singlePriceUnit', ' único')}</small>
              </span>
              <span className="editorial-price-sub">
                {t('mission:editorial.singleDesc', 'Um único pagamento, sem renovação automática.')}
              </span>
            </div>

            <div style={{ marginTop: 'auto', marginBottom: '1.25rem', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                {[20, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCustomAmount(String(v))}
                    style={{
                      padding: '0.4rem 0.9rem',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                      minWidth: 0,
                      textTransform: 'none',
                      letterSpacing: 0,
                      borderRadius: 999,
                      border: '1px solid var(--landing-border, #d5d0cb)',
                      background: customAmount === String(v) ? '#8a6f4d' : 'transparent',
                      color: customAmount === String(v) ? '#fff' : 'inherit',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    {`R$ ${v}`}
                  </button>
                ))}
              </div>
              <input
                type="text"
                inputMode="decimal"
                aria-label={t('contribution:oneTime.amountLabel', 'Valor da contribuição em reais')}
                placeholder={t('contribution:oneTime.amountPlaceholder', 'Outro valor, ex.: 35,00')}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') startOneTime(); }}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.8rem 0.9rem', borderRadius: 10, border: '1px solid #d5d0cb', fontSize: '1.05rem', textAlign: 'center' }}
              />
            </div>
            <button
              type="button"
              className="editorial-btn"
              style={{ minHeight: 78, marginTop: 'auto' }}
              disabled={!!pendingKey}
              onClick={startOneTime}
            >
              {pendingKey === 'apoio_unico' ? t('contribution:oneTime.submitting', 'Abrindo o pagamento…') : t('mission:editorial.singleBtn', 'Apoiar uma vez')}
            </button>
          </div>

        </div>

        {formError && (
          <div role="alert" style={{ maxWidth: 520, margin: '1.5rem auto 0', backgroundColor: '#fde8e8', color: '#c0392b', padding: '0.75rem', borderRadius: 8, fontSize: '0.9rem', textAlign: 'center' }}>
            {formError}
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

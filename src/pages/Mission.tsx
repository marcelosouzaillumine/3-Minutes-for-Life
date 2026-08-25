import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';
/* A Mission compartilha header, nav, botões e rodapé com a Landing.
   O import era implícito (funcionava só se a Landing tivesse sido
   carregada antes); agora a dependência é explícita. */
import './Landing.css';
import './Mission.css';
import { MissionProgress } from '../components/MissionProgress';
import { MissionService } from '../services/MissionService';
import { BrandLogo } from '../components/BrandLogo';

function useIntersectionObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Element[]>([]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );

    elementsRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return (element: Element | null) => {
    if (!element || elementsRef.current.includes(element)) return;
    elementsRef.current.push(element);
    if (observerRef.current) observerRef.current.observe(element);
  };
}

export function Mission() {
  const { t } = useTranslation('mission');
  const setRef = useIntersectionObserver();

  const [currentUsers, setCurrentUsers] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const startApp = () => { window.location.href = '/login'; };
  const closeMenu = () => { setIsMenuOpen(false); };
  const goToContributePage = () => { window.location.href = '/apoiar'; };

  useEffect(() => {
    let mounted = true;
    MissionService.getDailyImpact()
      .then((count) => { if (mounted) setCurrentUsers(count); })
      .catch((error) => { console.error('Failed to load mission impact:', error); });
    return () => { mounted = false; };
  }, []);

  const handleCheckoutRedirect = (tier: string, periodicity: string) => {
    const asaasLinks: Record<string, string> = {
      apoio_mensal: 'https://www.asaas.com/c/ubvo22er3ta93gsu',
      apoio_anual: 'https://www.asaas.com/c/zc0gqi05xcw920e1',
      livre_unica: 'https://www.asaas.com/c/ej6xz049gg63f7qi',
      livre_mensal: 'https://www.asaas.com/c/hju0fp9mzkw9t5g2',
    };
    const checkoutUrl = asaasLinks[`${tier}_${periodicity}`];
    if (checkoutUrl) { window.location.href = checkoutUrl; return; }
    goToContributePage();
  };

  return (
    <div className="mission-page">

      {/* ===== HEADER ===== */}

      <header className={`landing-header ${isMenuOpen ? 'menu-open' : ''}`}>
        <a href="/" className="landing-logo" aria-label="3 Minutes for Life" onClick={closeMenu}>
          <BrandLogo
            variant="light"
            alt="3 Minutes for Life"
            className="landing-logo-img"
            style={{
              height: '90px', width: 'auto', maxHeight: '90px',
              maxWidth: '220px', display: 'block', objectFit: 'contain',
            }}
          />
        </a>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen((c) => !c)}
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 6h16M4 18h16" />
            </svg>
          )}
        </button>

        <nav className={`landing-nav ${isMenuOpen ? 'open' : ''}`} aria-label="Navegação principal">
          <a href="/#como-funciona" onClick={closeMenu}>{t('nav.howItWorks')}</a>
          <a href="/#sobre" onClick={closeMenu}>{t('nav.about')}</a>
          <button type="button" className="btn-start-nav" onClick={() => { closeMenu(); startApp(); }}>
            {t('nav.start')}
          </button>
          <div className="landing-language-selector">
            <LanguageSelector />
          </div>
        </nav>
      </header>

      {/* ===== 1. A PERGUNTA — assimétrico 55/45 ===== */}

      <section className="mission-hero">
        <div className="mission-hero-text reveal" ref={setRef}>
          <h1 className="mission-hero-title">{t('hero.title')}</h1>

          <p className="mission-hero-lead">
            {t('hero.statement1')} {t('hero.statement2')} {t('hero.statement3')}
          </p>

          {currentUsers > 0 && (
            <div className="mission-hero-pill-wrapper">
              <MissionProgress current={currentUsers} target={100000} variant="pill" />
            </div>
          )}

          <div className="mission-hero-cta">
            <button type="button" className="btn-primary" onClick={goToContributePage}>
              {t('hero.ctaBtn')}
            </button>
            <a href="/" className="btn-secondary">{t('hero.ctaSecondary')}</a>
          </div>
        </div>

        <div className="mission-hero-visual reveal delay-200" ref={setRef} />
      </section>

      {/* ===== 2. O QUE SÃO TRÊS MINUTOS — full-bleed ===== */}

      <section className="mission-moment">
        <div className="mission-moment-inner">
          <h2 className="mission-moment-title reveal" ref={setRef}>
            {t('parallax.title')}
          </h2>

          <ul className="mission-moment-list">
            <li className="reveal delay-100" ref={setRef}>{t('parallax.p1')}</li>
            <li className="reveal delay-200" ref={setRef}>{t('parallax.p2')}</li>
            <li className="reveal delay-300" ref={setRef}>{t('parallax.p3')}</li>
            <li className="reveal delay-400" ref={setRef}>{t('parallax.p4')}</li>
          </ul>

          <p className="mission-moment-close reveal delay-500" ref={setRef}>
            {t('tension.p1')}
          </p>
        </div>
      </section>

      {/* ===== 3. O QUE MUDA DEPOIS — título fixo + cards ===== */}

      <section className="mission-outcomes">
        <div className="mission-outcomes-grid">

          <div className="mission-outcomes-aside">
            <div className="mission-outcomes-sticky">
              <h2 className="reveal" ref={setRef}>{t('tension.title')}</h2>
              <p className="reveal delay-100" ref={setRef}>{t('monumental.core')}</p>
            </div>
          </div>

          <div className="mission-outcomes-list">
            <article className="mission-outcome reveal" ref={setRef}>
              <span className="mission-outcome-index">01</span>
              <p>{t('monumental.card1')}</p>
            </article>
            <article className="mission-outcome reveal delay-100" ref={setRef}>
              <span className="mission-outcome-index">02</span>
              <p>{t('monumental.card2')}</p>
            </article>
            <article className="mission-outcome reveal delay-200" ref={setRef}>
              <span className="mission-outcome-index">03</span>
              <p>{t('monumental.card3')}</p>
            </article>
            <article className="mission-outcome reveal delay-300" ref={setRef}>
              <span className="mission-outcome-index">04</span>
              <p>{t('monumental.card4')}</p>
            </article>
          </div>

        </div>

        <div className="mission-scale reveal delay-400" ref={setRef}>
          <p className="mission-scale-figure">{t('monumental.title')}</p>
          <p className="mission-scale-note">
            {t('monumental.intro')} {t('monumental.final1')} {t('monumental.final2')}
          </p>
        </div>
      </section>

      {/* ===== 4. PARA QUEM =====
           Vem ANTES do pedido: é o argumento que o justifica.
           Depois dos cards de contribuição, este trecho chegaria
           tarde demais para ter função. ===== */}

      <section className="mission-farewell">
        <p className="mission-farewell-text reveal" ref={setRef}>
          {t('closing.final1')}
        </p>

        <p className="mission-farewell-detail reveal delay-100" ref={setRef}>
          {t('closing.final2')} {t('closing.final3')} {t('closing.final4')} {t('closing.final5')}
        </p>

        <p className="mission-farewell-ask reveal delay-200" ref={setRef}>
          {t('closing.final6')}
        </p>
      </section>

      {/* ===== 5. FAÇA PARTE — contido e centralizado ===== */}

      <section className="mission-invite">
        <div className="mission-invite-head reveal" ref={setRef}>
          <h2>{t('bridge.title')}</h2>
          <p>{t('bridge.p1')} {t('bridge.p2')}</p>
        </div>

        <div className="editorial-tiers three-tiers">

          <div className="editorial-tier">
            <h3 className="editorial-tier-name">{t('editorial.monthlyTitle')}</h3>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">
                {t('editorial.monthlyPriceMain')}
                <small>{t('editorial.monthlyPriceUnit')}</small>
              </span>
              <span className="editorial-price-sub">{t('editorial.monthlyDesc')}</span>
            </div>
            <button type="button" className="editorial-btn" onClick={() => handleCheckoutRedirect('apoio', 'mensal')}>
              {t('editorial.monthlyBtn')}
            </button>
          </div>

          <div className="editorial-tier highlight-tier">
            <div className="editorial-tier-badge">{t('editorial.yearlyBadge')}</div>
            <h3 className="editorial-tier-name">{t('editorial.yearlyTitle')}</h3>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">
                {t('editorial.yearlyPriceMain')}
                <small>{t('editorial.yearlyPriceUnit')}</small>
              </span>
              <span className="editorial-price-sub">{t('editorial.yearlyDesc')}</span>
            </div>
            <button type="button" className="editorial-btn primary" onClick={() => handleCheckoutRedirect('apoio', 'anual')}>
              {t('editorial.yearlyBtn')}
            </button>
          </div>

          <div className="editorial-tier">
            <h3 className="editorial-tier-name">{t('editorial.freeTitle')}</h3>
            <div className="editorial-tier-price">
              <span className="editorial-price-sub">{t('editorial.freeDesc')}</span>
            </div>
            <div className="editorial-tier-free-options">
              <button type="button" className="editorial-btn" onClick={() => handleCheckoutRedirect('livre', 'unica')}>
                {t('editorial.freeBtnSingle')}
              </button>
              <button type="button" className="editorial-btn" onClick={() => handleCheckoutRedirect('livre', 'mensal')}>
                {t('editorial.freeBtnMonthly')}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ===== RODAPÉ ===== */}

      <footer className="landing-footer">

        <div className="footer-signature">
          <BrandLogo
            variant="dark"
            alt="3 Minutes for Life"
            className="landing-footer-logo"
            style={{
              height: '90px',
              width: 'auto',
              display: 'block',
            }}
          />
        </div>

        <div className="footer-content">
          <p className="footer-tagline">{t('footer.brandTitle')}</p>

          <div className="footer-links">
            <a href="/">{t('footer.navHome')}</a>
            <a href="/missao">{t('footer.navMission')}</a>
            <a href="/apoiar">{t('footer.navDonate', 'Apoiar')}</a>
            <a href="/privacidade">{t('footer.privacy')}</a>
            <a href="/termos">{t('footer.terms')}</a>
            <a href="mailto:atendimento@3minutesforlife.com">
              {t('footer.contact', 'Contato')}
            </a>
          </div>

          <p className="footer-copy">
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </p>
        </div>

      </footer>

    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/LanguageSelector';
import './Mission.css';
import { ContributionModal } from '../components/ContributionModal';
import type { ContributionTier, Periodicity } from '../components/ContributionModal';
import { MissionProgress } from '../components/MissionProgress';
import { MissionService } from '../services/MissionService';

function useIntersectionObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Element[]>([]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    elementsRef.current.forEach(el => {
      if (observerRef.current) observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (el: Element | null) => {
    if (el && !elementsRef.current.includes(el)) {
      elementsRef.current.push(el);
    }
  };
}

export function Mission() {
  const { t } = useTranslation('mission');
  const setRef = useIntersectionObserver();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTier, setModalInitialTier] = useState<ContributionTier>('apoio');
  const [modalInitialPeriodicity, setModalInitialPeriodicity] = useState<Periodicity>('mensal');
  const [currentUsers, setCurrentUsers] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const startApp = () => {
    window.location.href = '/signup';
  };

  useEffect(() => {
    MissionService.getDailyImpact().then(count => setCurrentUsers(count));
  }, []);

  const openModal = (tier: ContributionTier = 'apoio', periodicity: Periodicity = 'mensal') => {
    setModalInitialTier(tier);
    setModalInitialPeriodicity(periodicity);
    setIsModalOpen(true);
  };

  const handleCheckoutRedirect = (tier: string, periodicity: string) => {
    const asaasLinks: Record<string, string> = {
      'apoio_mensal': 'https://www.asaas.com/c/p6w7aqj3q73z0s6p',
      'apoio_anual': 'https://www.asaas.com/c/ixokaznn11xejuir',
      'livre_unica': 'https://www.asaas.com/c/cfo4mysapw0wlk4i',
      'livre_mensal': 'https://www.asaas.com/c/vye9xaj09lcim8x7'
    };

    const linkKey = `${tier}_${periodicity}`;
    const checkoutUrl = asaasLinks[linkKey];

    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    } else {
      openModal(tier as ContributionTier, periodicity as Periodicity); // fallback to modal if link missing somehow
    }
  };

  return (
    <div className="mission-page">
      {/* Header */}
      <header className={`landing-header ${isMenuOpen ? 'menu-open' : ''}`} style={{ backgroundColor: 'var(--landing-bg)' }}>
        <a href="/">
          <img src="/logo.png" alt="3 Minutes for Life" className="landing-logo-img" />
        </a>
        
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M4 6h16M4 18h16"></path>
            </svg>
          )}
        </button>

        <nav className={`landing-nav ${isMenuOpen ? 'open' : ''}`}>
          <a href="/#como-funciona" onClick={() => setIsMenuOpen(false)}>{t('nav.howItWorks')}</a>
          <a href="/#sobre" onClick={() => setIsMenuOpen(false)}>{t('nav.about')}</a>
          <button className="btn-start-nav" onClick={() => { setIsMenuOpen(false); startApp(); }}>
            {t('nav.start')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
            <LanguageSelector />
          </div>
        </nav>
      </header>

      {/* 1. HERO */}
      <section className="mission-hero">
        <div className="mission-hero-text reveal" ref={setRef}>
          <span className="mission-id">3 Minutes for Life</span>
          <h1 className="mission-hero-title">
            {t('hero.title')}
          </h1>
          <div className="mission-hero-statements">
            <p>{t('hero.statement1')}</p>
            <p>{t('hero.statement2')}</p>
            <p>{t('hero.statement3')}</p>
          </div>
          
          <div className="mission-hero-pill-wrapper">
             {currentUsers > 0 && <MissionProgress current={currentUsers} target={100000} variant="pill" />}
          </div>
          
          <div className="mission-hero-cta">
             <button className="btn-primary" onClick={() => openModal()}>{t('hero.ctaBtn')}</button>
             <a href="/" className="btn-secondary">{t('hero.ctaSecondary')}</a>
          </div>
        </div>
        <div className="mission-hero-visual reveal delay-200" ref={setRef}></div>
      </section>

      {/* 2. TRANSIÇÃO VISUAL - TRÊS MINUTOS */}
      <section className="mission-parallax-section">
        <div className="parallax-overlay"></div>
        <div className="parallax-content">
          <h2 className="reveal" ref={setRef}>{t('parallax.title')}</h2>
          <div className="parallax-list">
            <p className="reveal delay-100" ref={setRef}>{t('parallax.p1')}</p>
            <p className="reveal delay-200" ref={setRef}>{t('parallax.p2')}</p>
            <p className="reveal delay-300" ref={setRef}>{t('parallax.p3')}</p>
            <p className="reveal delay-400" ref={setRef}>{t('parallax.p4')}</p>
          </div>
          <div className="parallax-conclusion reveal delay-500" ref={setRef}>
            <h3>
              {t('parallax.conclusion').split('\\n').map((line: string, i: number) => (
                <span key={i}>{line}<br/></span>
              ))}
            </h3>
          </div>
        </div>
      </section>

      {/* 3. IMPACTO HUMANO */}
      <section className="mission-tension-section">
         <div className="tension-grid">
           <div className="tension-left">
             <h2 className="tension-title">{t('tension.title')}</h2>
           </div>
           <div className="tension-right">
             <p style={{ fontSize: '1.25rem', lineHeight: '1.8' }}>{t('tension.p1')}</p>
           </div>
         </div>
      </section>

      {/* 4. UMA VIDA DE CADA VEZ */}
      <section className="mission-minimal-section">
        <span className="minimal-id reveal" ref={setRef}>{t('minimal.id')}</span>
        <div className="minimal-statements">
          <p className="reveal delay-100" ref={setRef}>{t('minimal.p1')}</p>
          <p className="reveal delay-200" ref={setRef}>{t('minimal.p2')}</p>
          <p className="reveal delay-300" ref={setRef}>{t('minimal.p3')}</p>
          <p className="reveal delay-400" ref={setRef}>{t('minimal.p4')}</p>
        </div>
        <div className="minimal-conclusion reveal delay-500" ref={setRef}>
          <p>{t('minimal.conclusion1')}</p>
          <p className="highlight">{t('minimal.conclusion2')}</p>
        </div>
      </section>

      {/* 5. A VISÃO DOS 100.000 */}
      <section className="mission-monumental-section">
        <h2 className="monumental-title">{t('monumental.title')}</h2>
        
        <p className="monumental-subtitle">{t('monumental.subtitle')}</p>

        <div className="monumental-text-block">
          <p className="monumental-intro">{t('monumental.intro')}</p>
          <p className="monumental-core">{t('monumental.core')}</p>
          
          <div className="transformation-grid">
            <div className="transformation-card">
              <p>{t('monumental.card1')}</p>
            </div>
            <div className="transformation-card">
              <p>{t('monumental.card2')}</p>
            </div>
            <div className="transformation-card">
              <p>{t('monumental.card3')}</p>
            </div>
            <div className="transformation-card highlight">
              <p>{t('monumental.card4')}</p>
            </div>
          </div>
        </div>

        <div className="monumental-final">
          <p>{t('monumental.final1')}</p>
          <p className="highlight">{t('monumental.final2')}</p>
        </div>
      </section>

      {/* 6. O CONVITE (A ponte) */}
      <section className="mission-bridge-section">
        <h2 className="reveal" ref={setRef}>{t('bridge.title')}</h2>
        <div className="bridge-text">
          <p className="reveal delay-100" ref={setRef}>{t('bridge.p1')}</p>
          <p className="reveal delay-200" ref={setRef}>{t('bridge.p2')}</p>
        </div>
      </section>

      {/* 7. CONTRIBUIÇÕES */}
      <section className="mission-editorial-pricing">
        <div className="editorial-tiers simplified-tiers reveal delay-100" ref={setRef}>
          
          <div className="editorial-tier">
            <h3 className="editorial-tier-name">{t('editorial.monthlyTitle')}</h3>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">{t('editorial.monthlyPriceMain')}<small>{t('editorial.monthlyPriceUnit')}</small></span>
              <span className="editorial-price-sub">{t('editorial.monthlyDesc')}</span>
            </div>
            <button className="editorial-btn" onClick={() => handleCheckoutRedirect('apoio', 'mensal')}>
              {t('editorial.monthlyBtn')}
            </button>
          </div>

          <div className="editorial-tier highlight-tier">
            <div className="editorial-tier-badge">{t('editorial.yearlyBadge')}</div>
            <h3 className="editorial-tier-name">{t('editorial.yearlyTitle')}</h3>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">{t('editorial.yearlyPriceMain')}<small>{t('editorial.yearlyPriceUnit')}</small></span>
              <span className="editorial-price-sub">{t('editorial.yearlyDesc')}</span>
            </div>
            <button className="editorial-btn primary" onClick={() => handleCheckoutRedirect('apoio', 'anual')}>
              {t('editorial.yearlyBtn')}
            </button>
          </div>

        </div>

        <div className="editorial-free reveal delay-200" ref={setRef}>
          <h3>{t('editorial.freeTitle')}</h3>
          <p>{t('editorial.freeDesc')}</p>
          <div className="editorial-free-actions">
            <button className="btn-text" onClick={() => handleCheckoutRedirect('livre', 'unica')}>{t('editorial.freeBtnSingle')}</button>
            <span className="editorial-divider"></span>
            <button className="btn-text" onClick={() => handleCheckoutRedirect('livre', 'mensal')}>{t('editorial.freeBtnMonthly')}</button>
          </div>
        </div>
      </section>

      {/* 8. FECHAMENTO */}
      <section className="mission-closing-section">
        <div className="closing-sequence">
          <p className="reveal" ref={setRef}>{t('closing.p1')}</p>
          <p className="reveal delay-100" ref={setRef}>{t('closing.p2')}</p>
          <p className="reveal delay-200" ref={setRef}>{t('closing.p3')}</p>
          <p className="reveal delay-300" ref={setRef}>{t('closing.p4')}</p>
        </div>
        
        <div className="closing-final reveal delay-400" ref={setRef}>
          <p>{t('closing.final1')}</p>
          <p>{t('closing.final2')}</p>
          <p>{t('closing.final3')}</p>
          <p>{t('closing.final4')}</p>
          <p>{t('closing.final5')}</p>
          <p className="highlight" style={{marginTop: '4rem'}}>{t('closing.final6')}</p>
        </div>

        <div className="reveal delay-500" ref={setRef} style={{marginTop: '4rem', marginBottom: '8rem'}}>
          <button className="btn-primary large" onClick={() => openModal()}>
            {t('closing.btn')}
          </button>
        </div>
      </section>

      {/* 9. RODAPÉ PREMIUM */}
      <footer className="mission-site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>{t('footer.brandTitle')}</h3>
            <p>{t('footer.brandDesc')}</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>{t('footer.navTitle')}</h4>
              <a href="/">{t('footer.navHome')}</a>
              <a href="/missao">{t('footer.navMission')}</a>
            </div>
            <div className="footer-column">
              <h4>{t('footer.legalTitle')}</h4>
              <a href="#">{t('footer.terms')}</a>
              <a href="#">{t('footer.privacy')}</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} {t('footer.copyright')}</p>
        </div>
      </footer>

      <ContributionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialTier={modalInitialTier}
        initialPeriodicity={modalInitialPeriodicity}
      />
    </div>
  );
}

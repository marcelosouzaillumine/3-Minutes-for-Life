import { useState, useEffect, useRef } from 'react';
import './Landing.css';
import { PrincipleView } from '../components/PrincipleView';
import type { Devotional } from '../types/Devotional';
import { LanguageSelector } from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

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

export function Landing() {
  const { t } = useTranslation(['landing']);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const setRef = useIntersectionObserver();

  const demoPrinciple = {
    id: 9999,
    title: 'Você está brigando com a realidade?',
    principle: 'A mudança começa quando reconhecemos a realidade como ela é.',
    reflection: 'Todos nós já gastamos energia desejando que uma situação fosse diferente. Ficamos pensando no que poderia ter acontecido, no que alguém deveria ter feito ou em como gostaríamos que as coisas fossem.\n\nEnquanto isso, a realidade continua diante de nós, esperando que a encaremos e decidamos o que fazer.\n\nAceitar a realidade não significa gostar dela, concordar com ela ou desistir de mudá-la. Significa reconhecer onde estamos para descobrir o que podemos fazer a partir daí.\n\nSó que nem tudo está sob nosso controle. E é justamente nesse limite que a fé pode nos ensinar um novo caminho.\n\nA fé cristã nos lembra que não precisamos controlar tudo para seguir em frente. Podemos entregar a Deus aquilo que não conseguimos mudar e voltar nossa atenção para aquilo que está ao nosso alcance.\n\nPor isso, a pergunta de hoje pode ser simples:\n\nO que posso fazer a partir daqui?',
    application: 'Pense em uma situação que tem trazido frustração. Separe o que você pode mudar daquilo que não está sob seu controle.\n\nEscolha uma coisa que está ao seu alcance e dê hoje um pequeno passo.',
    category: 'Uma reflexão para hoje',
    date: new Date().toISOString()
  };



  const startApp = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className={`landing-header ${isMenuOpen ? 'menu-open' : ''}`}>
        <img src="/logo.png" alt="3 Minutes for Life" className="landing-logo-img" />
        
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
          <a href="#como-funciona" onClick={() => setIsMenuOpen(false)}>{t('landing:nav.howItWorks')}</a>
          <a href="#sobre" onClick={() => setIsMenuOpen(false)}>{t('landing:nav.about')}</a>
          <a href="#apoie" onClick={() => setIsMenuOpen(false)}>{t('landing:nav.support')}</a>
          <button className="btn-start-nav" onClick={() => { setIsMenuOpen(false); startApp(); }}>
            {t('landing:nav.start')}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
            <LanguageSelector />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="landing-hero" ref={setRef}>
        <div className="hero-content reveal">
          <h1 className="hero-title">{t('landing:hero.title')}</h1>
          <p className="hero-subtitle">
            {t('landing:hero.subtitle')}
          </p>
          <div className="hero-actions">
            <button className="btn-start" onClick={startApp}>
              {t('landing:hero.btnStart')}
            </button>

          </div>
        </div>
        <div className="hero-visual reveal delay-200">
          <div className="hero-mockup-wrapper reveal delay-400">
            <PrincipleView 
              devotional={{
                id: demoPrinciple.id.toString(),
                title: demoPrinciple.title,
                reflection: demoPrinciple.principle + "\n\n" + demoPrinciple.reflection,
                practical_application: demoPrinciple.application,
                categories: { name: demoPrinciple.category },
                status: 'published'
              } as unknown as Devotional}
              customAction={{
                label: t('landing:hero.mockupLabel'),
                onClick: startApp
              }}
            />
          </div>
        </div>
      </section>

      {/* Por que três minutos? */}
      <section className="tension-section" ref={setRef}>
        <div className="tension-grid">
          <div className="tension-left reveal">
            <span className="attention-kicker">{t('landing:tension.kicker')}</span>
            <h3 className="tension-title"><span dangerouslySetInnerHTML={{ __html: t('landing:tension.title') }} /></h3>
          </div>
          <div className="tension-right reveal delay-200">
            <p className="tension-paragraph">
              {t('landing:tension.p1')}
            </p>
            <p className="tension-paragraph">
              {t('landing:tension.p2')}
            </p>
          </div>
        </div>
      </section>

      {/* {t('landing:relief.title')} */}
      <section className="relief-section" ref={setRef}>
        <div className="relief-content reveal">
          <h2 className="relief-statement">É por isso que existem três minutos.</h2>
          <p className="relief-subtext">
            {t('landing:relief.subtitle')}
          </p>
        </div>
      </section>

      {/* Pare. Reflita. Pratique. */}
      <section id="como-funciona" className="experience-image-section" ref={setRef}>
        <div className="experience-cards-grid">
          <div className="experience-card-item reveal delay-100">
            <h3 className="step-title">{t('landing:experience.step1.title')}</h3>
            <p className="step-desc"><span dangerouslySetInnerHTML={{ __html: t('landing:experience.step1.desc') }} /></p>
          </div>
          <div className="experience-card-item reveal delay-200">
            <h3 className="step-title">{t('landing:experience.step2.title')}</h3>
            <p className="step-desc"><span dangerouslySetInnerHTML={{ __html: t('landing:experience.step2.desc') }} /></p>
          </div>
          <div className="experience-card-item reveal delay-300">
            <h3 className="step-title">{t('landing:experience.step3.title')}</h3>
            <p className="step-desc">{t('landing:experience.step3.desc')}</p>
          </div>
        </div>
      </section>

      {/* Citação */}
      <section className="quote-section" ref={setRef}>
        <p style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--landing-text-light)', marginBottom: '2rem' }} className="reveal">
          {t('landing:quote1.top')}
        </p>
        <div className="perceived-statement reveal delay-100" style={{ margin: 0 }}>
          <span dangerouslySetInnerHTML={{ __html: t('landing:quote1.statement') }} />
        </div>
      </section>

      {/* {t('landing:split.title')} */}
      <section className="split-section" ref={setRef}>
        <div className="split-image reveal"></div>
        <div className="split-content reveal delay-200">
          <h2 className="split-title">O que orienta o seu olhar?</h2>
          <p className="split-text">
            {t('landing:split.p1')}
          </p>
          <p className="split-text">
            {t('landing:split.p2')}
          </p>
        </div>
      </section>

      {/* Para quem é */}
      <section id="sobre" className="audience-section" ref={setRef}>
        <div className="audience-grid">
          <div className="audience-lead reveal">
            <h2>{t('landing:audience.title')}</h2>
          </div>
          <div className="audience-list reveal delay-200">
            <p>{(t('landing:audience.items', { returnObjects: true }) as string[])[0]}</p>
            <p>{(t('landing:audience.items', { returnObjects: true }) as string[])[1]}</p>
            <p>{(t('landing:audience.items', { returnObjects: true }) as string[])[2]}</p>
            <p>{(t('landing:audience.items', { returnObjects: true }) as string[])[3]}</p>
            <p>{(t('landing:audience.items', { returnObjects: true }) as string[])[4]}</p>
            <p>{(t('landing:audience.items', { returnObjects: true }) as string[])[5]}</p>
          </div>
        </div>
      </section>

      {/* Citação Resumo */}
      <section className="quote-section" ref={setRef} style={{ padding: '6rem var(--spacing-lg)' }}>
        <div className="perceived-statement reveal">
          <span dangerouslySetInnerHTML={{ __html: t('landing:quote2.statement') }} />
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--landing-text-light)', fontStyle: 'italic', marginTop: '4rem' }} className="reveal delay-100">
          {t('landing:quote2.bottom')}
        </p>
      </section>

      {/* Sustentabilidade */}
      <section id="apoie" className="sustainability-section" ref={setRef}>
        <div className="sustainability-container reveal">
          <h2 className="sustainability-title">{t('landing:sustainability.title')}</h2>
          
          <div className="sustainability-grid">
            <div className="sustainability-text">
              <p>{t('landing:sustainability.p1')}</p>
              <p>{t('landing:sustainability.p2')}</p>
              <p>{t('landing:sustainability.p3')}</p>
              <p>{t('landing:sustainability.p4')}</p>
              <p>{t('landing:sustainability.p5')}</p>
              <p>{t('landing:sustainability.p6')}</p>
              
              <button className="btn-support" onClick={() => window.location.href = '/missao'}>
                {t('landing:sustainability.btn')}
              </button>
            </div>
            
            <div className="sustainability-breakdown">
              <h3>{t('landing:sustainability.breakdownTitle')}</h3>
              <p>{t('landing:sustainability.breakdownDesc')}</p>
              
              <ul className="breakdown-list">
                <li>
                  <strong>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[0].title}</strong><span>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[0].desc}</span>
                </li>
                <li>
                  <strong>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[1].title}</strong><span>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[1].desc}</span>
                </li>
                <li>
                  <strong>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[2].title}</strong><span>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[2].desc}</span>
                </li>
                <li>
                  <strong>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[3].title}</strong><span>{(t('landing:sustainability.items', { returnObjects: true }) as any[])[3].desc}</span>
                </li>
              </ul>
              <p className="breakdown-note">{t('landing:sustainability.note')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Continue sua jornada */}
      <section className="continue-section" ref={setRef} style={{ padding: '6rem var(--spacing-md)', textAlign: 'center' }}>
        <h2 className="reveal" style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>{t('landing:continue.title')}</h2>
        <p className="reveal delay-100" style={{ fontSize: '1.1rem', color: 'var(--landing-text-light)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
          {t('landing:continue.subtitle')}
        </p>
        
        <div className="reveal delay-200" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-start" onClick={startApp}>
            {t('landing:continue.btnCreate')}
          </button>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--landing-text-light)', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {t('landing:continue.btnLogin')}
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" ref={setRef}>
        <h2 className="faq-title reveal">{t('landing:faq.title')}</h2>
        <div className="faq-grid">
          <div className="faq-item reveal delay-100">
            <h3 className="faq-question">{t('landing:faq.q1.q')}</h3>
            <p className="faq-answer">{t('landing:faq.q1.a')}</p>
          </div>
          <div className="faq-item reveal delay-200">
            <h3 className="faq-question">{t('landing:faq.q2.q')}</h3>
            <p className="faq-answer">{t('landing:faq.q2.a')}</p>
          </div>
          <div className="faq-item reveal delay-300">
            <h3 className="faq-question">{t('landing:faq.q3.q')}</h3>
            <p className="faq-answer">{t('landing:faq.q3.a')}</p>
          </div>
          <div className="faq-item reveal delay-400">
            <h3 className="faq-question">{t('landing:faq.q4.q')}</h3>
            <p className="faq-answer">{t('landing:faq.q4.a')}</p>
          </div>
          <div className="faq-item reveal delay-500">
            <h3 className="faq-question">{t('landing:faq.q5.q')}</h3>
            <p className="faq-answer">{t('landing:faq.q5.a')}</p>
          </div>
          <div className="faq-item reveal delay-600">
            <h3 className="faq-question">{t('landing:faq.q6.q')}</h3>
            <p className="faq-answer">{t('landing:faq.q6.a')}</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final" ref={setRef}>
        <h2 className="cta-final-title reveal">{t('landing:cta.title')}</h2>
        <p className="cta-final-subtitle reveal delay-100">{t('landing:cta.subtitle')}</p>
        <div className="reveal delay-200">
          <button className="btn-start" onClick={startApp}>
            {t('landing:cta.btn')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-signature">3 Minutes for Life</div>
        <div className="footer-content">
          <p className="footer-tagline">{t('landing:footer.tagline')}</p>
          <div className="footer-links">
            <a href="#como-funciona">{t('landing:footer.links.howItWorks')}</a>
            <a href="#sobre">{t('landing:footer.links.about')}</a>
            <a href="#apoie">{t('landing:footer.links.support')}</a>
            <a href="#">{t('landing:footer.links.privacy')}</a>
            <a href="#">{t('landing:footer.links.terms')}</a>
            <a href="#">{t('landing:footer.links.contact')}</a>
          </div>
          <p className="footer-copy">{t('landing:footer.copy')}</p>
        </div>
      </footer>
    </div>
  );
}

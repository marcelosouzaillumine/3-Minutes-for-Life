import { useState, useEffect, useRef } from 'react';
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
          <a href="/#como-funciona" onClick={() => setIsMenuOpen(false)}>Como funciona</a>
          <a href="/#sobre" onClick={() => setIsMenuOpen(false)}>Sobre</a>
          <button className="btn-start-nav" onClick={() => { setIsMenuOpen(false); startApp(); }}>
            Começar
          </button>
        </nav>
      </header>

      {/* 1. HERO */}
      <section className="mission-hero">
        <div className="mission-hero-text reveal" ref={setRef}>
          <span className="mission-id">3 Minutes for Life</span>
          <h1 className="mission-hero-title">
            E se três minutos pudessem mudar a maneira como alguém vive o dia?
          </h1>
          <div className="mission-hero-statements">
            <p>Uma pausa.</p>
            <p>Uma reflexão.</p>
            <p>Uma nova perspectiva.</p>
          </div>
          
          <div className="mission-hero-pill-wrapper">
             {currentUsers > 0 && <MissionProgress current={currentUsers} target={100000} variant="pill" />}
          </div>
          
          <div className="mission-hero-cta">
             <button className="btn-primary" onClick={() => openModal()}>Fazer parte da missão</button>
             <a href="/" className="btn-secondary">Conhecer o projeto</a>
          </div>
        </div>
        <div className="mission-hero-visual reveal delay-200" ref={setRef}></div>
      </section>

      {/* 2. TRANSIÇÃO VISUAL - TRÊS MINUTOS */}
      <section className="mission-parallax-section">
        <div className="parallax-overlay"></div>
        <div className="parallax-content">
          <h2 className="reveal" ref={setRef}>Três minutos.</h2>
          <div className="parallax-list">
            <p className="reveal delay-100" ref={setRef}>Antes de responder.</p>
            <p className="reveal delay-200" ref={setRef}>Antes de decidir.</p>
            <p className="reveal delay-300" ref={setRef}>Antes de desistir.</p>
            <p className="reveal delay-400" ref={setRef}>Antes de levar o peso do dia para dentro de casa.</p>
          </div>
          <div className="parallax-conclusion reveal delay-500" ref={setRef}>
            <h3>Três minutos para parar.<br/>Pensar.<br/>Escolher melhor.</h3>
          </div>
        </div>
      </section>

      {/* 3. IMPACTO HUMANO */}
      <section className="mission-tension-section">
         <div className="tension-grid">
           <div className="tension-left">
             <h2 className="tension-title">E se esses três minutos mudassem alguma coisa?</h2>
           </div>
           <div className="tension-right">
             <p>Talvez alguém escolha ouvir em vez de responder.</p>
             <p>Talvez alguém volte para casa diferente.</p>
             <p>Talvez uma conversa aconteça.</p>
             <p>Talvez uma decisão seja tomada com mais sabedoria.</p>
             <p>Talvez alguém encontre coragem para continuar.</p>
             <p>Talvez alguém perceba que precisa mudar.</p>
           </div>
         </div>
         <div className="tension-conclusion">
            <p>Não sabemos qual vida será alcançada.</p>
            <p className="highlight">Mas sabemos que cada vida importa.</p>
         </div>
      </section>

      {/* 4. UMA VIDA DE CADA VEZ */}
      <section className="mission-minimal-section">
        <span className="minimal-id reveal" ref={setRef}>Uma vida de cada vez.</span>
        <div className="minimal-statements">
          <p className="reveal delay-100" ref={setRef}>Uma pessoa.</p>
          <p className="reveal delay-200" ref={setRef}>Um dia.</p>
          <p className="reveal delay-300" ref={setRef}>Três minutos.</p>
          <p className="reveal delay-400" ref={setRef}>Uma pequena decisão.</p>
        </div>
        <div className="minimal-conclusion reveal delay-500" ref={setRef}>
          <p>Grandes mudanças nem sempre começam com grandes acontecimentos.</p>
          <p className="highlight">Às vezes começam com uma pessoa que decidiu parar por três minutos.</p>
        </div>
      </section>

      {/* 5. A VISÃO DOS 100.000 */}
      <section className="mission-monumental-section">
        <h2 className="monumental-title">Imagine 100.000 pessoas dedicando 3 minutos por dia para refletir sobre o que realmente importa.</h2>
        
        <p className="monumental-subtitle">São 300.000 minutos de reflexão diária.</p>

        <div className="monumental-text-block">
          <p className="monumental-intro">Mas a missão nunca foi sobre números.</p>
          <p className="monumental-core">É sobre o que acontece depois desses três minutos:</p>
          
          <div className="transformation-grid">
            <div className="transformation-card">
              <p>uma escolha mais consciente</p>
            </div>
            <div className="transformation-card">
              <p>uma conversa diferente</p>
            </div>
            <div className="transformation-card">
              <p>uma família fortalecida</p>
            </div>
            <div className="transformation-card highlight">
              <p>uma vida que encontra direção</p>
            </div>
          </div>
        </div>

        <div className="monumental-final">
          <p>Porque não queremos apenas alcançar pessoas.</p>
          <p className="highlight">Queremos transformar a forma como elas vivem.</p>
        </div>
      </section>

      {/* 6. O CONVITE (A ponte) */}
      <section className="mission-bridge-section">
        <h2 className="reveal" ref={setRef}>Faça parte da missão</h2>
        <div className="bridge-text">
          <p className="reveal delay-100" ref={setRef}>O 3 Minutos para a Vida é gratuito.</p>
          <p className="reveal delay-200" ref={setRef}>Se este projeto fizer sentido para você, existem duas formas simples de ajudar a mantê-lo vivo e chegar a mais pessoas.</p>
        </div>
      </section>

      {/* 7. CONTRIBUIÇÕES */}
      <section className="mission-editorial-pricing">
        <div className="editorial-tiers simplified-tiers reveal delay-100" ref={setRef}>
          
          <div className="editorial-tier">
            <h3 className="editorial-tier-name">Apoio mensal</h3>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">R$ 9,90<small>/mês</small></span>
              <span className="editorial-price-sub">Uma pequena contribuição recorrente para sustentar a missão.</span>
            </div>
            <button className="editorial-btn" onClick={() => handleCheckoutRedirect('apoio', 'mensal')}>
              Apoiar mensalmente
            </button>
          </div>

          <div className="editorial-tier highlight-tier">
            <div className="editorial-tier-badge">Mais econômica</div>
            <h3 className="editorial-tier-name">Apoio anual</h3>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">R$ 59,90<small>/ano</small></span>
              <span className="editorial-price-sub">A forma mais econômica de apoiar continuamente o projeto.</span>
            </div>
            <button className="editorial-btn primary" onClick={() => handleCheckoutRedirect('apoio', 'anual')}>
              Apoiar anualmente
            </button>
          </div>

        </div>

        <div className="editorial-free reveal delay-200" ref={setRef}>
          <h3>Contribuição voluntária</h3>
          <p>Quer contribuir com outro valor? Você escolhe quanto e como contribuir.</p>
          <div className="editorial-free-actions">
            <button className="btn-text" onClick={() => handleCheckoutRedirect('livre', 'unica')}>Contribuição única</button>
            <span className="editorial-divider"></span>
            <button className="btn-text" onClick={() => handleCheckoutRedirect('livre', 'mensal')}>Contribuição mensal</button>
          </div>
        </div>
      </section>

      {/* 8. FECHAMENTO */}
      <section className="mission-closing-section">
        <div className="closing-sequence">
          <p className="reveal" ref={setRef}>Começa com uma pessoa.</p>
          <p className="reveal delay-100" ref={setRef}>Depois outra.</p>
          <p className="reveal delay-200" ref={setRef}>Depois outra.</p>
          <p className="reveal delay-300" ref={setRef}>Até chegar a 100.000.</p>
        </div>
        
        <div className="closing-final reveal delay-400" ref={setRef}>
          <p>Talvez a próxima pessoa seja alguém que você nunca conhecerá.</p>
          <p>Alguém que precisava de uma pausa.</p>
          <p>De uma palavra.</p>
          <p>De uma nova perspectiva.</p>
          <p>De três minutos.</p>
          <p className="highlight" style={{marginTop: '4rem'}}>Ajude-nos a chegar até essa pessoa.</p>
        </div>

        <div className="reveal delay-500" ref={setRef} style={{marginTop: '4rem', marginBottom: '8rem'}}>
          <button className="btn-primary large" onClick={() => openModal()}>
            FAZER PARTE DA MISSÃO
          </button>
        </div>
      </section>

      {/* 9. RODAPÉ PREMIUM */}
      <footer className="mission-site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>3 Minutos para a Vida</h3>
            <p>Um pequeno espaço de tempo. Um impacto para a eternidade. O projeto é mantido por pessoas que acreditam nessa missão, ajudando a sustentar a plataforma para que continue gratuita e alcance mais vidas.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Navegação</h4>
              <a href="/">Página Inicial</a>
              <a href="/missao">Nossa Missão</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Termos de Uso</a>
              <a href="#">Política de Privacidade</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} 3 Minutos para a Vida. Todos os direitos reservados.</p>
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

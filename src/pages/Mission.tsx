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
  const [modalInitialTier, setModalInitialTier] = useState<ContributionTier>('parceiro');
  const [modalInitialPeriodicity, setModalInitialPeriodicity] = useState<Periodicity>('mensal');
  const [currentUsers, setCurrentUsers] = useState(0);

  useEffect(() => {
    MissionService.getDailyImpact().then(count => setCurrentUsers(count));
  }, []);

  const openModal = (tier: ContributionTier = 'parceiro', periodicity: Periodicity = 'mensal') => {
    setModalInitialTier(tier);
    setModalInitialPeriodicity(periodicity);
    setIsModalOpen(true);
  };

  return (
    <div className="mission-page">
      
      {/* 1. HERO */}
      <section className="mission-hero" ref={setRef}>
        <div className="mission-hero-text reveal">
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
        <div className="mission-hero-visual reveal delay-200"></div>
      </section>

      {/* 2. TRANSIÇÃO VISUAL - TRÊS MINUTOS */}
      <section className="mission-parallax-section" ref={setRef}>
        <div className="parallax-overlay"></div>
        <div className="parallax-content">
          <h2 className="reveal">Três minutos.</h2>
          <div className="parallax-list">
            <p className="reveal delay-100">Antes de responder.</p>
            <p className="reveal delay-200">Antes de decidir.</p>
            <p className="reveal delay-300">Antes de desistir.</p>
            <p className="reveal delay-400">Antes de levar o peso do dia para dentro de casa.</p>
          </div>
          <div className="parallax-conclusion reveal delay-500">
            <h3>Três minutos para parar.<br/>Pensar.<br/>Escolher melhor.</h3>
          </div>
        </div>
      </section>

      {/* 3. IMPACTO HUMANO */}
      <section className="mission-tension-section" ref={setRef}>
         <div className="tension-grid">
           <div className="tension-left reveal">
             <h2 className="tension-title">E se esses três minutos mudassem alguma coisa?</h2>
           </div>
           <div className="tension-right">
             <p className="reveal delay-100">Talvez alguém escolha ouvir em vez de responder.</p>
             <p className="reveal delay-200">Talvez alguém volte para casa diferente.</p>
             <p className="reveal delay-300">Talvez uma conversa aconteça.</p>
             <p className="reveal delay-400">Talvez uma decisão seja tomada com mais sabedoria.</p>
             <p className="reveal delay-500">Talvez alguém encontre coragem para continuar.</p>
             <p className="reveal delay-600">Talvez alguém perceba que precisa mudar.</p>
           </div>
         </div>
         <div className="tension-conclusion reveal delay-700">
            <p>Não sabemos qual vida será alcançada.</p>
            <p className="highlight">Mas sabemos que cada vida importa.</p>
         </div>
      </section>

      {/* 4. UMA VIDA DE CADA VEZ */}
      <section className="mission-minimal-section" ref={setRef}>
        <span className="minimal-id reveal">Uma vida de cada vez.</span>
        <div className="minimal-statements">
          <p className="reveal delay-100">Uma pessoa.</p>
          <p className="reveal delay-200">Um dia.</p>
          <p className="reveal delay-300">Três minutos.</p>
          <p className="reveal delay-400">Uma pequena decisão.</p>
        </div>
        <div className="minimal-conclusion reveal delay-500">
          <p>Grandes mudanças nem sempre começam com grandes acontecimentos.</p>
          <p className="highlight">Às vezes começam com uma pessoa que decidiu parar por três minutos.</p>
        </div>
      </section>

      {/* 5. A VISÃO DOS 100.000 */}
      <section className="mission-monumental-section" ref={setRef}>
        <h2 className="reveal">Imagine 100.000 pessoas fazendo isso todos os dias.</h2>
        
        <div className="monumental-math reveal delay-100">
          <div className="math-row">
            <span className="math-number">100.000</span>
            <span className="math-text">pessoas</span>
          </div>
          <div className="math-operator">×</div>
          <div className="math-row">
            <span className="math-number">3</span>
            <span className="math-text">minutos</span>
          </div>
          <div className="math-equals">=</div>
          <div className="math-result">
            <span className="math-number accent">300.000</span>
            <span className="math-text accent">minutos de reflexão<br/>todos os dias.</span>
          </div>
        </div>

        <div className="monumental-deconstruct">
          <p className="reveal delay-200">O número não é o mais importante.</p>
          <p className="monumental-highlight reveal delay-300">São 100.000 histórias.</p>
          <div className="monumental-sequence reveal delay-400">
            <p>100.000 famílias.</p>
            <p>100.000 ambientes de trabalho.</p>
            <p>100.000 decisões.</p>
            <p className="highlight">100.000 vidas.</p>
          </div>
        </div>

        <div className="monumental-final reveal delay-500">
          <p>Não queremos apenas alcançar 100.000 usuários.</p>
          <p className="highlight">Queremos alcançar 100.000 vidas.</p>
        </div>
      </section>

      {/* 6. O CONVITE (A ponte) */}
      <section className="mission-bridge-section" ref={setRef}>
        <h2 className="reveal">Você pode ajudar uma dessas pessoas a chegar até aqui.</h2>
        <div className="bridge-text">
          <p className="reveal delay-100">O 3 Minutos para a Vida é gratuito. E queremos que continue assim.</p>
          <p className="reveal delay-200">Por isso, algumas pessoas escolhem contribuir para que outras também possam receber.</p>
        </div>
        <div className="bridge-highlight reveal delay-300">
          <p>Você não está pagando para receber.</p>
          <p>Você está ajudando alguém a receber.</p>
        </div>
      </section>

      {/* 7. CONTRIBUIÇÕES */}
      <section className="mission-editorial-pricing" ref={setRef}>
        <h2 className="reveal">Faça parte da missão</h2>
        
        <div className="editorial-tiers reveal delay-100">
          
          <div className="editorial-tier">
            <div className="editorial-tier-header">
              <span className="editorial-tier-icon">🌱</span>
              <h3 className="editorial-tier-name">Semente</h3>
            </div>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">R$ 9,90<small>/mês</small></span>
              <span className="editorial-price-sub">ou R$ 79,90/ano</span>
            </div>
            <button className="editorial-btn" onClick={() => openModal('semente', 'mensal')}>
              Tornar-me mantenedor
            </button>
          </div>

          <div className="editorial-tier highlight-tier">
            <div className="editorial-tier-badge">Mais escolhida</div>
            <div className="editorial-tier-header">
              <span className="editorial-tier-icon">⭐</span>
              <h3 className="editorial-tier-name">Parceiro</h3>
            </div>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">R$ 19,90<small>/mês</small></span>
              <span className="editorial-price-sub">ou R$ 159,90/ano</span>
            </div>
            <button className="editorial-btn primary" onClick={() => openModal('parceiro', 'mensal')}>
              Tornar-me mantenedor
            </button>
          </div>

          <div className="editorial-tier">
            <div className="editorial-tier-header">
              <span className="editorial-tier-icon">🛡️</span>
              <h3 className="editorial-tier-name">Mantenedor</h3>
            </div>
            <div className="editorial-tier-price">
              <span className="editorial-price-main">R$ 29,90<small>/mês</small></span>
              <span className="editorial-price-sub">ou R$ 239,90/ano</span>
            </div>
            <button className="editorial-btn" onClick={() => openModal('mantenedor', 'mensal')}>
              Tornar-me mantenedor
            </button>
          </div>

        </div>

        <div className="editorial-free reveal delay-200">
          <h3>Ou escolha outro valor</h3>
          <div className="editorial-free-actions">
            <button className="btn-text" onClick={() => openModal('livre', 'unica')}>Contribuição única</button>
            <span className="editorial-divider"></span>
            <button className="btn-text" onClick={() => openModal('livre', 'mensal')}>Contribuição mensal</button>
          </div>
        </div>
      </section>

      {/* 8. FECHAMENTO */}
      <section className="mission-closing-section" ref={setRef}>
        <div className="closing-sequence">
          <p className="reveal">Começa com uma pessoa.</p>
          <p className="reveal delay-100">Depois outra.</p>
          <p className="reveal delay-200">Depois outra.</p>
          <p className="reveal delay-300">Até chegar a 100.000.</p>
        </div>
        
        <div className="closing-final reveal delay-400">
          <p>Talvez a próxima pessoa seja alguém que você nunca conhecerá.</p>
          <p>Alguém que precisava de uma pausa.</p>
          <p>De uma palavra.</p>
          <p>De uma nova perspectiva.</p>
          <p>De três minutos.</p>
          <p className="highlight" style={{marginTop: '4rem'}}>Ajude-nos a chegar até essa pessoa.</p>
        </div>

        <div className="reveal delay-500" style={{marginTop: '4rem'}}>
          <button className="btn-primary large" onClick={() => openModal()}>
            FAZER PARTE DA MISSÃO
          </button>
        </div>

        <div className="mission-footer reveal delay-600">
          <p>O 3 Minutos para a Vida é mantido por pessoas que acreditam nessa missão. As contribuições ajudam a sustentar o projeto e permitem que ele continue gratuito e alcance mais pessoas.</p>
        </div>
      </section>

      <ContributionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialTier={modalInitialTier}
        initialPeriodicity={modalInitialPeriodicity}
      />
    </div>
  );
}

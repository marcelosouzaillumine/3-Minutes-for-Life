import { useState, useEffect, useRef } from 'react';
import './Mission.css';
import { ContributionModal } from '../components/ContributionModal';
import type { ContributionTier, Periodicity } from '../components/ContributionModal';
import { MissionProgress } from '../components/MissionProgress';

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

  // Hardcoded for now, ready to receive props or context
  const currentUsers = 1247;
  const targetUsers = 100000;

  const openModal = (tier: ContributionTier = 'parceiro', periodicity: Periodicity = 'mensal') => {
    setModalInitialTier(tier);
    setModalInitialPeriodicity(periodicity);
    setIsModalOpen(true);
  };

  return (
    <div className="mission-page">

      {/* 1. HERO */}
      <section className="mission-section hero-section" ref={setRef}>
        <span className="hero-logo reveal">3 Minutes for Life</span>
        <h1 className="reveal delay-100">E se três minutos pudessem mudar a maneira como alguém vive o dia?</h1>
        
        <div className="hero-statements reveal delay-200">
          <p>Uma pausa.</p>
          <p>Uma reflexão.</p>
          <p>Uma nova perspectiva.</p>
        </div>

        <div className="hero-meta-block reveal delay-300">
          <MissionProgress current={currentUsers} target={targetUsers} variant="pill" />
          <div style={{ marginTop: '3rem' }}>
            <span className="hero-meta-title">Nossa meta</span>
            <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--landing-text)' }}>100.000 pessoas por dia</span>
            <div style={{ marginTop: '1rem' }}>
              <MissionProgress current={currentUsers} target={targetUsers} variant="bar" />
            </div>
            <p className="hero-meta-subtitle">Queremos chegar a 100.000 pessoas vivendo essa experiência todos os dias.</p>
          </div>
        </div>
        
        <div className="reveal delay-400" style={{ marginTop: '4rem' }}>
          <button className="btn-primary large" onClick={() => openModal()}>
            FAZER PARTE DA MISSÃO
          </button>
        </div>
      </section>

      {/* 2. TRANSIÇÃO — TRÊS MINUTOS */}
      <section className="mission-section visual-transition" ref={setRef}>
        <h2 className="reveal">Três minutos.</h2>
        <div className="transition-list">
          <p className="reveal delay-100">Antes de responder.</p>
          <p className="reveal delay-200">Antes de decidir.</p>
          <p className="reveal delay-300">Antes de desistir.</p>
          <p className="reveal delay-400">Antes de levar o peso do dia para dentro de casa.</p>
        </div>
        <div className="transition-conclusion reveal delay-500">
          <h3>Três minutos para parar.<br/>Pensar.<br/>Escolher melhor.</h3>
        </div>
      </section>

      {/* 3. IMPACTO HUMANO */}
      <section className="mission-section human-impact" ref={setRef}>
        <h2 className="reveal">E se esses três minutos mudassem alguma coisa?</h2>
        <div className="human-list">
          <p className="reveal delay-100">Talvez alguém escolha ouvir em vez de responder.</p>
          <p className="reveal delay-200">Talvez alguém volte para casa diferente.</p>
          <p className="reveal delay-300">Talvez uma conversa aconteça.</p>
          <p className="reveal delay-400">Talvez uma decisão seja tomada com mais sabedoria.</p>
          <p className="reveal delay-500">Talvez alguém encontre coragem para continuar.</p>
          <p className="reveal delay-600">Talvez alguém perceba que precisa mudar.</p>
        </div>
        <div className="human-conclusion reveal delay-700">
          <p>Não sabemos qual vida será alcançada.</p>
          <p className="highlight">Mas sabemos que cada vida importa.</p>
        </div>
      </section>

      {/* 4. UMA VIDA DE CADA VEZ */}
      <section className="mission-section one-life" ref={setRef}>
        <span className="one-life-title reveal">Uma vida de cada vez.</span>
        <div className="one-life-list">
          <p className="reveal delay-100">Uma pessoa.</p>
          <p className="reveal delay-200">Um dia.</p>
          <p className="reveal delay-300">Três minutos.</p>
          <p className="reveal delay-400">Uma pequena decisão.</p>
        </div>
        <div className="one-life-conclusion reveal delay-500">
          <p>Grandes mudanças nem sempre começam com grandes acontecimentos.</p>
          <p className="highlight">Às vezes começam com uma pessoa que decidiu parar por três minutos.</p>
        </div>
      </section>

      {/* 5. A VISÃO DOS 100.000 */}
      <section className="mission-section vision-section" ref={setRef}>
        <h2 className="vision-title reveal">Imagine 100.000 pessoas fazendo isso todos os dias.</h2>
        
        <div className="vision-math reveal delay-100">
          <span>100.000 pessoas</span>
          <span className="operator">×</span>
          <span>3 minutos</span>
        </div>

        <div className="vision-math-result reveal delay-200">
          300.000<br/>minutos de reflexão<br/>todos os dias.
        </div>

        <div className="vision-deconstruct">
          <p className="reveal delay-300">O número não é o mais importante.</p>
          <p className="highlight reveal delay-400">São 100.000 histórias.</p>
          <div className="reveal delay-500">
            <p>100.000 famílias.</p>
            <p>100.000 ambientes de trabalho.</p>
            <p>100.000 decisões.</p>
            <p>100.000 vidas.</p>
          </div>
        </div>

        <div className="vision-final reveal delay-600">
          <p>Não queremos apenas alcançar 100.000 usuários.</p>
          <p className="highlight">Queremos alcançar 100.000 vidas.</p>
        </div>
      </section>

      {/* 6. O CONVITE (A ponte) */}
      <section className="mission-section bridge-section" ref={setRef}>
        <h2 className="reveal">Você pode ajudar uma dessas pessoas a chegar até aqui.</h2>
        <div className="bridge-text">
          <p className="reveal delay-100">O 3 Minutos para a Vida é gratuito.</p>
          <p className="reveal delay-200">E queremos que continue assim.</p>
          <p className="reveal delay-300">Por isso, algumas pessoas escolhem contribuir para que outras também possam receber.</p>
        </div>
        <div className="bridge-highlight reveal delay-400">
          <p>Você não está pagando para receber.</p>
          <p>Você está ajudando alguém a receber.</p>
        </div>
      </section>

      {/* 7. CONTRIBUIÇÕES */}
      <section className="mission-section contribution-section" ref={setRef}>
        <h2 className="reveal">Faça parte da missão</h2>
        
        <div className="tiers-grid reveal delay-100">
          <div className="tier-card">
            <div className="tier-icon">🌱</div>
            <h3 className="tier-name">Semente</h3>
            <div className="tier-price">
              <span className="tier-price-monthly">R$ 9,90<span style={{fontSize: '1rem'}}>/mês</span></span>
              <span className="tier-price-annual">ou R$ 79,90/ano</span>
            </div>
            <button className="btn-primary" style={{width: '100%', padding: '1rem', fontSize: '0.9rem'}} onClick={() => openModal('semente', 'mensal')}>
              Tornar-me mantenedor
            </button>
          </div>

          <div className="tier-card highlight" style={{ borderColor: 'var(--landing-accent)' }}>
            <div className="tier-icon" style={{ fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--landing-accent)' }}>Mais escolhida</div>
            <h3 className="tier-name">Parceiro</h3>
            <div className="tier-price">
              <span className="tier-price-monthly">R$ 19,90<span style={{fontSize: '1rem'}}>/mês</span></span>
              <span className="tier-price-annual">ou R$ 159,90/ano</span>
            </div>
            <button className="btn-primary" style={{width: '100%', padding: '1rem', fontSize: '0.9rem'}} onClick={() => openModal('parceiro', 'mensal')}>
              Tornar-me mantenedor
            </button>
          </div>

          <div className="tier-card">
            <div className="tier-icon">🛡️</div>
            <h3 className="tier-name">Mantenedor</h3>
            <div className="tier-price">
              <span className="tier-price-monthly">R$ 29,90<span style={{fontSize: '1rem'}}>/mês</span></span>
              <span className="tier-price-annual">ou R$ 239,90/ano</span>
            </div>
            <button className="btn-primary" style={{width: '100%', padding: '1rem', fontSize: '0.9rem'}} onClick={() => openModal('mantenedor', 'mensal')}>
              Tornar-me mantenedor
            </button>
          </div>
        </div>

        <div className="free-contribution reveal delay-200">
          <h3>Ou escolha outro valor</h3>
          <div className="free-actions">
            <button className="btn-ghost" onClick={() => openModal('livre', 'unica')}>
              Contribuição única
            </button>
            <button className="btn-ghost" onClick={() => openModal('livre', 'mensal')}>
              Contribuição mensal
            </button>
          </div>
        </div>
      </section>

      {/* 8. FECHAMENTO */}
      <section className="mission-section closing-section" ref={setRef}>
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
          <p className="highlight">Ajude-nos a chegar até essa pessoa.</p>
        </div>

        <div className="reveal delay-500" style={{marginTop: '6rem'}}>
          <button className="btn-primary large" onClick={() => openModal()}>
            FAZER PARTE DA MISSÃO
          </button>
        </div>

        <div className="transparency-note reveal delay-600">
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

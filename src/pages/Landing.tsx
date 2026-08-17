import { useState, useEffect, useRef } from 'react';
import './Landing.css';
import { PrincipleView } from '../components/PrincipleView';
import { leadService } from '../services/leadService';
import type { Devotional } from '../types/Devotional';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await leadService.submitLead({ name, email });
      alert('E-mail cadastrado com sucesso! Em breve entraremos em contato.');
      setName('');
      setEmail('');
    } catch (err: any) {
      alert(err.message || 'Ocorreu um erro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startApp = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">3 Minutes for Life</div>
        <nav className="landing-nav">
          <a href="#como-funciona">Como funciona</a>
          <a href="#sobre">Sobre</a>
          <a href="#apoie">Apoie o projeto</a>
          <button className="btn-start-nav" onClick={startApp}>
            Começar
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="landing-hero" ref={setRef}>
        <div className="hero-content reveal">
          <h1 className="hero-title">Três minutos para olhar a vida com mais atenção.</h1>
          <p className="hero-subtitle">
            Uma reflexão por dia para parar, pensar sobre a vida e perceber o que merece sua atenção.
          </p>
          <div className="hero-actions">
            <button className="btn-start" onClick={startApp}>
              Começar gratuitamente
            </button>
            <span className="hero-hint" style={{ display: 'block', marginTop: '1rem', opacity: 0.7 }}>Sem cadastro para experimentar.</span>
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
                label: 'Quero começar minha jornada',
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
            <span className="attention-kicker">Por que três minutos?</span>
            <h3 className="tension-title">Seu dia já<br/>está cheio.</h3>
          </div>
          <div className="tension-right reveal delay-200">
            <p className="tension-paragraph">
              Mensagens, trabalho, notícias, decisões, preocupações. E sempre aparece mais uma coisa.
            </p>
            <p className="tension-paragraph">
              No meio de tudo isso, é fácil passar o dia inteiro reagindo ao que acontece e quase nunca parar para perceber o que está acontecendo dentro de nós.
            </p>
          </div>
        </div>
      </section>

      {/* É por isso que existem três minutos. */}
      <section className="relief-section" ref={setRef}>
        <div className="relief-content reveal">
          <h2 className="relief-statement">É por isso que existem três minutos.</h2>
          <p className="relief-subtext">
            Um pequeno espaço no dia para parar, pensar e prestar atenção à vida que está acontecendo agora.
          </p>
        </div>
      </section>

      {/* Pare. Reflita. Pratique. */}
      <section id="como-funciona" className="experience-image-section" ref={setRef}>
        <div className="experience-cards-grid">
          <div className="experience-card-item reveal delay-100">
            <h3 className="step-title">Pare.</h3>
            <p className="step-desc">Respire.<br/>Diminua o ritmo.<br/>Preste atenção.</p>
          </div>
          <div className="experience-card-item reveal delay-200">
            <h3 className="step-title">Reflita.</h3>
            <p className="step-desc">Uma ideia.<br/>Uma pergunta.<br/>Um novo olhar.</p>
          </div>
          <div className="experience-card-item reveal delay-300">
            <h3 className="step-title">Pratique.</h3>
            <p className="step-desc">Leve a reflexão para a vida real.</p>
          </div>
        </div>
      </section>

      {/* Citação */}
      <section className="quote-section" ref={setRef}>
        <p style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--landing-text-light)', marginBottom: '2rem' }} className="reveal">
          Uma pausa pode mudar a maneira como você vê o dia.
        </p>
        <div className="perceived-statement reveal delay-100" style={{ margin: 0 }}>
          A vida não precisa de mais velocidade.<br />
          Precisa de mais atenção.
        </div>
      </section>

      {/* O que orienta o seu olhar? */}
      <section className="split-section" ref={setRef}>
        <div className="split-image reveal"></div>
        <div className="split-content reveal delay-200">
          <h2 className="split-title">O que orienta o seu olhar?</h2>
          <p className="split-text">
            A fé cristã está no coração do 3 Minutes for Life. Ela nos convida a olhar para nossas escolhas, nossos relacionamentos, nossos desafios e nosso propósito à luz de Deus e dos ensinamentos de Jesus.
          </p>
          <p className="split-text">
            Não para oferecer respostas prontas, mas para abrir espaço para perguntas que realmente importam.
          </p>
        </div>
      </section>

      {/* Para quem é */}
      <section id="sobre" className="audience-section" ref={setRef}>
        <div className="audience-grid">
          <div className="audience-lead reveal">
            <h2>Para quem quer viver com mais intenção.</h2>
          </div>
          <div className="audience-list reveal delay-200">
            <p>Para quem está diante de uma decisão.</p>
            <p>Para quem precisa desacelerar.</p>
            <p>Para quem quer cuidar melhor dos seus relacionamentos.</p>
            <p>Para quem trabalha e lidera.</p>
            <p>Para quem busca mais sentido.</p>
            <p>Para quem simplesmente precisa de alguns minutos para pensar.</p>
          </div>
        </div>
      </section>

      {/* Citação Resumo */}
      <section className="quote-section" ref={setRef} style={{ padding: '6rem var(--spacing-lg)' }}>
        <div className="perceived-statement reveal">
          Três minutos.<br />
          Uma reflexão.<br />
          Um pequeno passo.
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--landing-text-light)', fontStyle: 'italic', marginTop: '4rem' }} className="reveal delay-100">
          Mais atenção para a vida que você já está vivendo.
        </p>
      </section>

      {/* Sustentabilidade */}
      <section id="apoie" className="sustainability-section" ref={setRef}>
        <div className="sustainability-container reveal">
          <h2 className="sustainability-title">Um projeto gratuito, sustentado por pessoas</h2>
          
          <div className="sustainability-grid">
            <div className="sustainability-text">
              <p>O 3 Minutes for Life nasceu para que qualquer pessoa possa encontrar, todos os dias, alguns minutos para parar, refletir e olhar a vida com mais atenção.</p>
              <p>Por isso, o acesso ao conteúdo é gratuito.</p>
              <p>Não queremos que a capacidade de pagar determine quem pode receber uma reflexão.</p>
              <p>O projeto é sustentado por pessoas que acreditam nessa proposta e escolhem contribuir voluntariamente para que ele continue existindo, seja mantido e possa alcançar mais pessoas.</p>
              <p>Você não precisa contribuir para usar. O apoio é voluntário e não altera o acesso ao conteúdo ou às funcionalidades essenciais do 3 Minutes for Life.</p>
              <p>Se, em algum momento, você sentir que vale a pena ajudar, poderá fazer parte da sustentabilidade do projeto.</p>
              
              <button className="btn-support" onClick={() => window.location.href = '/missao'}>
                Apoiar o projeto
              </button>
            </div>
            
            <div className="sustainability-breakdown">
              <h3>Para onde vai o apoio?</h3>
              <p>As contribuições ajudam a manter e desenvolver o projeto.</p>
              
              <ul className="breakdown-list">
                <li>
                  <strong>Conteúdo</strong>
                  <span>Produção, revisão e desenvolvimento das reflexões.</span>
                </li>
                <li>
                  <strong>Tecnologia</strong>
                  <span>Aplicativos, servidores, banco de dados e infraestrutura.</span>
                </li>
                <li>
                  <strong>Alcance</strong>
                  <span>Comunicação e iniciativas para que mais pessoas conheçam o projeto.</span>
                </li>
                <li>
                  <strong>Desenvolvimento</strong>
                  <span>Novos conteúdos, recursos e possibilidades para ampliar a experiência.</span>
                </li>
              </ul>
              <p className="breakdown-note">À medida que o projeto crescer, queremos compartilhar com transparência como os recursos são utilizados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Captação de Lead */}
      <section className="lead-section" ref={setRef}>
        <div className="perceived-statement reveal" style={{ fontSize: '3rem', margin: '0 auto 6rem' }}>
          Estamos começando.
        </div>
        <p className="lead-subtitle reveal delay-100">
          Nesta primeira fase, estamos reunindo um pequeno grupo de pessoas para experimentar o 3 Minutes for Life, receber uma reflexão por dia e nos ajudar a construir uma experiência cada vez melhor.
        </p>
        <h2 className="lead-title reveal delay-200" style={{ marginTop: '4rem', fontSize: '2rem' }}>Quer fazer parte do começo?</h2>
        
        <form className="lead-form reveal delay-300" onSubmit={handleLeadSubmit}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Nome" 
            value={name}
            onChange={e => setName(e.target.value)}
            required 
          />
          <input 
            type="email" 
            className="form-input" 
            placeholder="E-mail" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <label style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', textAlign: 'left', margin: '1rem 0', alignItems: 'flex-start' }}>
            <input type="checkbox" required style={{ marginTop: '4px' }} />
            <span>Quero participar dos testes e receber novidades sobre o 3 Minutes for Life.</span>
          </label>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            Quero participar
          </button>
        </form>
      </section>

      {/* FAQ */}
      <section className="faq-section" ref={setRef}>
        <h2 className="faq-title reveal">Perguntas frequentes</h2>
        <div className="faq-grid">
          <div className="faq-item reveal delay-100">
            <h3 className="faq-question">O 3 Minutes for Life é gratuito?</h3>
            <p className="faq-answer">Sim. O acesso ao conteúdo principal é gratuito. O projeto é sustentado por pessoas que escolhem apoiá-lo voluntariamente.</p>
          </div>
          <div className="faq-item reveal delay-200">
            <h3 className="faq-question">Preciso ser cristão para usar?</h3>
            <p className="faq-answer">Não. O 3 Minutes for Life parte de uma perspectiva cristã, mas foi criado para conversar com qualquer pessoa que queira parar, refletir e olhar para a vida com mais atenção.</p>
          </div>
          <div className="faq-item reveal delay-300">
            <h3 className="faq-question">Quanto tempo preciso por dia?</h3>
            <p className="faq-answer">A proposta é levar aproximadamente três minutos.</p>
          </div>
          <div className="faq-item reveal delay-400">
            <h3 className="faq-question">Preciso instalar um aplicativo?</h3>
            <p className="faq-answer">A plataforma funciona diretamente no navegador e pode ser adicionada à tela inicial do celular como um aplicativo.</p>
          </div>
          <div className="faq-item reveal delay-500">
            <h3 className="faq-question">O conteúdo é gerado por inteligência artificial?</h3>
            <p className="faq-answer">Não. O conteúdo é escrito e revisado editorialmente por pessoas, para preservar uma voz humana, simples e consistente.</p>
          </div>
          <div className="faq-item reveal delay-600">
            <h3 className="faq-question">Como posso apoiar o projeto?</h3>
            <p className="faq-answer">O conteúdo é gratuito. Se você quiser contribuir voluntariamente para a continuidade e expansão do projeto, poderá conhecer as formas de apoio disponibilizadas pelo 3 Minutes for Life. O apoio não é necessário para acessar o conteúdo.</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final" ref={setRef}>
        <h2 className="cta-final-title reveal">Reserve três minutos.</h2>
        <p className="cta-final-subtitle reveal delay-100">Pare. Reflita. Viva.</p>
        <div className="reveal delay-200">
          <button className="btn-start" onClick={startApp}>
            Começar hoje
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-signature">3 Minutes for Life</div>
        <div className="footer-content">
          <p className="footer-tagline">Três minutos para olhar a vida com mais atenção.</p>
          <div className="footer-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#sobre">Sobre</a>
            <a href="#apoie">Apoie o projeto</a>
            <a href="#">Privacidade</a>
            <a href="#">Termos</a>
            <a href="#">Contato</a>
          </div>
          <p className="footer-copy">© 2026 3 Minutes for Life</p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import './Landing.css';
import { PrincipleView } from '../components/PrincipleView';

export function Landing() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mockPrinciple = {
    id: 9999,
    title: 'Você está brigando com a realidade?',
    principle: 'A mudança começa quando reconhecemos a realidade como ela é.',
    reflection: 'Todos nós já gastamos energia desejando que uma situação fosse diferente. Ficamos pensando no que poderia ter acontecido, no que alguém deveria ter feito ou em como gostaríamos que as coisas fossem. Enquanto isso, a realidade continua diante de nós, esperando que façamos alguma coisa com ela.\n\nAceitar a realidade não significa gostar dela, concordar com ela ou desistir de mudá-la. Significa reconhecer onde estamos para descobrir o que podemos fazer a partir daí.\n\nE há coisas que simplesmente não estão sob nosso controle. É nesse limite que a fé pode nos ensinar um novo caminho. A fé cristã nos lembra que não precisamos controlar tudo para seguir em frente. Podemos entregar a Deus aquilo que não conseguimos mudar e voltar nossa atenção para aquilo que está ao nosso alcance.\n\nPor isso, talvez a pergunta de hoje não seja “por que isso aconteceu?”, mas “o que posso fazer a partir daqui?”',
    application: 'Pense em uma situação que tem trazido frustração. Separe o que você pode mudar daquilo que não está sob seu controle.\n\nEscolha uma coisa que está ao seu alcance e dê hoje um pequeno passo.',
    category: 'Uma reflexão para hoje',
    date: new Date().toISOString()
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    alert('A integração com o serviço de e-mail será ativada em breve. Seu e-mail não foi armazenado nesta demonstração.');
    setIsSubmitting(false);
  };

  const startApp = () => {
    window.location.href = '/app';
  };

  return (
    <div className="landing-page">
      {/* 1. Header Minimalista */}
      <header className="landing-header">
        <div className="landing-logo">3 Minutes for Life</div>
        <nav className="landing-nav">
          <a href="#como-funciona">Como funciona</a>
          <a href="#sobre">Sobre</a>
          <button className="btn-start-nav" onClick={startApp}>
            Começar
          </button>
        </nav>
      </header>

      {/* 2. Hero Editorial */}
      <section className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">Três minutos para olhar a vida com mais atenção.</h1>
          <p className="hero-subtitle">
            Uma reflexão por dia para parar, pensar no que realmente importa e levar algo para a vida.
          </p>
          <div className="hero-actions">
            <button className="btn-start" onClick={startApp}>
              Começar gratuitamente
            </button>
            <span className="hero-hint">Sem cadastro para começar.</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-mockup-wrapper">
            {/* Componente real rodando em modo visualização */}
            <PrincipleView 
              principle={mockPrinciple} 
              customAction={{ label: 'Experimentar esta reflexão', onClick: startApp }} 
            />
          </div>
        </div>
      </section>

      {/* 3. Disputa de Atenção */}
      <section className="attention-section">
        <h2 className="attention-intro">O mundo disputa sua atenção.</h2>
        <div className="attention-list">
          <span className="attention-item">Seu celular.</span>
          <span className="attention-item">Suas mensagens.</span>
          <span className="attention-item">Seu trabalho.</span>
          <span className="attention-item">Suas preocupações.</span>
          <span className="attention-item">E sempre aparece mais uma coisa.</span>
        </div>
        <h3 className="attention-conclusion">Às vezes, você só precisa de três minutos.</h3>
      </section>

      {/* 4. Experiência Visual */}
      <section id="como-funciona" className="experience-section">
        <div className="step-block">
          <span className="step-number">01 — Pare.</span>
          <p className="step-desc">Respire. Diminua o ritmo. Preste atenção.</p>
        </div>
        <div className="step-block">
          <span className="step-number">02 — Reflita.</span>
          <p className="step-desc">Uma ideia. Uma pergunta. Um novo olhar.</p>
        </div>
        <div className="step-block">
          <span className="step-number">03 — Pratique.</span>
          <p className="step-desc">Leve algo para a vida real.</p>
        </div>
      </section>

      {/* 5. Imagem Intercalar de Respiro */}
      <div className="image-break"></div>

      {/* 6. Citação Tipográfica */}
      <section className="quote-section">
        <h2 className="quote-text">
          A vida não precisa de mais velocidade.<br />
          Talvez precise de mais atenção.
        </h2>
      </section>

      {/* 7. Além do que vemos (Perspectiva Cristã Sutil) */}
      <section className="split-section">
        <div className="split-image"></div>
        <div className="split-content">
          <h2 className="split-title">Além do que vemos</h2>
          <p className="split-text">
            O 3 Minutes for Life também nasce de uma convicção cristã: existe um sentido maior para a vida, mesmo quando não conseguimos entender tudo o que acontece.
          </p>
          <p className="split-text">
            Por isso, algumas reflexões apresentam ensinamentos de Jesus e princípios das Escrituras.
          </p>
          <p className="split-text" style={{ fontWeight: 500, color: 'var(--landing-text)' }}>
            Você não precisa ser cristão para começar. Basta estar disposto a parar, pensar e considerar uma nova perspectiva.
          </p>
        </div>
      </section>

      {/* 8. Para Quem É */}
      <section id="sobre" className="audience-section">
        <h2 className="audience-title">Para quem é o 3 Minutes for Life?</h2>
        <div className="audience-list">
          <span style={{ marginBottom: '1rem', color: 'var(--landing-bg)' }}>Para você que:</span>
          <span>Está tentando tomar uma decisão.</span>
          <span>Precisa desacelerar.</span>
          <span>Quer melhorar seus relacionamentos.</span>
          <span>Deseja trabalhar e liderar melhor.</span>
          <span>Está buscando mais sentido.</span>
          <span>Ou simplesmente quer alguns minutos para pensar.</span>
        </div>
      </section>

      {/* 9. Citação Final Tipográfica */}
      <section className="quote-section">
        <h2 className="quote-text">
          Três minutos.<br />
          Uma reflexão.<br />
          Um pequeno passo.
        </h2>
      </section>

      {/* 10. Captação de Lead */}
      <section className="lead-section">
        <h2 className="lead-title">Quer fazer parte do começo?</h2>
        <p className="lead-subtitle">
          Estamos convidando um pequeno grupo de pessoas para experimentar o 3 Minutes for Life nesta primeira fase e nos ajudar a melhorar a experiência.
        </p>
        <form className="lead-form" onSubmit={handleLeadSubmit}>
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
          <label style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', textAlign: 'left', marginTop: '8px' }}>
            <input type="checkbox" required />
            Quero participar dos testes e receber novidades sobre o 3 Minutes for Life.
          </label>
          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            Quero participar
          </button>
        </form>
      </section>

      {/* 11. FAQ */}
      <section className="faq-section">
        <h2 className="faq-title">Perguntas frequentes</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3 className="faq-question">O 3 Minutes for Life é gratuito?</h3>
            <p className="faq-answer">Durante a fase inicial de testes, o acesso ao MVP será gratuito.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">Preciso ser cristão para usar?</h3>
            <p className="faq-answer">Não. O conteúdo parte de uma perspectiva cristã, mas é escrito para conversar com qualquer pessoa interessada em refletir sobre a vida.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">Quanto tempo preciso por dia?</h3>
            <p className="faq-answer">A proposta é levar aproximadamente três minutos.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">Preciso instalar um aplicativo?</h3>
            <p className="faq-answer">O MVP funciona diretamente no navegador e pode ser adicionado à tela inicial do celular como um aplicativo.</p>
          </div>
          <div className="faq-item">
            <h3 className="faq-question">O conteúdo é gerado por inteligência artificial?</h3>
            <p className="faq-answer">Não. O conteúdo é escrito e revisado editorialmente por pessoas, para preservar uma voz humana, simples e consistente.</p>
          </div>
        </div>
      </section>

      {/* 12. CTA Final */}
      <section className="cta-final">
        <h2 className="cta-final-title">Reserve três minutos para você.</h2>
        <p className="cta-final-subtitle">Pare. Reflita. Viva.</p>
        <button className="btn-start" onClick={startApp}>
          Começar hoje
        </button>
      </section>

      {/* 13. Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">3 Minutes for Life</div>
        <p className="footer-tagline">Três minutos para parar, refletir e viver melhor.</p>
        <div className="footer-links">
          <a href="#">Sobre</a>
          <a href="#">Privacidade</a>
          <a href="#">Termos</a>
          <a href="#">Contato</a>
        </div>
        <p className="footer-copy">© 2026 3 Minutes for Life</p>
      </footer>
    </div>
  );
}

import { BrandLogo } from '../components/BrandLogo';
import './Landing.css';
import './Legal.css';

/**
 * Termos de Uso.
 *
 * ATENÇÃO: ponto de partida técnico, não parecer jurídico. Precisa de
 * revisão por profissional habilitado antes de publicar, e os campos
 * [DEFINIR] precisam ser preenchidos.
 */
export function Terms() {
  return (
    <div className="legal-page">

      <header className="landing-header">
        <a href="/" className="landing-logo" aria-label="3 Minutes for Life">
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
      </header>

      <main className="legal-content">
        <h1>Termos de Uso</h1>
        <p className="legal-updated">Última atualização: 25 de agosto de 2026</p>

        <p className="legal-lead">
          Ao usar o 3 Minutes for Life, você concorda com os termos abaixo.
          Escrevemos da forma mais direta possível.
        </p>

        <h2>O que é o 3 Minutes for Life</h2>
        <p>
          Uma plataforma que publica uma reflexão diária, a partir de uma
          perspectiva cristã, com o propósito de oferecer um momento de pausa.
          O acesso ao conteúdo principal é gratuito.
        </p>

        <h2>O que não é</h2>
        <p>
          O conteúdo tem caráter reflexivo e espiritual. <strong>Não substitui
          acompanhamento profissional</strong> de saúde mental, médico, jurídico
          ou financeiro. Se você estiver passando por sofrimento intenso, procure
          ajuda profissional. No Brasil, o CVV atende gratuitamente pelo
          telefone 188, 24 horas por dia.
        </p>

        <h2>Sua conta</h2>
        <ul>
          <li>Você é responsável por manter sua senha em segurança.</li>
          <li>As informações que você fornece devem ser verdadeiras.</li>
          <li>A conta é pessoal e não deve ser compartilhada.</li>
          <li>Você pode encerrar sua conta quando quiser, escrevendo para o nosso contato.</li>
        </ul>

        <h2>O que você envia</h2>
        <p>
          Pedidos de oração, testemunhos e reflexões pessoais continuam sendo
          seus. Ao enviar um pedido de oração ou testemunho, você autoriza que a
          equipe responsável leia e responda.
        </p>
        <p>
          Testemunhos podem ser publicados de forma anônima ou identificada,
          sempre mediante sua autorização específica. Reflexões pessoais nunca
          são publicadas.
        </p>
        <p>Não é permitido enviar conteúdo que:</p>
        <ul>
          <li>viole leis ou direitos de terceiros;</li>
          <li>contenha discurso de ódio, ameaça ou assédio;</li>
          <li>divulgue dados pessoais de outras pessoas sem autorização;</li>
          <li>tenha finalidade comercial ou de divulgação não autorizada.</li>
        </ul>
        <p>
          Podemos remover conteúdo que viole estes termos e, em casos graves,
          encerrar a conta.
        </p>

        <h2>Conteúdo da plataforma</h2>
        <p>
          Os textos, imagens e a identidade visual do 3 Minutes for Life são
          protegidos por direitos autorais. Você pode compartilhar as reflexões
          usando as ferramentas da própria plataforma. Reprodução para outros
          fins depende de autorização prévia.
        </p>

        <h2>Contribuições</h2>
        <p>
          O acesso ao conteúdo principal é gratuito e não depende de
          contribuição. Contribuições são voluntárias e destinam-se a sustentar
          e expandir o projeto.
        </p>
        <ul>
          <li>Os pagamentos são processados pelo Asaas.</li>
          <li>Contribuições recorrentes podem ser canceladas a qualquer momento; o cancelamento vale a partir do próximo ciclo.</li>
          <li>Contribuições já efetuadas não são reembolsáveis, salvo erro comprovado ou exigência legal.</li>
          <li>Contribuir não gera direito a conteúdo exclusivo nem a qualquer contrapartida além do apoio ao projeto.</li>
        </ul>

        <h2>Disponibilidade</h2>
        <p>
          Trabalhamos para manter a plataforma disponível, mas não garantimos
          funcionamento ininterrupto. Podem ocorrer interrupções por manutenção
          ou fatores fora do nosso controle.
        </p>

        <h2>Limitação de responsabilidade</h2>
        <p>
          O conteúdo é oferecido no estado em que se encontra. Não nos
          responsabilizamos por decisões tomadas com base nas reflexões
          publicadas. Nossa responsabilidade limita-se ao previsto na
          legislação aplicável.
        </p>

        <h2>Alterações</h2>
        <p>
          Estes termos podem ser atualizados. Mudanças relevantes serão
          comunicadas pelos canais que você autorizou, e a data no topo desta
          página será atualizada.
        </p>

        <h2>Lei aplicável</h2>
        <p>
          Estes termos são regidos pela lei brasileira. Fica eleito o foro de
          [DEFINIR: comarca] para dirimir questões deles decorrentes.
        </p>

        <p className="legal-contact">
          Dúvidas sobre estes termos:{' '}
          <a href="mailto:atendimento@3minutesforlife.com">atendimento@3minutesforlife.com</a>
        </p>
      </main>

      <footer className="legal-footer">
        <a href="/">Página inicial</a>
        <a href="/privacidade">Política de privacidade</a>
        <a href="mailto:atendimento@3minutesforlife.com">Contato</a>
      </footer>

    </div>
  );
}

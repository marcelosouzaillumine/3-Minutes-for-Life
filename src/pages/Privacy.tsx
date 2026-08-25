import { BrandLogo } from '../components/BrandLogo';
import './Landing.css';
import './Legal.css';

/**
 * Política de Privacidade.
 *
 * O conteúdo descreve o que o código de fato faz — os dados listados
 * foram levantados das tabelas reais do projeto, não de modelo pronto.
 *
 * ATENÇÃO: este texto é um ponto de partida técnico, não um parecer
 * jurídico. Antes de publicar, precisa ser revisado por alguém
 * habilitado, e os campos marcados com [DEFINIR] precisam ser
 * preenchidos.
 */
export function Privacy() {
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
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Última atualização: 25 de agosto de 2026</p>

        <p className="legal-lead">
          Esta política explica quais dados o 3 Minutes for Life coleta, por que
          coleta e o que você pode fazer a respeito. Escrevemos em linguagem
          direta, sem termos desnecessários.
        </p>

        <h2>Quem é responsável pelos seus dados</h2>
        <p>
          O responsável pelo tratamento dos dados descritos aqui é
          [DEFINIR: razão social e CNPJ, ou nome do responsável], que pode ser
          contatado pelo e-mail{' '}
          <a href="mailto:atendimento@3minutesforlife.com">atendimento@3minutesforlife.com</a>.
        </p>

        <h2>Que dados coletamos</h2>

        <h3>Quando você cria uma conta</h3>
        <ul>
          <li>Nome</li>
          <li>E-mail</li>
          <li>Telefone, quando informado</li>
          <li>País, estado e cidade, quando informados</li>
          <li>Senha, armazenada de forma criptografada — nunca temos acesso a ela</li>
        </ul>

        <h3>Quando você usa a plataforma</h3>
        <ul>
          <li>Reflexões pessoais que você escreve, visíveis apenas para você</li>
          <li>Reflexões que você salva como favoritas</li>
          <li>Registro de quais reflexões você abriu e concluiu</li>
          <li>Pedidos de oração e testemunhos que você envia</li>
          <li>Suas preferências de comunicação</li>
        </ul>

        <h3>Quando você contribui financeiramente</h3>
        <p>
          Os dados de pagamento são processados pelo Asaas e{' '}
          <strong>não passam pelos nossos servidores</strong>. Guardamos apenas o
          registro de que houve uma contribuição e seu status, para manter seu
          apoio ativo.
        </p>

        <h3>Automaticamente</h3>
        <p>
          Registramos eventos de uso — como abertura e compartilhamento de
          reflexões — associados a um identificador anônimo do seu navegador e,
          se você estiver com a conta iniciada, ao seu usuário. Usamos isso para
          entender como o projeto está sendo usado, em números agregados.
        </p>

        <h2>Por que coletamos</h2>
        <ul>
          <li><strong>Para manter sua conta</strong> e permitir que você acesse o conteúdo e retome de onde parou.</li>
          <li><strong>Para responder</strong> aos pedidos de oração e testemunhos que você nos envia.</li>
          <li><strong>Para melhorar o projeto</strong>, entendendo em números agregados o que é lido e o que não é.</li>
          <li><strong>Para comunicar novidades e convites de apoio</strong> — apenas se você autorizou.</li>
        </ul>

        <h2>Conteúdo sensível</h2>
        <p>
          Pedidos de oração e reflexões pessoais podem conter informação íntima.
          Tratamos esse conteúdo com cuidado específico: pedidos de oração são
          acessíveis apenas à equipe responsável pelo acompanhamento, e suas
          reflexões pessoais não são acessíveis a ninguém além de você.
        </p>

        <h2>Com quem compartilhamos</h2>
        <p>
          Não vendemos seus dados. Não os cedemos para publicidade. Usamos os
          seguintes serviços para operar a plataforma:
        </p>
        <ul>
          <li><strong>Supabase</strong> — banco de dados e autenticação</li>
          <li><strong>Vercel</strong> — hospedagem do site</li>
          <li><strong>Asaas</strong> — processamento de pagamentos</li>
          <li><strong>OpenAI</strong> — tradução automática do conteúdo editorial. Seus dados pessoais e seus pedidos de oração não são enviados a este serviço.</li>
        </ul>

        <h2>Comunicações</h2>
        <p>
          Só enviamos novidades e convites de apoio para quem autorizou, e você
          pode alterar essa escolha a qualquer momento em Perfil → Preferências
          de comunicação. Respostas aos seus pedidos de oração e testemunhos não
          são comunicação de divulgação — decorrem de um contato que você
          iniciou — mas também podem ser desativadas ali.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          Mantemos seus dados enquanto sua conta existir. Registros de
          consentimento são preservados mesmo após revogação, porque é o que
          comprova quando cada escolha foi feita. Dados relacionados a
          contribuições são mantidos pelo prazo exigido pela legislação fiscal.
        </p>

        <h2>Seus direitos</h2>
        <p>
          A Lei Geral de Proteção de Dados garante a você o direito de confirmar
          se tratamos seus dados, acessá-los, corrigi-los, solicitar sua exclusão,
          revogar consentimentos e pedir a portabilidade. Para exercer qualquer
          um deles, escreva para{' '}
          <a href="mailto:atendimento@3minutesforlife.com">atendimento@3minutesforlife.com</a>.
        </p>
        <p>
          A exclusão da conta remove seus dados pessoais, reflexões e pedidos.
          Registros exigidos por lei e dados já anonimizados permanecem.
        </p>

        <h2>Menores de idade</h2>
        <p>
          O 3 Minutes for Life não é destinado a menores de 13 anos. Entre 13 e
          18 anos, o uso deve acontecer com consentimento dos responsáveis.
        </p>

        <h2>Mudanças nesta política</h2>
        <p>
          Se alterarmos esta política de forma relevante, avisaremos pelos canais
          que você autorizou e atualizaremos a data no topo desta página.
        </p>

        <p className="legal-contact">
          Dúvidas sobre privacidade:{' '}
          <a href="mailto:atendimento@3minutesforlife.com">atendimento@3minutesforlife.com</a>
        </p>
      </main>

      <footer className="legal-footer">
        <a href="/">Página inicial</a>
        <a href="/termos">Termos de uso</a>
        <a href="mailto:atendimento@3minutesforlife.com">Contato</a>
      </footer>

    </div>
  );
}

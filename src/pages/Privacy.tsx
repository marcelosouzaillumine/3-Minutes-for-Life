import { BrandLogo } from '../components/BrandLogo';
import { useTenantBranding } from '../hooks/useTenantBranding';
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
 * habilitado.
 */
export function Privacy() {
  const branding = useTenantBranding();
  const contactEmail = branding?.contactEmail || 'atendimento@3minutesforlife.com';
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
        <p className="legal-updated">Última atualização: 3 de novembro de 2026</p>

        <p className="legal-lead">
          Esta política explica quais dados o 3 Minutes for Life coleta, por que
          coleta e o que você pode fazer a respeito. Escrevemos em linguagem
          direta, sem termos desnecessários.
        </p>

        <h2>Quem é responsável pelos seus dados</h2>
        <p>
          O controlador dos dados descritos aqui é a{' '}
          <strong>Illumine Ltda.</strong>, CNPJ 02.758.586/0001-83, com sede na
          Travessa João Bom, nº 154, Centro Cívico, Curitiba/PR, CEP 80.540-300.
        </p>
        <p>
          A pessoa responsável pelo tratamento dos dados pessoais e pelo
          atendimento aos seus pedidos é <strong>Marcelo Souza</strong>, que pode
          ser contatado pelo e-mail{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>

        <h2>Que dados coletamos</h2>

        <h3>Quando você cria uma conta</h3>
        <ul>
          <li>Nome</li>
          <li>E-mail</li>
          <li>Telefone, quando informado (e o seu consentimento para receber mensagens por WhatsApp, quando você der)</li>
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

        <h3>Quando você usa grupos e a leitura com crianças</h3>
        <ul>
          <li>O grupo que você cria ou em que entra (nome do grupo e quem participa), por convite em link ou código</li>
          <li>Se você leu o devocional do dia e a sequência de dias de leitura do grupo, que os outros participantes do grupo conseguem ver</li>
          <li>Mensagens que você publica no mural de oração do grupo, visíveis apenas para os participantes desse grupo</li>
          <li>O modo como você lê (sozinho, em grupo ou com crianças)</li>
        </ul>
        <p>
          A sua conta é pessoal e não é compartilhada. O que o grupo
          compartilha é a interação em torno do devocional, não os seus dados
          pessoais: seu e-mail, telefone, localização e reflexões pessoais não
          aparecem para os outros participantes.
        </p>

        <h3>Perfis de crianças</h3>
        <p>
          Para ler com crianças, o adulto responsável pode informar um nome ou
          apelido e a faixa de idade, apenas como referência para mostrar a
          versão do devocional adequada. <strong>Não coletamos foto, data de
          nascimento, documentos, localização nem qualquer outro dado das
          crianças.</strong> Recomendamos usar só um apelido. Esse perfil
          pertence à conta do adulto responsável e pode ser removido por ele a
          qualquer momento.
        </p>

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
          reflexões, o modo de leitura (individual, grupo ou crianças) e as
          faixas de idade escolhidas — associados a um identificador anônimo do
          seu navegador e, se você estiver com a conta iniciada, ao seu usuário. Usamos isso para
          entender como o projeto está sendo usado, em números agregados.
        </p>

        <h2>Por que coletamos</h2>
        <ul>
          <li><strong>Para manter sua conta</strong> e permitir que você acesse o conteúdo e retome de onde parou.</li>
          <li><strong>Para responder</strong> aos pedidos de oração e testemunhos que você nos envia.</li>
          <li><strong>Para melhorar o projeto</strong>, entendendo em números agregados o que é lido e o que não é.</li>
          <li><strong>Para permitir a leitura em grupo e com crianças</strong>, mostrando ao grupo o andamento da leitura e o mural de oração.</li>
          <li><strong>Para comunicar novidades, lembretes e convites de apoio</strong>, por e-mail ou WhatsApp — apenas se você autorizou.</li>
        </ul>

        <h2>Conteúdo sensível</h2>
        <p>
          Pedidos de oração e reflexões pessoais podem conter informação íntima.
          Tratamos esse conteúdo com cuidado específico:
        </p>
        <ul>
          <li><strong>Pedidos de oração enviados à equipe</strong> são acessíveis apenas à equipe responsável pelo acompanhamento.</li>
          <li><strong>Mensagens no mural de oração de um grupo</strong> são acessíveis apenas aos participantes daquele grupo. Escreva ali só o que se sentir à vontade de compartilhar com eles.</li>
          <li><strong>Reflexões pessoais</strong> não são acessíveis a ninguém além de você.</li>
        </ul>

        <h2>Com quem compartilhamos</h2>
        <p>
          Não vendemos seus dados. Não os cedemos para publicidade. Usamos os
          seguintes serviços para operar a plataforma:
        </p>
        <ul>
          <li><strong>Illumine OS (Illumine Ltda.)</strong> — plataforma própria de banco de dados, autenticação e serviços do aplicativo, hospedada na Railway</li>
          <li><strong>Railway</strong> — infraestrutura onde roda a plataforma Illumine OS</li>
          <li><strong>Vercel</strong> — hospedagem do site</li>
          <li><strong>WhatsApp (Meta)</strong> — envio das mensagens que você autorizar receber</li>
          <li><strong>Asaas</strong> — processamento de pagamentos</li>
          <li><strong>Google (Gemini)</strong> — tradução automática do conteúdo editorial. Seus dados pessoais e seus pedidos de oração não são enviados a este serviço.</li>
          <li><strong>Google</strong> — fontes de letra exibidas no site (o seu endereço IP é visto pelo Google ao carregá-las) e o login com Google, quando você escolhe usá-lo</li>
        </ul>

        <h2>Comunicações</h2>
        <p>
          Só enviamos novidades, lembretes e convites de apoio para quem
          autorizou, e você pode alterar essa escolha a qualquer momento em
          Perfil → Preferências de comunicação. Respostas aos seus pedidos de oração e testemunhos não
          são comunicação de divulgação — decorrem de um contato que você
          iniciou — mas também podem ser desativadas ali.
        </p>

        <h3>WhatsApp</h3>
        <p>
          Só enviamos mensagens por WhatsApp se você der o seu consentimento
          específico para isso, separado do cadastro e das demais comunicações.
          Usamos o seu número para lembretes do devocional, avisos do grupo e
          novidades do projeto. Você pode revogar o consentimento a qualquer
          momento, em Perfil → Preferências de comunicação ou pelo e-mail de
          contato, e deixaremos de enviar.
        </p>

        <h2>Por quanto tempo guardamos</h2>
        <p>
          Mantemos seus dados enquanto sua conta existir. Registros de
          consentimento são preservados mesmo após revogação, porque é o que
          comprova quando cada escolha foi feita. Dados relacionados a
          contribuições são mantidos pelo prazo exigido pela legislação fiscal.
        </p>
        <p>
          Você mesmo exclui a conta em Perfil › Seus dados, e também pode baixar
          uma cópia dos seus dados ali. A exclusão é imediata: seus dados —
          incluindo participações em grupos, perfis de crianças e mensagens no
          mural de oração — são removidos do sistema em uso, e as cópias de
          segurança (backups) que ainda os contenham são eliminadas em até 3
          dias. Registros de contribuição são mantidos sem identificar você, e
          os de consentimento e aceite dos termos ficam apenas como prova, sem
          dados pessoais. Se preferir, peça pelo e-mail de contato.
        </p>

        <h2>Seus direitos</h2>
        <p>
          A Lei Geral de Proteção de Dados garante a você o direito de confirmar
          se tratamos seus dados, acessá-los, corrigi-los, solicitar sua exclusão,
          revogar consentimentos e pedir a portabilidade. Para exercer qualquer
          um deles, escreva para{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
        <p>
          A exclusão da conta, quando solicitada, remove seus dados pessoais, reflexões e pedidos.
          Registros exigidos por lei e dados já anonimizados permanecem.
        </p>

        <h2>Menores de idade</h2>
        <p>
          Não é permitido criar conta própria no 3 Minutes for Life antes dos 13
          anos. Entre 13 e 18 anos, o uso deve acontecer com consentimento dos
          responsáveis.
        </p>
        <p>
          Crianças de qualquer idade podem participar da leitura sempre
          conduzidas por um adulto responsável, que usa a própria conta. Nesse
          caso, tratamos apenas o nome ou apelido e a faixa de idade que o adulto
          informar, como descrito acima, e nenhum outro dado da criança.
        </p>

        <h2>Mudanças nesta política</h2>
        <p>
          Se alterarmos esta política de forma relevante, avisaremos pelos canais
          que você autorizou e atualizaremos a data no topo desta página.
        </p>

        <p className="legal-contact">
          Dúvidas sobre privacidade:{' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </main>

      <footer className="legal-footer">
        <a href="/">Página inicial</a>
        <a href="/termos">Termos de uso</a>
        <a href={`mailto:${contactEmail}`}>Contato</a>
      </footer>

    </div>
  );
}

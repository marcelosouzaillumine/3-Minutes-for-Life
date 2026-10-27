# ADR-001 — 3 Minutes for Life como serviço de produto independente

**Status:** PROPOSTO, com os pontos em aberto decididos em 2026-10-27 (aguarda confirmação final para iniciar a fase 2). Fase 1 do plano: inventário e decisão. Nenhum código nem infraestrutura foi alterado.
**Data:** 2026-10-26
**Inventário de apoio:** [inventario-3ml-produto-vs-plataforma.md](inventario-3ml-produto-vs-plataforma.md)

## Contexto

Hoje o backend do 3ML é o gateway compartilhado do Illumine OS (`splendid-nourishment`, repositório `illumine-os`). Esse gateway atende também outros produtos (Transforma, rotas finas do EDI) e concentra a plataforma: autenticação, comunicações, WhatsApp, analytics, consentimento, mídia, CRM e pagamentos.

O EDI e o Coetica já têm repositório e serviço próprios. O EDI formalizou o padrão no ADR-001 e no spike S7 do repositório `illumine-edi`: serviço independente, banco próprio, sem importar `@illumine/*`, falando com a plataforma por HTTP.

Objetivos para o 3ML, informados pelo usuário:

1. **White-label:** vender o produto a outros clientes com marca própria.
2. **Isolamento:** código e dados do produto separados da plataforma e dos demais produtos.
3. **Capacidade de venda:** poder comercializar, operar e evoluir o 3ML sem depender do ciclo do monólito.

## Decisão (proposta)

Seguir o padrão do EDI (opção B do spike S7):

1. O produto 3ML passa a ter **repositório e serviço próprios** (`3-minutes-api`) e **banco próprio**.
2. O serviço do produto **não importa** pacotes `@illumine/*` e não compartilha banco, `JWT_SECRET` nem migrations com a plataforma.
3. **Login:** o serviço valida o token chamando o gateway (`GET /users/me`, com cache curto), o que honra logout, suspensão e revogação. Chamadas servidor a servidor usam `TenantApiKey`.
4. **Plataforma continua na plataforma:** auth, usuários, comunicações, WhatsApp, analytics, consentimento, mídia, CRM e pagamentos. O app 3ML continua chamando o gateway para isso.
5. **Produto no serviço do 3ML:** devocionais e traduções, pastoral, reflexões, indicações e a API de parceiros (lista exata no inventário).
6. **White-label:** o produto `3minutes` já está registrado no `PRODUCT_REGISTRY`. O tenant representa o cliente e a marca vem do `Tenant` (`GET /tenants/by-slug/:slug`). O serviço do produto não guarda marca.
7. **Domínio da API de parceiros:** `api.3minutesforlife.com` aponta hoje para o gateway. Quando o serviço do 3ML existir, o domínio passa a apontar para ele, sem mudança para o parceiro.

## Alternativas consideradas

| | Descrição | Avaliação |
|---|---|---|
| A. Importar `@illumine/*` num serviço separado | Pacotes privados, Prisma global | Descartada no EDI: exige mesmo banco, mesmo segredo, mesmas migrations |
| **B. Serviço independente, banco próprio, HTTP** | Padrão do EDI | **Proposta** |
| C. Manter dentro do gateway (`routes/products/3minutes`) | Já existe `devotionals.ts` ali | Não atende isolamento nem venda separada; serve como etapa intermediária |

## Consequências

**Positivas**
- Produto vendável e implantável separadamente; dados do produto isolados por design.
- Plataforma e produto evoluem em ciclos distintos.

**Negativas / riscos**
- **Dados do produto referenciam `User`** (testimonials, orações, leituras, favoritos, reflexões, indicações). Em banco separado a FK deixa de existir: `userId` vira identificador sem integridade referencial, e nome e e-mail do usuário (hoje lidos por join em `pastoral.ts`) precisam vir do gateway ou ser denormalizados.
- **Migração de dados em produção** (fase 3) e **corte do app** (fase 4) são as etapas arriscadas: login, pagamentos e webhooks não podem cair.
- O app passa a falar com dois backends (plataforma e produto).
- Custo operacional de mais um serviço e mais um banco.
- Cada validação de token adiciona uma chamada ao gateway (mitigada por cache curto).

## Decisões tomadas sobre os pontos em aberto (2026-10-27)

1. **Apoiadores/doações:** ficam na **plataforma** (CRM e financeiro: `Donor`, `Donation`, ponte Asaas, webhooks). O serviço e o app do 3ML consomem `/supporters` por HTTP. Motivo: fluxo financeiro e LGPD com dono único, e o white-label herda cobrança pronta pelo tenant. *(Recomendação do assistente, aceita pelo usuário.)*
2. **Tradução por IA (Gemini):** **manter como está**, em `content-core` na plataforma. **Consequência a resolver na fase 3:** `TranslationsAiService` lê e grava `Devotional` e `DevotionalTranslation` pelo Prisma global. Se essas tabelas migrarem para o banco do 3ML, a lógica atual deixa de alcançá-las. Antes de migrar os devocionais é preciso decidir: mover a tradução junto com o produto, ou fazer a plataforma chamar o serviço do 3ML por HTTP.
3. **Nome:** repositório e serviço **`3-minutes-api`**.

## Ainda em aberto

- **Volume e retenção dos dados:** não verifiquei o tamanho real das tabelas em produção (o `UserDevotional` tende a ser a maior). Define a estratégia da fase 3.
- **Crons e webhooks do produto:** não inspecionados.

## Fases

1. **Inventário e ADR** (este documento). Só documentação.
2. **Esqueleto:** repositório, serviço no Railway, banco vazio, auth via gateway e a API de parceiros no novo serviço com `api.3minutesforlife.com`.
3. **Migração dos dados** do produto para o banco novo.
4. **Corte do app**, rota por rota, e remoção do código do 3ML do gateway.

Cada fase termina em estado funcional e com rollback possível.

# Fase 3 — levantamento e plano de migração dos dados do 3ML

**Data:** 2026-10-27 · **Fonte:** leitura de código (Illumine OS, branch `feat/edi-product`) e contagens somente leitura no Postgres de produção da plataforma. Nada foi alterado.

## 1. Volume (produção)

| Tabela | Linhas |
|---|---|
| devotionals | 63 |
| devotional_translations | 231 (2 não publicadas) |
| user_devotionals | 242 |
| devotional_favorites | 2 |
| testimonials | 4 |
| prayer_requests | 7 |
| pastoral_replies | 0 |
| personal_reflections | 15 |
| user_referrals | 13 |
| translation_jobs | 80 |
| devotional_share_assets | 0 |

Banco inteiro: 42 MB, 92 usuários, 15 tenants. Todos os devocionais e indicações pertencem ao tenant `3minutes`.

**Conclusão:** o volume é pequeno. A migração cabe numa única cópia em minutos, sem janela longa nem estratégia de lotes. A preocupação do ADR com `UserDevotional` não se confirma.

## 2. Crons e webhooks

`cron.ts` tem 5 rotas (learning reminders, community digest, community events sync, journey digest, communications process). Nenhuma toca tabela do produto 3ML. **Não há cron do produto a migrar.** Webhooks de pagamento são plataforma (ponte Payment → Donor → Donation) e ficam.

## 3. Acoplamentos que bloqueiam a separação (achados novos)

1. **`analytics-core` consulta as tabelas do produto direto em SQL** (`user_devotionals`, `devotionals`, `devotional_categories`, `devotional_favorites`), com JOIN contra `app_events` e `users`. Afeta `/analytics/devotionals/{funnel,performance,reading-trends,ranking}`, o resumo por usuário e o painel geral. Com banco separado, esses JOINs deixam de funcionar. Decisão necessária (seção 4).
2. **Tradução por IA** (`translations-ai.service.ts`) lê e grava `devotional`, `devotionalTranslation`, `translationJob`, `translationJobAttempt` e `translationGlossary` pelo Prisma global.
3. **`pastoral.ts`** lê nome e e-mail por join com `User` (linhas ~171 e ~182).
4. **`referrals.ts`** usa `User.referralCode` (campo na tabela de usuários da plataforma) e cria/atualiza usuário.
5. **`crm-core/pastoral.service.ts`** é o serviço de pastoral (orações, testemunhos, respostas, auditoria). Mora num pacote da plataforma, mas só toca tabelas do produto.
6. **Menores:** módulos `content` e `pastoral` no catálogo white-label e no registro de métricas (prefixos `/devotionals`, `/reflections`, `/pastoral`), o admin (`listDevotionals`) e tipos de comunicação `devotional_update`.

## 4. Decisões pendentes

| # | Pergunta | Recomendação |
|---|---|---|
| A | Analytics de devocionais: onde fica? | Mover as 4 rotas `/analytics/devotionals/*` para o 3-minutes-api, que lê `app_events` da plataforma por HTTP ou recebe os eventos. Alternativa mais simples: manter um espelho somente leitura das leituras no banco da plataforma. |
| B | Tradução por IA | Mover `TranslationsAiService` para o 3-minutes-api (a lógica só usa tabelas do produto). Gemini continua sendo chamado de lá. Muda a decisão anterior de "manter como está"; é consequência direta de a tabela mudar de banco. |
| C | Nome/e-mail na pastoral | Gravar `userName` e `userEmail` na criação do registro (denormalizar) e preencher os 11 existentes na migração. Evita chamada ao gateway a cada listagem. |
| D | `referralCode` | Fica na plataforma (é atributo do usuário). `user_referrals` migra; geração do código continua no gateway, chamada por HTTP. |

## 5. Plano de execução

1. Decidir A–D.
2. Portar para o 3-minutes-api, com testes: rotas de devocionais do app, favoritos, leituras, pastoral, reflexões, indicações, tradução, analytics (conforme A).
3. Script de migração idempotente (gateway DB → 3-minutes-api DB), com contagem de linhas antes/depois e validação por amostra. Mantém os mesmos IDs.
4. Ensaio no banco local, depois em produção com as tabelas antigas intactas (nada é apagado nesta fase).
5. Recriar a chave de parceiro no banco novo.
6. Fase 4: apontar o app rota por rota, mover `api.3minutesforlife.com`, só então remover o código antigo do gateway.

Rollback da fase 3: como as tabelas antigas continuam intactas e o app ainda fala com o gateway, basta não fazer o corte.

## 6. Execução (2026-10-27)

Decisões A–D aceitas, com a ressalva de A abaixo.

**Feito no `3-minutes-api`** (commits `9a10f24` e seguintes, ainda sem deploy do código novo):
- Rotas portadas com os mesmos caminhos e formatos do gateway: devocionais (usuário, admin, legado por `legacyId`), favoritos, leituras, share assets, tradução por IA (Gemini) com fila e glossário, pastoral, reflexões e atribuição de indicação.
- Pastoral grava `userName`/`userEmail` do autor na criação (decisão C); as respostas mantêm o formato `user: { id, name, email }`.
- Permissões RBAC são consultadas na plataforma (`GET /users/me/permissions/:resource/:action`) com cache de 30 s. O serviço não replica papéis.
- Não foram portados `requireModule` e `requireProduct`: o isolamento agora é por dados (tenant da sessão) e pelo próprio serviço.
- Correção de passagem: `PATCH /pastoral/me/testimonials/:id` validava `devotional_id` como UUID, mas os IDs são cuid; passou a aceitar texto.
- Correção de passagem: `availableLanguages` repetia o idioma quando existiam traduções manual e de IA publicadas (ex.: `['pt-BR','en','en','es','es']`), e a escolha entre as duas era indefinida. Agora não repete e a manual tem precedência. **O gateway em produção ainda tem esse comportamento**; a correção lá é um deploy à parte.

**Feito no gateway** (commit `a6bd01d` na branch `feat/edi-product`, sem push nem deploy): `GET /users/me/permissions/:resource/:action` e `GET /referrals/:code/resolve`, ambos só de leitura e autenticados. Precisam estar em produção antes do corte.

**Script de migração** `scripts/migrate-from-platform.mjs`: lê a plataforma em transação somente leitura, copia com os mesmos IDs (`ON CONFLICT DO NOTHING`), preenche nome/e-mail dos autores da pastoral a partir de `users`, leva a chave de API do parceiro (só o hash) e confere por tabela que toda chave da origem existe no destino.

**Ensaio** (banco local novo, origem = produção em leitura): 17 tabelas, todas OK. 64 devocionais, 235 traduções, 243 leituras, 15 reflexões, 13 indicações, 4 testemunhos e 7 orações com autor preenchido. Segunda execução idempotente. O texto completo de devocionais, traduções e reflexões bate por checksum. A chave de parceiro atual, migrada, autentica no serviço novo e devolve `?lang=en` corretamente. Nada foi escrito em produção.

## 7. Ressalva sobre a decisão A (analytics)

A decisão A previa mover 4 rotas. O levantamento completo mostrou que o `AnalyticsService` da plataforma lê `user_devotionals`, `devotionals`, `devotional_favorites` e `devotional_categories` em **todas** as visões do painel: visão geral, atividade diária, DAU/WAU/MAU, retenção dia-N, coortes, sequências, engajamento por usuário, funil, desempenho, tendências e ranking. Várias misturam esses dados com `app_events` (aberturas e compartilhamentos), que são da plataforma. Portar só 4 rotas deixaria o painel pela metade, então **não portei analytics**.

Opções para decidir antes do corte:
1. **Painel consome o 3-minutes-api:** o serviço expõe agregados de leitura/conclusão/favorito por tenant (endpoint autenticado por chave de API) e o `AnalyticsService` passa a combiná-los com `app_events`. Mais trabalho, sem duplicação de dados.
2. **Eventos de leitura na plataforma:** o 3-minutes-api registra `devotional_read`/`completed`/`favorited` em `app_events` e o painel é reescrito sobre eles. O histórico (243 leituras) entra como carga única.
3. **Adiar:** manter o painel de devocionais lendo as tabelas antigas, que permanecem na plataforma congeladas. Os números param de crescer após o corte, então só serve por tempo curto.

## 8. Pré-requisitos do corte (fase 4)

- Deploy no gateway dos dois endpoints novos.
- Deploy do código novo do `3-minutes-api` (já na `main` do repositório, mas a migration `pastoral_user_snapshot` e o código só entram no Railway no próximo push).
- Variável `GOOGLE_AI_API_KEY` no serviço novo (tradução).
- Decisão de analytics (seção 7).
- Rodar a migração em produção, no momento do corte, e repetir logo antes de trocar o app (idempotente), para levar o que entrou nesse intervalo.
- Mover `api.3minutesforlife.com` e trocar as rotas do app.

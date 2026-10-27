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

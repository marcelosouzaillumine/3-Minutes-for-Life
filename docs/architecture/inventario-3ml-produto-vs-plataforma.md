# Inventário — o que é produto 3ML e o que é plataforma Illumine

**Data:** 2026-10-26 · **Fonte:** leitura de código (`Illumine OS` na branch `feat/edi-product`, schema Prisma e rotas do gateway) e do app `3 Minutes For Life`. Nada foi executado em produção. **Não verifiquei contagem de linhas das tabelas.**

Decisão que este inventário apoia: [ADR-001](adr-001-3ml-servico-de-produto.md).

## 1. Modelos de banco do produto (candidatos ao banco do 3ML)

| Modelo | Dependências de plataforma (FK) |
|---|---|
| `DevotionalCategory`, `DevotionalTheme` | nenhuma |
| `Devotional` | categoria, tema |
| `DevotionalTranslation`, `DevotionalShareAsset` | `Devotional` |
| `TranslationJob`, `TranslationJobAttempt` | `Devotional` |
| `TranslationGlossary` | nenhuma |
| `UserDevotional` (leituras) | `Devotional`, **`User`** |
| `DevotionalFavorite` | `Devotional`, **`User`** |
| `Testimonial`, `PrayerRequest` | **`User`** |
| `PastoralReply`, `PastoralAudit` | `PrayerRequest` / `Testimonial` |
| `PersonalReflection` | **`User`** |
| `UserReferral` | **`Tenant`**, **`User`** |

Todos carregam `tenantId`. As únicas ligações com a plataforma são `User` e `Tenant`. Em banco separado viram identificadores sem FK.

## 2. Rotas de produto no gateway (ficam no serviço do 3ML)

| Grupo | Rotas (resumo) | Arquivo |
|---|---|---|
| Devocionais | `/devotionals`, `/devotionals/:id`, `/devotionals/date/:date`, `/devotionals/favorites`, traduções e fila (`/devotionals/:id/translations*`, `/devotionals/translations/*`) | `devotionals.ts`, `products/3minutes/devotionals.ts` |
| Pastoral | `/pastoral/*` (orações, testemunhos, respostas, métricas, contato) | `pastoral.ts` |
| Reflexões | `/users/me/reflections*` | `reflections.ts` |
| Indicações | `/referrals/*` | `referrals.ts` |
| API de parceiros | `/partner/devotionals*` | `partner.ts` |

Detalhe: `pastoral.ts` lê nome e e-mail do usuário por join com `User` (linhas ~171 e ~182). No banco separado isso precisa de outra fonte.

## 3. Plataforma (continua no gateway; o app e o serviço do 3ML a consomem)

| Capacidade | Rotas usadas pelo app | Pacotes |
|---|---|---|
| Autenticação e usuários | `/auth/*`, `/users*`, `/roles` | `platform-core` |
| Comunicações e inbox | `/communications/*` | `inbox-core` |
| WhatsApp | `/whatsapp/*` | `whatsapp-core` |
| Analytics | `/analytics/*` | `analytics-core` |
| Consentimento | `/consent` | `consent-core` |
| Mídia | `/media/upload`, `/storage` | — |
| Pagamentos Asaas | `/asaas/subscriptions/mine` | `asaas-provider` |
| Marca e tenant | `/tenants/by-slug/:slug` | `whitelabel` |

## 4. Zona cinzenta (decisão pendente)

| Item | Situação |
|---|---|
| **Apoiadores** (`/supporters*`) | Lê e atualiza `Donor` (CRM). Modelo de plataforma, uso de produto |
| **Leads** (`/leads`) | Também grava em `Donor` |
| **Ponte Payment → Donor → Donation** | Implementada na Fase 1 do Illumine OS; é CRM/financeiro da plataforma |
| **Tradução por IA** | Lógica em `content-core` (Gemini). Precisa de cópia ou chamada |
| **Crons** (`cron.ts`) | Não inspecionei quais jobs são do produto |

## 5. Produto no `PRODUCT_REGISTRY`

`3minutes` já está registrado: status `active`, `platformSlug: '3minutes'`, módulos obrigatórios `platform` e `content`, opcionais `crm`, `consent`, `financial`, `whatsapp`, `analytics`. Isso serve de base para o white-label e não precisa mudar na fase 2.

## 6. O que não foi verificado

- Tamanho real das tabelas em produção (principalmente `UserDevotional`).
- Quais crons e webhooks pertencem ao produto.
- Se algum código do 3ML fora de `src/` (por exemplo `api/share` na Vercel) fala diretamente com o banco.
- Dependências do admin do 3ML (`apps/admin` do Illumine OS) em rotas de produto.

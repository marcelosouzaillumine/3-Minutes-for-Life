# Fase 4 — Plano de corte do 3ML para o `3-minutes-api`

**Status:** PROPOSTA, nada executado. Depende de aprovação explícita por etapa.
**Data:** 2026-10-27 · **Base:** [ADR-001](adr-001-3ml-servico-de-produto.md), [levantamento e execução da fase 3](fase3-levantamento-e-plano.md).

## 1. Estado de partida (verificado)

| Item | Estado |
|---|---|
| `3-minutes-api` no Railway | No ar, banco próprio **vazio**, `/health` 200. Código na `main` de `marcelosouzaillumine/3-Minutes-API` |
| Rotas portadas e testadas | Devocionais, favoritos, leituras, tradução, pastoral, reflexões, atribuição de indicação, parceiros, `/internal/analytics/*` (35 testes) |
| Migração de dados | Ensaiada com a produção em leitura: 17 tabelas OK, idempotente. **Nunca rodada contra o banco de produção do serviço** |
| Gateway em produção | Ainda **sem** `/users/me/permissions/...`, `/referrals/:code/resolve` e o ramo remoto de analytics (commits `a6bd01d`, `5b4cad2`, só locais na branch `feat/edi-product`) |
| Login do serviço novo contra o gateway real | **Nunca testado** (só com respostas simuladas) |
| App | Um único cliente HTTP (`src/lib/illumine.ts`) com `VITE_ILLUMINE_URL`; sem URL separada para produto. Há builds **Android e iOS** (Capacitor) que embutem essa URL e só atualizam com novo build |

## 2. Estratégia

**O gateway vira proxy das rotas de produto** (liga/desliga por variável de ambiente). Motivo: builds nativos antigos continuam chamando o gateway por tempo indeterminado, então o gateway precisa continuar respondendo esses caminhos; encaminhá-los ao serviço novo faz web, admin, builds antigos e parceiros migrarem **juntos, sem mudar o app**. Depois, com calma, o app passa a chamar o serviço direto (etapa 7) e o proxy some quando os builds antigos sumirem.

O que o proxy encaminha e o que fica no gateway:

| Encaminha para o `3-minutes-api` | Continua no gateway |
|---|---|
| `/devotionals`, `/devotionals/*` (inclui legado, traduções, share assets) | `/referrals/me`, `/referrals/:code`, `/referrals/:code/resolve` (código é do usuário) |
| `/pastoral/*` | `/analytics/*` (painel; passa a ler o serviço via `THREE_MINUTES_API_*`) |
| `/users/me/reflections*` | `/users/me`, `/users/me/permissions/*`, auth, comunicações, WhatsApp, consentimento, mídia, pagamentos, apoiadores |
| `POST /referrals/attribute` | `/3minutes/*` (checkout e assinatura) |
| `/partner/*` | |

Regras do proxy: repassa `Authorization`, `x-tenant-slug`, `x-api-key`, `Content-Type` e o IP do cliente (`X-Forwarded-For`); status, cabeçalhos e corpo voltam sem alteração; timeout de 30 s (120 s em `/devotionals/translations/process`); se o serviço novo cair, responde **502 `PRODUCT_API_UNAVAILABLE`**. **Nunca** cai de volta nas tabelas antigas, porque elas ficam desatualizadas assim que o corte acontece.

## 3. O que preciso construir antes (sem tocar em produção)

| # | Item | Pronto quando |
|---|---|---|
| B1 | Proxy no gateway, registrado **no lugar** das rotas antigas só se `PRODUCT_API_PROXY_URL` existir; congelamento de escritas por `PRODUCT_WRITES_FROZEN=1` (503 `MAINTENANCE` em POST/PUT/PATCH/DELETE dos caminhos acima; GET segue normal) | Teste automatizado do gateway cobre: proxy ligado, desligado, congelado, serviço fora (502) |
| B2 | Script de migração com `--mirror` (upsert completo + remove no destino o que sumiu na origem, nas tabelas em que o usuário apaga) e `--reverse` (serviço → plataforma, para rollback) | Ensaio local: escrevo dados no destino, rodo `--reverse` e confiro que a plataforma fica idêntica |
| B3 | Script de comparação sombra: mesma requisição no gateway antigo e no serviço novo com um token real, diff do JSON | Roda local contra a cópia de ensaio sem diferenças relevantes |
| B4 | Script de sondagem (smoke) pós-etapa: health, 401 sem token, rota de parceiro com chave, leitura autenticada, escrita e remoção de teste | Saída verde/vermelha em um comando |
| B5 | Corrigir `availableLanguages` repetido no gateway atual (idiomas duplicados para o parceiro) ou aceitar que a correção chega com o corte | Decisão sua |

## 4. Etapas

Cada etapa tem **verificação** (go/no-go) e **rollback**. Só passo para a seguinte depois do seu OK.

### Etapa 0 — Salvaguardas (sem impacto)
1. `pg_dump` do banco da plataforma (inteiro) e das tabelas de produto, guardado fora do Railway. Conferir que o arquivo restaura num banco local.
2. Anotar valor atual de contagens por tabela (referência para depois).
3. Definir janela: horário de menor uso do app (posso medir por hora a partir de `app_events` e `user_devotionals`; escolho com você).

*Rollback:* nada a desfazer.

### Etapa 1 — Gateway novo no ar, **inativo** (impacto zero)
1. Cherry-pick para `origin/main` (como nos deploys anteriores) de: endpoints `permissions` e `resolve` (`a6bd01d`), ramo remoto de analytics (`5b4cad2`) e proxy B1. Sem `PRODUCT_API_PROXY_URL` e sem `THREE_MINUTES_API_*`, o comportamento é idêntico ao atual.
2. Deploy. Sondar: rotas novas dão `401` sem token (404 = ainda não subiu); rotas antigas seguem iguais; `/partner/devotionals` com a chave real segue 200.

*Verificação:* `GET /health` ok, 3 sondagens acima, sem aumento de 5xx por 15 min.
*Rollback:* redeploy do commit anterior no Railway (1 clique); nada depende das rotas novas ainda.

### Etapa 2 — Configurar o serviço novo e primeira carga (sem tráfego real)
1. No `3-minutes-api`: `GOOGLE_AI_API_KEY` (copiada da variável do gateway, sem expor o valor); `CORS_ALLOWED_ORIGINS` incluindo as origens do app nativo (`capacitor://localhost`, `https://localhost`), que precisam estar também antes da etapa 7.
2. `node scripts/migrate-from-platform.mjs --dry-run` e depois a carga real (origem em transação somente leitura). Esperado: 17 tabelas OK, incluindo a chave de parceiro `Authcom`.
3. Criar a chave `analytics:read` para a plataforma (`SCOPES=analytics:read KEY_NAME=plataforma TENANT_ID=3minutes npm run key:create`); a chave aparece uma vez, vai direto para a variável do gateway.
4. **Primeiro teste do login real:** com o seu usuário, chamar o serviço novo direto (`GET /devotionals/today`, `/devotionals/favorites`, `/users/me/reflections`). Isso valida `GET /users/me` do gateway, cache e permissões (admin: `POST /devotionals` deve dar 403 para usuário comum e passar para admin).
5. Comparação sombra (B3) das leituras: `/devotionals/date/<hoje>`, `/devotionals?status=published&perPage=200`, `/devotionals/:id`, `/devotionals/favorites`, `/pastoral/me/*`, `/users/me/reflections`, e `/partner/*` com a chave real e `?lang=en`.

*Verificação:* diffs vazios (ou só ordem de campos e a correção de idiomas, que descrevo); admin/usuário comum com as permissões certas.
*Rollback:* nada a desfazer no tráfego; se a carga ficou errada, `TRUNCATE` das tabelas do serviço novo (banco dedicado, ainda sem escrita real) e repetir.

### Etapa 3 — Corte (janela curta, ~10 min, com congelamento de escritas)
Antes: aviso curto ao time; abrir logs do gateway e do serviço.

1. **Deploy A do gateway:** `PRODUCT_WRITES_FROZEN=1`, proxy ainda desligado. Escritas de produto devolvem 503 `MAINTENANCE`; leituras seguem. **Não verifiquei como o app reage a esse 503** (se mostra erro ou perde o que o usuário digitou); confirmo no ensaio da Etapa 2 antes de marcar a janela.
2. **Sincronização final:** `migrate-from-platform.mjs --mirror`. Como o destino não recebe escrita independente, o espelho completo é seguro. Esperado: 17 tabelas OK com contagens iguais às da origem (conferir contra a Etapa 0).
3. **Deploy B do gateway:** `PRODUCT_API_PROXY_URL=<3-minutes-api>`, `THREE_MINUTES_API_URL`, `THREE_MINUTES_API_KEY`, `PRODUCT_WRITES_FROZEN` removido. A partir daqui as rotas de produto e o painel usam o serviço novo.
4. **Sondagem B4** e teste manual no app web: abrir o devocional do dia, favoritar, marcar como lido, salvar uma reflexão, enviar uma oração de teste (e apagar), abrir o painel de analytics.
5. Painel de analytics: conferir que "aberturas" e "leituras" do dia mostram o teste feito agora (prova de que o painel já lê o serviço novo).

*Verificação (go/no-go em 15 min):* 5xx do proxy = 0; latência p95 do proxy aceitável (<1 s); escrita de teste aparece no **banco novo** e não aparece no antigo; `lastUsedAt` da chave de parceiro atualiza quando eu testar `/partner`.

*Rollback (até 24 h, enquanto as tabelas antigas estão congeladas e intactas):*
1. Deploy com `PRODUCT_WRITES_FROZEN=1` e proxy ligado ainda (impede novas escritas durante a volta).
2. `migrate-from-platform.mjs --reverse --mirror`: copia do serviço novo para a plataforma tudo que mudou desde o corte (novas leituras, favoritos, orações, reflexões) e apaga na plataforma o que o usuário apagou. Conferir contagens.
3. Deploy sem `PRODUCT_API_PROXY_URL` nem `THREE_MINUTES_API_*` e sem congelamento. Gateway volta a usar as tabelas antigas, agora atualizadas.
Custo do rollback: ~10 min de escritas bloqueadas, nenhuma perda de dados. Rollback de código sem o passo 2 **perde** o que foi escrito depois do corte e não deve ser feito.

### Etapa 4 — Endurecimento do isolamento (após 24 h estáveis)
Impedir escrita acidental nas tabelas antigas da plataforma (gatilho que levanta exceção em INSERT/UPDATE/DELETE) para qualquer caminho esquecido falhar alto em vez de gravar em dado morto. O gatilho é removido no rollback (passo 3 acima, antes de desligar o proxy).

### Etapa 5 — Domínio de parceiros (opcional, quando quiser)
Com o proxy, `api.3minutesforlife.com` **já serve o parceiro pelo serviço novo** sem mudar DNS. Mover o domínio de fato para o `3-minutes-api` (tirar do serviço `splendid-nourishment`, adicionar ao `3-minutes-api` no Railway e atualizar CNAME + TXT de verificação no Cloudflare, você faz o DNS) tira o gateway do caminho do parceiro. Há uma janela de minutos entre remover e verificar; por isso é feito à parte e fora do horário do parceiro.
*Rollback:* repontar o CNAME e readicionar o domínio ao gateway.

### Etapa 6 — Observação (72 h)
Conferir diariamente: 5xx e latência do proxy e do serviço, leituras novas por dia (devem seguir o ritmo anterior), uso da chave de parceiro, crescimento do banco. Qualquer anomalia: parar e avaliar rollback.

### Etapa 7 — App chama o serviço direto (release à parte)
- `VITE_PRODUCT_API_URL` e uma lista de prefixos de produto em `illumineFetch` (`/devotionals`, `/pastoral`, `/users/me/reflections`, `/referrals/attribute`); o resto continua no gateway.
- Web: deploy na Vercel (lembrar do cache do PWA: recarregar 2 vezes); rollback pela promoção do deploy anterior.
- Android/iOS: novos builds nas lojas, no ritmo das lojas.
- Corrigir de passagem o `api/share.ts` e o app, que chamam `GET /public/devotionals/:id`: essa rota **não existe hoje** no gateway (404 em produção), então visitante anônimo de link compartilhado já não vê o devocional. Fora do escopo do corte; resolvo se você quiser (o serviço novo pode expor uma rota pública sem token).

### Etapa 8 — Limpeza (semanas depois, com sua aprovação separada)
Quando o tráfego de builds antigos no proxy chegar perto de zero: remover as rotas de produto e o proxy do gateway; `pg_dump` final das tabelas antigas; só então decidir `DROP`. **Nada disso é feito sem pedido explícito.**

## 5. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Escrita entre carga e corte se perde | Congelamento de escritas + `--mirror` final (Etapa 3) |
| Rollback sem sincronizar volta a perder dados | Procedimento de rollback exige `--reverse --mirror` antes de desligar o proxy |
| Login do serviço novo nunca visto com o gateway real | Teste dedicado na Etapa 2 passo 4, antes de qualquer tráfego |
| Permissão revogada demora até 30 s para valer no serviço novo | Aceito (cache curto); documentado |
| Builds nativos antigos | Proxy os mantém funcionando indefinidamente |
| Limite de 120 req/min por IP passa a ver o IP do gateway | Proxy repassa `X-Forwarded-For`; testar com chamadas de IPs diferentes na Etapa 3 |
| Serviço novo fora do ar derruba produto | Hoje já é um serviço único (gateway); passa a ser dois. Healthcheck e reinício automático no Railway; 502 explícito no proxy |
| Painel de analytics divergir | Paridade já verificada (idêntico); conferência extra na Etapa 3 passo 5 |
| Segredo da chave de analytics/Gemini exposto | Gravado direto em variável do Railway, nunca em chat nem em arquivo |

## 6. Quem faz o quê

- **Eu:** B1–B4, cherry-pick e deploy do gateway, carga e espelho, sondagens, rollback se necessário, atualização desta documentação.
- **Você:** aprovar cada etapa e a janela; DNS no Cloudflare (Etapa 5); builds e envio às lojas (Etapa 7); decidir B5.

## 7. Decisões que preciso de você

1. Aprova a estratégia de **proxy no gateway** (recomendada) em vez de mudar só o app?
2. Janela do corte (dia/hora) para a Etapa 3.
3. Corrijo o `availableLanguages` duplicado para o parceiro já na Etapa 1 (B5)?
4. Quer incluir a rota pública de devocional para links compartilhados (item da Etapa 7) ou deixar para depois?

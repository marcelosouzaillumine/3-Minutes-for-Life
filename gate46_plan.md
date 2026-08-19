# Gate 4.6 — Recurring Pix (A Assinatura Voluntária)

## User Review Required
> [!IMPORTANT]
> Vi que você aplicou um conjunto bem legal de refatorações locais de i18n e na Landing Page! O ambiente parece ótimo.
> Agora, para a Assinatura Voluntária (Recorrência via Pix), trago a proposta arquitetural final baseada na API do Asaas.

## Proposed Changes

### 1. Novo fluxo no `AsaasPaymentProvider`
O adapter do Asaas passará a suportar o parâmetro `frequency: 'monthly'` que já modelamos no banco.
- Se `frequency === 'monthly'`, em vez de chamar `POST /payments`, o Adapter chamará `POST /subscriptions`.
- O payload para a API do Asaas incluirá: `billingType: 'PIX'`, `cycle: 'MONTHLY'`, `nextDueDate: <hoje>`.
- O Asaas retorna um `subscription_id` e automaticamente cria a primeira cobrança (payment) pendente sob esta assinatura.

### 2. Sincronização do Webhook (Eventos Recorrentes)
Hoje nosso webhook escuta `PAYMENT_RECEIVED` e completa a `contribution` buscando-a pelo `provider_reference` (que até agora guardava o `payment_id`).
Na recorrência, o Asaas dispara múltiplos pagamentos ao longo dos meses para a mesma Subscription.
Portanto, as renovações mensais não podem simplesmente atualizar a mesma `contribution` de 1 mês atrás, elas precisam **criar novas entradas no nosso extrato de contributions** ou manter a `contribution` pai ativa e gerar `payment_events`.

> [!WARNING]  
> **Decisão Arquitetural Crítica:** Como modelar os meses subsequentes?
> **Opção A:** A tabela `contributions` representa "A Assinatura". Ela fica `status = active`. Os pagamentos mensais viram linhas apenas na `payment_events`.
> **Opção B:** A tabela `contributions` representa "Uma Transação". A cada mês que o webhook do Asaas avisa que um PIX recorrente foi pago, nós inserimos uma *nova* linha em `contributions` com o valor daquele mês.
> 
> A Opção B é mais simples para o MVP. O webhook recebe o evento de pagamento, checa se a `contribution` já existe. Se não existe (por ser renovação), cria!

### 3. Edge Function (Pagamento da Subscription)
Modificar o Edge Function e o Adapter para interpretar os dados da assinatura do Asaas.

## Verification Plan
1. Rodar `test-e2e` adaptado para simular o recebimento de dois meses de assinatura seguidos via Sandbox.
2. Comprovar que o dashboard lista o suporte contínuo.

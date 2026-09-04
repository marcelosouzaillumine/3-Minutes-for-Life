// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =============================================================
// asaas-create-checkout
//
// Operates in two modes:
//
//  NEW (via Illumine gateway):
//    Body: { asaas_payment_id, amount_cents, frequency }
//    → Receives the Asaas payment ID already created by Illumine,
//      upserts the supporter row, and inserts the contribution.
//
//  LEGACY (direct):
//    Body: { amount_cents, cpf_cnpj, frequency, payment_method }
//    → Creates the Asaas customer + payment/subscription directly,
//      then upserts supporter and inserts contribution.
//    Used as fallback when the caller has no Illumine JWT.
// =============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MIN_AMOUNT_CENTS = 500;

function onlyDigits(s: string): string {
  return (s || '').replace(/\D/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Autenticação necessária.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user || !user.email) {
      const reason = authError?.message || (!user ? 'no user resolved' : 'user has no email');
      return new Response(JSON.stringify({ error: `Sessão inválida (${reason}). Faça login para continuar.` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rawFrequency = String(body.frequency || 'one_time').toLowerCase();
    const isRecurring = ['monthly', 'yearly', 'annual', 'recurring'].includes(rawFrequency);
    const cycle = (rawFrequency === 'yearly' || rawFrequency === 'annual') ? 'YEARLY' : 'MONTHLY';
    const dbFrequency = isRecurring ? (cycle === 'YEARLY' ? 'yearly' : 'recurring') : 'one_time';
    const amountCents = Math.round(Number(body.amount_cents));

    let providerReference: string;
    let checkoutUrl: string;

    if (body.asaas_payment_id) {
      // ── NEW MODE: payment already created by Illumine gateway ───────────────
      providerReference = String(body.asaas_payment_id).trim();
      if (!providerReference) {
        return new Response(JSON.stringify({ error: 'asaas_payment_id inválido.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // checkoutUrl not needed in this mode — caller already has it
    } else {
      // ── LEGACY MODE: create Asaas payment here ──────────────────────────────
      const asaasApiKey = (Deno.env.get('ASAAS_API_KEY') || '').trim();
      const asaasEnvironment = (Deno.env.get('ASAAS_ENVIRONMENT') || 'production').trim();
      const cpfCnpj = onlyDigits(String(body.cpf_cnpj || ''));
      const rawPaymentMethod = String(body.payment_method || 'undefined').toLowerCase();
      const billingType =
        rawPaymentMethod === 'pix' ? 'PIX'
        : rawPaymentMethod === 'credit_card' ? 'CREDIT_CARD'
        : 'UNDEFINED';

      if (!Number.isFinite(amountCents) || amountCents < MIN_AMOUNT_CENTS) {
        return new Response(JSON.stringify({ error: `O valor mínimo é R$ ${(MIN_AMOUNT_CENTS / 100).toFixed(2)}.` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
        return new Response(JSON.stringify({ error: 'CPF ou CNPJ inválido.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      const customerName = profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];

      const asaasBaseUrl = asaasEnvironment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';
      const asaasHeaders = { 'access_token': asaasApiKey, 'Content-Type': 'application/json' };

      const searchRes = await fetch(`${asaasBaseUrl}/customers?email=${encodeURIComponent(user.email)}`, { headers: asaasHeaders });
      if (!searchRes.ok) throw new Error(`Asaas customer search failed: ${searchRes.status}`);
      const searchData = await searchRes.json();

      let customerId: string;
      if (searchData.data?.length > 0) {
        customerId = searchData.data[0].id;
      } else {
        const createRes = await fetch(`${asaasBaseUrl}/customers`, {
          method: 'POST', headers: asaasHeaders,
          body: JSON.stringify({ name: customerName, email: user.email, cpfCnpj }),
        });
        if (!createRes.ok) {
          const errBody = await createRes.json().catch(() => ({}));
          const detail = errBody?.errors?.[0]?.description;
          return new Response(JSON.stringify({ error: detail ? `Asaas recusou os dados: ${detail}` : 'Não foi possível validar seus dados no Asaas.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        customerId = (await createRes.json()).id;
      }

      if (!isRecurring) {
        const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 3);
        const payRes = await fetch(`${asaasBaseUrl}/payments`, {
          method: 'POST', headers: asaasHeaders,
          body: JSON.stringify({ customer: customerId, billingType, value: amountCents / 100, dueDate: dueDate.toISOString().split('T')[0], externalReference: crypto.randomUUID(), description: 'Apoio à Missão 3 Minutes for Life' }),
        });
        if (!payRes.ok) {
          const errBody = await payRes.json().catch(() => ({}));
          const detail = errBody?.errors?.[0]?.description;
          return new Response(JSON.stringify({ error: detail ? `Asaas recusou a cobrança: ${detail}` : 'Não foi possível gerar a cobrança.' }), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const payData = await payRes.json();
        providerReference = payData.id;
        checkoutUrl = payData.invoiceUrl || `https://www.asaas.com/c/${providerReference}`;
      } else {
        const nextDueDate = new Date().toISOString().split('T')[0];
        const subRes = await fetch(`${asaasBaseUrl}/subscriptions`, {
          method: 'POST', headers: asaasHeaders,
          body: JSON.stringify({ customer: customerId, billingType, value: amountCents / 100, nextDueDate, cycle, description: cycle === 'YEARLY' ? 'Apoio Anual - 3 Minutes for Life' : 'Apoio Mensal - 3 Minutes for Life' }),
        });
        if (!subRes.ok) {
          const errBody = await subRes.json().catch(() => ({}));
          const detail = errBody?.errors?.[0]?.description;
          return new Response(JSON.stringify({ error: detail ? `Asaas recusou a assinatura: ${detail}` : 'Não foi possível criar a assinatura.' }), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const subData = await subRes.json();
        providerReference = subData.id;
        checkoutUrl = subData.paymentLink || `https://www.asaas.com/c/${subData.id}`;
        const paymentsRes = await fetch(`${asaasBaseUrl}/subscriptions/${subData.id}/payments`, { headers: asaasHeaders });
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          if (paymentsData.data?.[0]?.invoiceUrl) checkoutUrl = paymentsData.data[0].invoiceUrl;
        }
      }
    }

    // ── Persist supporter + contribution ────────────────────────────────────
    const { data: supporter } = await supabaseAdmin
      .from('supporters')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
      .select('id').maybeSingle();

    let supporterId = supporter?.id;
    if (!supporterId) {
      const { data: existing } = await supabaseAdmin.from('supporters').select('id').eq('user_id', user.id).single();
      supporterId = existing?.id;
    }
    if (!supporterId) throw new Error('Failed to resolve supporter row');

    const contributionId = crypto.randomUUID();
    await supabaseAdmin.from('contributions').insert({
      id: contributionId,
      supporter_id: supporterId,
      amount: amountCents,
      currency: 'BRL',
      frequency: dbFrequency,
      status: 'pending',
      provider: 'asaas',
      provider_reference: providerReference,
      started_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      checkoutUrl: checkoutUrl || undefined,
      contributionId,
      providerReference,
      frequency: dbFrequency,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('asaas-create-checkout error:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `Erro interno ao criar o checkout: ${detail}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

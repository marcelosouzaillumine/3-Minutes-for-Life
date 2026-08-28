// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =============================================================
// asaas-create-checkout
//
// Closes the gap found in the security audit: the live donation flow
// (Contribute.tsx) redirected to static Asaas hosted payment links without
// ever creating a `contribution` row first — so when the Asaas webhook
// later fired, it had nothing to match against and no supporter was ever
// activated from a real payment.
//
// This function creates the Asaas PIX charge via the API (server-side,
// holds ASAAS_API_KEY) with `externalReference` set to our own
// contribution id, THEN persists the `contribution` row with the real
// Asaas payment id as `provider_reference` — so process_payment_webhook
// (fixed in the previous migration) can find and activate the supporter.
//
// SCOPE: one-time PIX contributions only ("Contribuição única"). The three
// recurring tiers (apoio_mensal, apoio_anual, livre_mensal) still use the
// static Asaas hosted links unchanged — Asaas subscription creation is a
// separate, larger piece of work (see gate46_plan.md) and shipping it
// without the ability to test against the sandbox here risked breaking
// checkout for those tiers rather than just leaving them as they are.
// =============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MIN_AMOUNT_CENTS = 500; // Asaas' practical minimum for a PIX charge (R$5,00)

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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')!;
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'production';

    // 1. Authenticate the caller — this endpoint requires a signed-in user,
    //    a contribution always needs a user_id to attach a supporter to.
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
      console.error('Auth check failed:', { authError, hasUser: !!user, hasEmail: !!user?.email });
      const reason = authError?.message || (!user ? 'no user resolved' : 'user has no email');
      return new Response(JSON.stringify({ error: `Sessão inválida (${reason}).` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate input
    const body = await req.json().catch(() => ({}));
    const amountCents = Math.round(Number(body.amount_cents));
    const cpfCnpj = onlyDigits(String(body.cpf_cnpj || ''));

    if (!Number.isFinite(amountCents) || amountCents < MIN_AMOUNT_CENTS) {
      return new Response(JSON.stringify({ error: `O valor mínimo é R$ ${(MIN_AMOUNT_CENTS / 100).toFixed(2)}.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return new Response(JSON.stringify({ error: 'CPF ou CNPJ inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const customerName = profile?.full_name || user.email.split('@')[0];

    // 3. Resolve or create the Asaas customer
    const asaasBaseUrl = asaasEnvironment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';

    const asaasHeaders = {
      'access_token': asaasApiKey,
      'Content-Type': 'application/json',
      'User-Agent': '3MinutesForLife-Contribute',
    };

    const searchRes = await fetch(`${asaasBaseUrl}/customers?email=${encodeURIComponent(user.email)}`, {
      headers: asaasHeaders,
    });
    if (!searchRes.ok) {
      throw new Error(`Asaas customer search failed: ${searchRes.status}`);
    }
    const searchData = await searchRes.json();

    let customerId: string;
    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      const createRes = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify({ name: customerName, email: user.email, cpfCnpj }),
      });
      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        console.error('Asaas customer creation failed:', errBody);
        const detail = errBody?.errors?.[0]?.description;
        return new Response(JSON.stringify({
          error: detail
            ? `Asaas recusou os dados: ${detail}`
            : 'Não foi possível validar seus dados no Asaas. Confira o CPF/CNPJ informado.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const createData = await createRes.json();
      customerId = createData.id;
    }

    // 4. Ensure a supporters row exists for this user
    const { data: supporter } = await supabaseAdmin
      .from('supporters')
      .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
      .select('id')
      .maybeSingle();

    let supporterId = supporter?.id;
    if (!supporterId) {
      const { data: existing } = await supabaseAdmin
        .from('supporters')
        .select('id')
        .eq('user_id', user.id)
        .single();
      supporterId = existing?.id;
    }

    if (!supporterId) {
      throw new Error('Failed to resolve supporter row');
    }

    // 5. Create the Asaas PIX charge — externalReference is our own future
    //    contribution id, generated up front so we can send it before the
    //    row exists (provider_reference is NOT NULL, so we create the
    //    contribution AFTER Asaas confirms, using its real payment id).
    const contributionId = crypto.randomUUID();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const paymentRes = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: amountCents / 100,
        dueDate: dueDate.toISOString().split('T')[0],
        externalReference: contributionId,
        description: 'Apoio ao 3 Minutes for Life',
      }),
    });

    if (!paymentRes.ok) {
      const errBody = await paymentRes.json().catch(() => ({}));
      console.error('Asaas payment creation failed:', errBody);
      const detail = errBody?.errors?.[0]?.description;
      return new Response(JSON.stringify({
        error: detail
          ? `Asaas recusou a cobrança: ${detail}`
          : 'Não foi possível gerar a cobrança. Tente novamente em instantes.',
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentData = await paymentRes.json();
    const providerReference = paymentData.id;
    const checkoutUrl = paymentData.invoiceUrl;

    // 6. Persist the contribution — best-effort: the Asaas charge already
    //    exists and is real either way, so a DB hiccup here shouldn't block
    //    a working payment link, but we do log it for follow-up.
    const { error: insertError } = await supabaseAdmin.from('contributions').insert({
      id: contributionId,
      supporter_id: supporterId,
      amount: amountCents,
      currency: 'BRL',
      frequency: 'one_time',
      status: 'pending',
      provider: 'asaas',
      provider_reference: providerReference,
      started_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to persist contribution (Asaas charge was still created):', insertError);
    }

    return new Response(JSON.stringify({ checkoutUrl, contributionId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('asaas-create-checkout error:', error);
    // Surfaced to the caller during rollout so real failures are visible
    // in the UI instead of a bare 500 — tighten this once the flow is
    // proven stable in production.
    const detail = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `Erro interno ao criar o checkout: ${detail}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

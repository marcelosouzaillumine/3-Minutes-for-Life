// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =============================================================
// asaas-create-checkout
//
// Handles both One-Time PIX Contributions and Recurring Subscriptions
// (Gate 4.6 — Monthly and Yearly PIX Recurring) via Asaas API.
// Attaches all charges to the authenticated user and persists the
// contribution row before checkout so that webhooks seamlessly activate
// the supporter in our database.
// =============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MIN_AMOUNT_CENTS = 500; // R$ 5,00

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
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')!;
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'production';

    // 1. Authenticate the caller — requires signed-in user
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
      return new Response(JSON.stringify({ error: `Sessão inválida (${reason}). Faça login para continuar.` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate input
    const body = await req.json().catch(() => ({}));
    const amountCents = Math.round(Number(body.amount_cents));
    const cpfCnpj = onlyDigits(String(body.cpf_cnpj || ''));
    const rawFrequency = String(body.frequency || 'one_time').toLowerCase();
    const isRecurring = ['monthly', 'yearly', 'annual', 'recurring'].includes(rawFrequency);
    const cycle = (rawFrequency === 'yearly' || rawFrequency === 'annual') ? 'YEARLY' : 'MONTHLY';
    const dbFrequency = isRecurring ? (cycle === 'YEARLY' ? 'yearly' : 'recurring') : 'one_time';

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

    const customerName = profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0];

    // 3. Resolve or create Asaas customer
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

    const contributionId = crypto.randomUUID();
    let providerReference: string;
    let checkoutUrl: string;

    // 5. Create Payment or Subscription via Asaas API
    if (!isRecurring) {
      // ONE-TIME PIX CHARGE
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
          description: 'Apoio à Missão 3 Minutes for Life',
        }),
      });

      if (!paymentRes.ok) {
        const errBody = await paymentRes.json().catch(() => ({}));
        console.error('Asaas payment creation failed:', errBody);
        const detail = errBody?.errors?.[0]?.description;
        return new Response(JSON.stringify({
          error: detail ? `Asaas recusou a cobrança: ${detail}` : 'Não foi possível gerar a cobrança. Tente novamente em instantes.',
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const paymentData = await paymentRes.json();
      providerReference = paymentData.id;
      checkoutUrl = paymentData.invoiceUrl;
    } else {
      // RECURRING SUBSCRIPTION (MONTHLY / YEARLY)
      const nextDueDate = new Date();

      const subRes = await fetch(`${asaasBaseUrl}/subscriptions`, {
        method: 'POST',
        headers: asaasHeaders,
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: amountCents / 100,
          nextDueDate: nextDueDate.toISOString().split('T')[0],
          cycle: cycle,
          description: cycle === 'YEARLY' ? 'Apoio Anual - 3 Minutes for Life' : 'Apoio Mensal - 3 Minutes for Life',
          externalReference: contributionId,
        }),
      });

      if (!subRes.ok) {
        const errBody = await subRes.json().catch(() => ({}));
        console.error('Asaas subscription creation failed:', errBody);
        const detail = errBody?.errors?.[0]?.description;
        return new Response(JSON.stringify({
          error: detail ? `Asaas recusou a assinatura: ${detail}` : 'Não foi possível criar a assinatura. Tente novamente em instantes.',
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const subData = await subRes.json();
      providerReference = subData.id;
      checkoutUrl = subData.paymentLink || null;

      // Fetch the first pending payment generated for this subscription
      const paymentsRes = await fetch(`${asaasBaseUrl}/subscriptions/${subData.id}/payments`, {
        headers: asaasHeaders,
      });

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        if (paymentsData.data && paymentsData.data.length > 0) {
          const firstPayment = paymentsData.data[0];
          checkoutUrl = firstPayment.invoiceUrl || checkoutUrl;
        }
      }

      if (!checkoutUrl) {
        checkoutUrl = `https://www.asaas.com/c/${subData.id}`;
      }
    }

    // 6. Persist the contribution
    const { error: insertError } = await supabaseAdmin.from('contributions').insert({
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

    if (insertError) {
      console.error('Failed to persist contribution:', insertError);
    }

    return new Response(JSON.stringify({
      checkoutUrl,
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

// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// =============================================================
// asaas-create-checkout
//
// Records a contribution row in Supabase after the Asaas payment
// has been created by the Illumine gateway (/asaas/checkout).
// Receives the Asaas payment ID and contribution metadata, then:
//  1. Resolves / creates the supporter row for the authenticated user
//  2. Inserts the pending contribution
//  3. Returns { contributionId }
// =============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    // 1. Authenticate the caller
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

    if (authError || !user) {
      const reason = authError?.message || 'no user resolved';
      return new Response(JSON.stringify({ error: `Sessão inválida (${reason}). Faça login para continuar.` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Validate input
    const body = await req.json().catch(() => ({}));
    const asaasPaymentId = String(body.asaas_payment_id || '').trim();
    const amountCents = Math.round(Number(body.amount_cents));
    const rawFrequency = String(body.frequency || 'one_time').toLowerCase();
    const isRecurring = ['monthly', 'yearly', 'annual', 'recurring'].includes(rawFrequency);
    const cycle = (rawFrequency === 'yearly' || rawFrequency === 'annual') ? 'YEARLY' : 'MONTHLY';
    const dbFrequency = isRecurring ? (cycle === 'YEARLY' ? 'yearly' : 'recurring') : 'one_time';

    if (!asaasPaymentId) {
      return new Response(JSON.stringify({ error: 'asaas_payment_id é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'amount_cents inválido.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Resolve or create the supporter row
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

    // 4. Persist the contribution
    const contributionId = crypto.randomUUID();
    const { error: insertError } = await supabaseAdmin.from('contributions').insert({
      id: contributionId,
      supporter_id: supporterId,
      amount: amountCents,
      currency: 'BRL',
      frequency: dbFrequency,
      status: 'pending',
      provider: 'asaas',
      provider_reference: asaasPaymentId,
      started_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to persist contribution:', insertError);
      throw new Error('Falha ao registrar a contribuição.');
    }

    return new Response(JSON.stringify({ contributionId, frequency: dbFrequency }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('asaas-create-checkout error:', error);
    const detail = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: `Erro interno: ${detail}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

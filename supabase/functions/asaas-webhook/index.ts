import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// To keep it simple and portable for the MVP, we copy the adapter logic here 
// since Edge Functions in Deno have different import paths than the Vite app.
function normalizeAsaasWebhook(payload: any) {
  if (!payload || !payload.event || !payload.payment) {
    return null;
  }

  const eventId = payload.id;
  const providerReference = payload.payment.id;
  const asaasEvent = payload.event;
  
  let eventType: string;

  switch (asaasEvent) {
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_CONFIRMED':
      eventType = 'PAYMENT_CONFIRMED';
      break;
    case 'PAYMENT_DELETED':
    case 'PAYMENT_REFUNDED':
    case 'PAYMENT_OVERDUE':
      eventType = 'PAYMENT_FAILED';
      break;
    default:
      return null;
  }

  return {
    provider: 'asaas',
    providerEventId: eventId,
    eventType: eventType,
    occurredAt: new Date(payload.dateCreated || new Date().toISOString()),
    referenceId: providerReference,
    rawPayload: payload
  };
}

serve(async (req) => {
  try {
    // 1. Authenticate Request
    const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const providedToken = req.headers.get('asaas-access-token');

    if (!expectedToken || providedToken !== expectedToken) {
      console.warn('Unauthorized webhook request');
      // Return 401 Unauthorized
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = await req.json();

    // 2. Normalize Payload
    const canonicalEvent = normalizeAsaasWebhook(payload);
    
    if (!canonicalEvent) {
      // Return 200 OK fast for ignored events so Asaas doesn't retry
      return new Response(JSON.stringify({ status: 'ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Initialize Supabase Client with Service Role
    // We must use Service Role to bypass RLS for payment_events (which has NO access policies)
    // and to safely update contributions based on provider_reference.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Invoke RPC for Transactional Idempotent Processing (Gate 4.4 Boundary)
    const { data, error } = await supabaseAdmin.rpc('process_payment_webhook', {
      p_provider: canonicalEvent.provider,
      p_event_id: canonicalEvent.providerEventId,
      p_event_type: canonicalEvent.eventType,
      p_reference_id: canonicalEvent.referenceId,
      p_payload: canonicalEvent.rawPayload
    });

    if (error) {
      console.error('Error invoking process_payment_webhook:', error);
      // We return 500 so Asaas retries later
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // `data` is a boolean from the RPC
    // TRUE means processed (or safely ignored missing reference)
    // FALSE means it was a duplicate (ON CONFLICT DO NOTHING returned no ID)
    
    // Return 200 OK fast
    return new Response(JSON.stringify({ 
      status: 'success', 
      processed: data,
      message: data ? 'Event processed' : 'Duplicate event ignored'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    // Return 400 for bad JSON or other basic errors to avoid useless retries
    return new Response(JSON.stringify({ error: 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

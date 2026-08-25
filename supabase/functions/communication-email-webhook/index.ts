import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/*
 * ================================================================
 * HIERARQUIA DOS STATUS
 * ================================================================
 *
 * Quanto maior o número, mais avançado é o estado.
 *
 * Estados terminais:
 * - bounced
 * - complained
 * - failed
 */

const statusRank: Record<string, number> = {
  pending: 0,
  queued: 1,
  sent: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
};

const terminalStatuses = new Set([
  'bounced',
  'complained',
  'failed',
]);

const statusMap: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
  'email.delivery_delayed': 'queued',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        received: false,
        error: 'Método não permitido.',
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    /*
     * ============================================================
     * 1. LER PAYLOAD
     * ============================================================
     */

    const payload = await req.json();

    const event = payload?.type;
    const data = payload?.data;

    const providerMessageId =
      data?.email_id ??
      data?.id ??
      null;

    /*
     * Eventos desconhecidos não precisam ser tratados como erro.
     */

    if (!event || !providerMessageId) {
      return new Response(
        JSON.stringify({
          received: true,
          ignored: true,
          reason: 'missing_event_or_message_id',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const newStatus = statusMap[event];

    if (!newStatus) {
      return new Response(
        JSON.stringify({
          received: true,
          ignored: true,
          reason: 'unsupported_event',
          event,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    /*
     * ============================================================
     * 2. LOCALIZAR DELIVERY
     * ============================================================
     */

    const { data: delivery, error: deliveryError } =
      await supabase
        .from('communication_deliveries')
        .select(
          `
            id,
            status,
            provider_message_id
          `
        )
        .eq(
          'provider_message_id',
          providerMessageId
        )
        .maybeSingle();

    if (deliveryError) {
      throw deliveryError;
    }

    /*
     * O evento pode chegar antes de nosso banco possuir o registro.
     *
     * Nesse caso retornamos 200 para evitar que o provider fique
     * tentando indefinidamente.
     */

    if (!delivery) {
      console.warn(
        'Delivery não encontrado para provider_message_id:',
        providerMessageId
      );

      return new Response(
        JSON.stringify({
          received: true,
          matched: false,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const currentStatus = delivery.status;

    /*
     * ============================================================
     * 3. EVITAR REGRESSÃO DE STATUS
     * ============================================================
     */

    /*
     * Se já estiver em um estado terminal, não permitimos que
     * outro evento substitua esse estado.
     *
     * Exemplo:
     *
     * complained
     * ↓
     * opened
     *
     * NÃO deve acontecer.
     */

    if (terminalStatuses.has(currentStatus)) {
      return new Response(
        JSON.stringify({
          received: true,
          ignored: true,
          reason: 'terminal_status',
          current_status: currentStatus,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    /*
     * Eventos normais não podem retroceder.
     *
     * clicked = 5
     * delivered = 3
     *
     * Portanto:
     *
     * clicked → delivered
     *
     * será ignorado.
     */

    const currentRank =
      statusRank[currentStatus] ?? -1;

    const newRank =
      statusRank[newStatus] ?? -1;

    if (
      !terminalStatuses.has(newStatus) &&
      newRank < currentRank
    ) {
      return new Response(
        JSON.stringify({
          received: true,
          ignored: true,
          reason: 'status_regression',
          current_status: currentStatus,
          incoming_status: newStatus,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    /*
     * ============================================================
     * 4. PREPARAR UPDATE
     * ============================================================
     */

    const now = new Date().toISOString();

    const update: Record<string, unknown> = {
      status: newStatus,
      provider_event_type: event,
      provider_event_at:
        payload?.created_at ?? now,
      updated_at: now,
    };

    /*
     * delivered
     */

    if (
      newStatus === 'delivered' &&
      !delivery.status?.includes('delivered')
    ) {
      update.delivered_at = now;
    }

    /*
     * opened
     */

    if (newStatus === 'opened') {
      update.opened_at = now;
    }

    /*
     * clicked
     */

    if (newStatus === 'clicked') {
      update.clicked_at = now;
    }

    /*
     * ============================================================
     * 5. ERRO / BOUNCE
     * ============================================================
     */

    if (
      newStatus === 'bounced' ||
      newStatus === 'failed'
    ) {
      const bounce = data?.bounce;

      update.error_code =
        bounce?.type ??
        data?.error_code ??
        'EMAIL_DELIVERY_ERROR';

      update.error_message =
        bounce?.message ??
        data?.message ??
        data?.error ??
        `Evento ${event} recebido pelo provider.`;
    }

    /*
     * ============================================================
     * 6. COMPLAINT
     * ============================================================
     */

    if (newStatus === 'complained') {
      update.error_code = 'EMAIL_COMPLAINT';
      update.error_message =
        data?.message ??
        'Destinatário marcou o e-mail como spam.';
    }

    /*
     * ============================================================
     * 7. ATUALIZAR DELIVERY
     * ============================================================
     */

    const { error: updateError } =
      await supabase
        .from('communication_deliveries')
        .update(update)
        .eq('id', delivery.id);

    if (updateError) {
      throw updateError;
    }

    /*
     * ============================================================
     * 8. RESPOSTA
     * ============================================================
     */

    return new Response(
      JSON.stringify({
        received: true,
        matched: true,
        delivery_id: delivery.id,
        previous_status: currentStatus,
        status: newStatus,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'communication-email-webhook error:',
      error
    );

    return new Response(
      JSON.stringify({
        received: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
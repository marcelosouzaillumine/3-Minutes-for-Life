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
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_DELIVERIES_PER_RUN = 100;

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
        success: false,
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
     * 1. BUSCAR DELIVERIES PENDENTES
     * ============================================================
     */

    const { data: deliveries, error } = await supabase
      .from('communication_deliveries')
      .select(
        `
          id,
          campaign_id,
          channel,
          status,
          attempt_count
        `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(MAX_DELIVERIES_PER_RUN);

    if (error) {
      throw error;
    }

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    /*
     * ============================================================
     * 2. PROCESSAR CADA DELIVERY
     * ============================================================
     */

    for (const delivery of deliveries ?? []) {
      try {
        /*
         * --------------------------------------------------------
         * EMAIL
         * --------------------------------------------------------
         */

        if (delivery.channel === 'email') {
          /*
           * communication-email é responsável pelo envio efetivo.
           */

          const response = await fetch(
            `${supabaseUrl}/functions/v1/communication-email`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
                apikey: serviceRoleKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                delivery_id: delivery.id,
              }),
            }
          );

          const responseText = await response.text();

          if (!response.ok) {
            throw new Error(
              `communication-email retornou ${response.status}: ${responseText}`
            );
          }

          processed++;
          continue;
        }

        /*
         * --------------------------------------------------------
         * IN-APP
         * --------------------------------------------------------
         *
         * Para in-app não existe um provedor externo.
         * A entrega é considerada imediata.
         */

        if (delivery.channel === 'in_app') {
          const now = new Date().toISOString();

          const { data: updatedDelivery, error: updateError } =
            await supabase
              .from('communication_deliveries')
              .update({
                status: 'delivered',
                queued_at: now,
                sent_at: now,
                delivered_at: now,
                updated_at: now,
              })
              .eq('id', delivery.id)
              .eq('status', 'pending')
              .select('id')
              .maybeSingle();

          if (updateError) {
            throw updateError;
          }

          if (!updatedDelivery) {
            /*
             * Outro worker pode ter processado esse delivery.
             */
            skipped++;
            continue;
          }

          processed++;
          continue;
        }

        /*
         * --------------------------------------------------------
         * WHATSAPP
         * --------------------------------------------------------
         *
         * Ainda não existe provider configurado.
         */

        if (delivery.channel === 'whatsapp') {
          const { error: updateError } = await supabase
            .from('communication_deliveries')
            .update({
              status: 'skipped',
              error_code: 'WHATSAPP_NOT_CONFIGURED',
              error_message:
                'WhatsApp ainda não está configurado.',
              updated_at: new Date().toISOString(),
            })
            .eq('id', delivery.id)
            .eq('status', 'pending');

          if (updateError) {
            throw updateError;
          }

          skipped++;
          continue;
        }

        /*
         * --------------------------------------------------------
         * CANAL DESCONHECIDO
         * --------------------------------------------------------
         */

        await supabase
          .from('communication_deliveries')
          .update({
            status: 'skipped',
            error_code: 'CHANNEL_NOT_SUPPORTED',
            error_message:
              `Canal "${delivery.channel}" não é suportado pelo worker.`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)
          .eq('status', 'pending');

        skipped++;
      } catch (error) {
        failed++;

        const message =
          error instanceof Error
            ? error.message
            : String(error);

        await supabase
          .from('communication_deliveries')
          .update({
            status: 'failed',
            error_message: message,
            last_attempt_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)
          .eq('status', 'pending');
      }
    }

    /*
     * ============================================================
     * 3. FINALIZAR CAMPANHAS
     * ============================================================
     *
     * Uma campanha só termina quando não existem mais deliveries
     * pending ou queued.
     */

    const { data: activeCampaigns, error: campaignsError } =
      await supabase
        .from('communication_campaigns')
        .select('id')
        .eq('status', 'sending');

    if (campaignsError) {
      throw campaignsError;
    }

    let completedCampaigns = 0;

    for (const campaign of activeCampaigns ?? []) {
      const { count: remaining, error: remainingError } =
        await supabase
          .from('communication_deliveries')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('campaign_id', campaign.id)
          .in('status', ['pending', 'queued']);

      if (remainingError) {
        throw remainingError;
      }

      if ((remaining ?? 0) === 0) {
        const { data: completed, error: completeError } =
          await supabase
            .from('communication_campaigns')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', campaign.id)
            .eq('status', 'sending')
            .select('id')
            .maybeSingle();

        if (completeError) {
          throw completeError;
        }

        if (completed) {
          completedCampaigns++;
        }
      }
    }

    /*
     * ============================================================
     * 4. RESPOSTA
     * ============================================================
     */

    return new Response(
      JSON.stringify({
        success: true,
        found: deliveries?.length ?? 0,
        processed,
        failed,
        skipped,
        completed_campaigns: completedCampaigns,
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
      'communication-worker error:',
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
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
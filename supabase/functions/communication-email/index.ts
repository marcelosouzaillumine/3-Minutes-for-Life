import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const emailFrom =
  Deno.env.get('EMAIL_FROM') ??
  '3 Minutes for Life <noreply@3minutesforlife.com>';

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: corsHeaders,
    }
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'Método não permitido.',
      },
      405
    );
  }

  try {
    const body = await req.json();

    const deliveryId = body?.delivery_id;

    if (!deliveryId) {
      throw new Error('delivery_id é obrigatório.');
    }

    /*
     * 1. Busca o delivery
     */
    const { data: delivery, error: deliveryError } =
      await supabase
        .from('communication_deliveries')
        .select('*')
        .eq('id', deliveryId)
        .single();

    if (deliveryError) {
      throw deliveryError;
    }

    if (!delivery) {
      throw new Error(
        `Delivery não encontrada: ${deliveryId}`
      );
    }

    /*
     * 2. Valida canal
     */
    if (delivery.channel !== 'email') {
      throw new Error(
        'Delivery não pertence ao canal email.'
      );
    }

    /*
     * 3. Estados que não devem ser reenviados
     *
     * sent/delivered/opened/clicked:
     * já passaram pelo envio.
     *
     * bounced/complained:
     * estados terminais.
     *
     * skipped:
     * não elegível.
     */
    const terminalStatuses = [
      'sent',
      'delivered',
      'opened',
      'clicked',
      'bounced',
      'complained',
      'skipped',
    ];

    if (terminalStatuses.includes(delivery.status)) {
      return jsonResponse({
        success: true,
        skipped: true,
        reason: 'terminal_status',
        current_status: delivery.status,
        delivery_id: deliveryId,
      });
    }

    /*
     * 4. Valida destinatário
     */
    if (!delivery.recipient_email) {
      throw new Error(
        'Destinatário sem e-mail.'
      );
    }

    /*
     * 5. Valida Resend
     */
    if (!resendApiKey) {
      throw new Error(
        'RESEND_API_KEY não configurada.'
      );
    }

    /*
     * 6. Incrementa tentativa e coloca em queued
     *
     * O update também verifica o status atual.
     * Isso reduz o risco de dois workers enviarem
     * o mesmo e-mail simultaneamente.
     */
    const attemptCount =
      (delivery.attempt_count ?? 0) + 1;

    const now =
      new Date().toISOString();

    const { data: queuedDelivery, error: queueError } =
      await supabase
        .from('communication_deliveries')
        .update({
          status: 'queued',
          queued_at: now,
          attempt_count: attemptCount,
          last_attempt_at: now,
        })
        .eq('id', deliveryId)
        .eq('status', delivery.status)
        .select('id')
        .maybeSingle();

    if (queueError) {
      throw queueError;
    }

    /*
     * Se não conseguiu assumir o delivery,
     * outro worker provavelmente já assumiu.
     */
    if (!queuedDelivery) {
      return jsonResponse({
        success: true,
        skipped: true,
        reason: 'delivery_already_claimed',
        delivery_id: deliveryId,
      });
    }

    /*
     * 7. Monta HTML
     */
    const html = `
<!DOCTYPE html>
<html lang="${delivery.language ?? 'pt-BR'}">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    ${delivery.subject ?? delivery.title ?? '3 Minutes for Life'}
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f7f7f5;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:640px;
      margin:0 auto;
      padding:40px 24px;
    "
  >

    <div
      style="
        background:#ffffff;
        padding:40px;
        border-radius:12px;
      "
    >

      ${
        delivery.title
          ? `
            <h1
              style="
                font-size:28px;
                line-height:1.25;
                margin:0 0 24px;
              "
            >
              ${delivery.title}
            </h1>
          `
          : ''
      }

      <div
        style="
          font-size:16px;
          line-height:1.7;
          color:#222;
        "
      >
        ${delivery.body ?? ''}
      </div>

      ${
        delivery.cta_label &&
        delivery.cta_url
          ? `
            <div style="margin-top:32px;">

              <a
                href="${delivery.cta_url}"
                style="
                  display:inline-block;
                  padding:14px 22px;
                  background:#111111;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                "
              >
                ${delivery.cta_label}
              </a>

            </div>
          `
          : ''
      }

    </div>

    <div
      style="
        padding:24px 8px;
        text-align:center;
        font-size:12px;
        color:#777;
      "
    >
      3 Minutes for Life
    </div>

  </div>

</body>
</html>
`;

    /*
     * 8. Envia para o Resend
     */
    const response = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${resendApiKey}`,

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          from: emailFrom,

          to: [
            delivery.recipient_email,
          ],

          subject:
            delivery.subject ??
            delivery.title ??
            '3 Minutes for Life',

          html,
        }),
      }
    );

    const responseText =
      await response.text();

    let result: Record<
      string,
      unknown
    > = {};

    try {
      result = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      result = {
        raw_response: responseText,
      };
    }

    /*
     * 9. Trata erro do Resend
     */
    if (!response.ok) {
      const resendError =
        typeof result.message === 'string'
          ? result.message
          : JSON.stringify(result);

      await supabase
        .from('communication_deliveries')
        .update({
          status: 'failed',
          error_code:
            String(response.status),
          error_message:
            resendError,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', deliveryId);

      throw new Error(
        `Resend ${response.status}: ${resendError}`
      );
    }

    /*
     * 10. Obtém ID do Resend
     */
    const providerMessageId =
      typeof result.id === 'string'
        ? result.id
        : null;

    if (!providerMessageId) {
      throw new Error(
        `Resend não retornou provider_message_id. Resposta: ${JSON.stringify(result)}`
      );
    }

    /*
     * 11. Marca como enviado
     */
    const sentAt =
      new Date().toISOString();

    const { error: sentError } =
      await supabase
        .from('communication_deliveries')
        .update({
          status: 'sent',

          provider: 'resend',

          provider_message_id:
            providerMessageId,

          sent_at:
            sentAt,

          error_code: null,

          error_message: null,

          updated_at:
            sentAt,
        })
        .eq('id', deliveryId);

    if (sentError) {
      throw sentError;
    }

    /*
     * 12. Retorno
     */
    return jsonResponse({
      success: true,
      delivery_id: deliveryId,
      provider: 'resend',
      provider_message_id:
        providerMessageId,
      status: 'sent',
    });

  } catch (error) {

    console.error(
      'COMMUNICATION EMAIL ERROR:',
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : JSON.stringify(error);

    return jsonResponse(
      {
        success: false,
        error: errorMessage,
      },
      500
    );
  }
});
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get(
  'SUPABASE_SERVICE_ROLE_KEY'
)!;

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
  'Access-Control-Allow-Methods':
    'POST, OPTIONS',
};

const SUPPORTED_LANGUAGES = [
  'pt-BR',
  'en',
  'es',
];

/*
 * ================================================================
 * PURPOSE
 * ================================================================
 */

function getPurpose(campaignType: string): string {
  return campaignType === 'project_support'
    ? 'project_support'
    : 'devotional_updates';
}

/*
 * ================================================================
 * RESPONSE
 * ================================================================
 */

function jsonResponse(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type':
          'application/json',
      },
    }
  );
}

/*
 * ================================================================
 * MAIN
 * ================================================================
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
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
    /*
     * ============================================================
     * 1. INPUT
     * ============================================================
     */

    const body = await req.json();

    const campaign_id =
      body?.campaign_id;

    if (!campaign_id) {
      throw new Error(
        'campaign_id é obrigatório.'
      );
    }

    /*
     * ============================================================
     * 2. CAMPANHA
     * ============================================================
     */

    const {
      data: campaign,
      error: campaignError,
    } = await supabase
      .from(
        'communication_campaigns'
      )
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError) {
      throw campaignError;
    }

    if (!campaign) {
      throw new Error(
        'Campanha não encontrada.'
      );
    }

    if (
      ['cancelled', 'completed'].includes(
        campaign.status
      )
    ) {
      throw new Error(
        `Campanha não pode ser executada no status ${campaign.status}.`
      );
    }

    /*
     * ============================================================
     * 3. PURPOSE
     * ============================================================
     */

    const purpose =
      getPurpose(campaign.type);

    /*
     * ============================================================
     * 4. CANAIS
     * ============================================================
     */

    const {
      data: channels,
      error: channelsError,
    } = await supabase
      .from(
        'communication_campaign_channels'
      )
      .select(
        'channel, enabled'
      )
      .eq(
        'campaign_id',
        campaign_id
      )
      .eq(
        'enabled',
        true
      );

    if (channelsError) {
      throw channelsError;
    }

    const enabledChannels = [
      ...new Set(
        (channels ?? [])
          .map(
            (channel) =>
              channel.channel
          )
      ),
    ];

    if (!enabledChannels.length) {
      throw new Error(
        'Nenhum canal habilitado para esta campanha.'
      );
    }

    /*
     * ============================================================
     * 5. AUDIÊNCIAS
     * ============================================================
     */

    const {
      data: relations,
      error: relationsError,
    } = await supabase
      .from(
        'communication_campaign_audiences'
      )
      .select(
        'audience_id'
      )
      .eq(
        'campaign_id',
        campaign_id
      );

    if (relationsError) {
      throw relationsError;
    }

    const audienceIds = [
      ...new Set(
        (relations ?? [])
          .map(
            (relation) =>
              relation.audience_id
          )
      ),
    ];

    if (!audienceIds.length) {
      throw new Error(
        'Nenhuma audiência selecionada.'
      );
    }

    const {
      data: audiences,
      error: audiencesError,
    } = await supabase
      .from(
        'communication_audiences'
      )
      .select('*')
      .in(
        'id',
        audienceIds
      );

    if (audiencesError) {
      throw audiencesError;
    }

    /*
     * ============================================================
     * 6. PROFILES
     * ============================================================
     */

    const {
      data: profiles,
      error: profilesError,
    } = await supabase
      .from('profiles')
      .select(
        'id, phone, preferred_language'
      );

    if (profilesError) {
      throw profilesError;
    }

    /*
     * ============================================================
     * 7. AUTH USERS
     * ============================================================
     */

    const {
      data: authUsers,
      error: authUsersError,
    } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authUsersError) {
      throw authUsersError;
    }

    const authUserMap =
      new Map<
        string,
        {
          email: string | null;
        }
      >(
        authUsers.users.map(
          (user) => [
            user.id,
            {
              email:
                user.email ??
                null,
            },
          ]
        )
      );

    /*
     * ============================================================
     * 8. SUPPORTERS
     * ============================================================
     */

    const {
      data: supporters,
      error: supportersError,
    } =
      await supabase
        .from('supporters')
        .select(
          'user_id'
        );

    if (supportersError) {
      throw supportersError;
    }

    const supporterIds =
      new Set(
        (supporters ?? [])
          .map(
            (supporter) =>
              supporter.user_id
          )
      );

    /*
     * ============================================================
     * 9. ATIVOS / INATIVOS
     * ============================================================
     */

    let activeUserIds =
      new Set<string>();

    const hasInactiveAudience =
      (audiences ?? []).some(
        (audience) =>
          audience.type ===
          'inactive'
      );

    if (hasInactiveAudience) {
      const cutoff =
        new Date(
          Date.now() -
            30 *
              24 *
              60 *
              60 *
              1000
        );

      const {
        data: recentEvents,
        error: eventsError,
      } =
        await supabase
          .from('app_events')
          .select(
            'user_id'
          )
          .gte(
            'occurred_at',
            cutoff.toISOString()
          )
          .not(
            'user_id',
            'is',
            null
          );

      if (eventsError) {
        throw eventsError;
      }

      activeUserIds =
        new Set(
          (recentEvents ?? [])
            .map(
              (event) =>
                event.user_id
            )
            .filter(Boolean)
        );
    }

    /*
     * ============================================================
     * 10. CONSENTIMENTOS
     * ============================================================
     *
     * Uma única consulta para todos os usuários.
     */

    const {
      data: consents,
      error: consentsError,
    } =
      await supabase
        .from(
          'current_communication_consents'
        )
        .select(
          `
            user_id,
            channel,
            purpose,
            granted,
            policy_version,
            source,
            occurred_at
          `
        )
        .eq(
          'purpose',
          purpose
        );

    if (consentsError) {
      throw consentsError;
    }

    /*
     * ============================================================
     * 11. MAPA DE CONSENTIMENTOS
     * ============================================================
     */

    const consentMap =
      new Map<
        string,
        boolean
      >();

    for (
      const consent of
        consents ?? []
    ) {
      const key =
        `${consent.user_id}:${consent.channel}:${consent.purpose}`;

      consentMap.set(
        key,
        consent.granted === true
      );
    }

    /*
     * ============================================================
     * 12. USUÁRIOS SELECIONADOS
     * ============================================================
     */

    const users =
      new Map<
        string,
        {
          id: string;
          email: string | null;
          phone: string | null;
          language: string;
        }
      >();

    for (
      const profile of
        profiles ?? []
    ) {
      const authUser =
        authUserMap.get(
          profile.id
        );

      const user = {
        id: profile.id,

        email:
          authUser?.email ??
          null,

        phone:
          profile.phone ??
          null,

        language:
          profile.preferred_language ??
          campaign.language ??
          'pt-BR',
      };

      let selected =
        false;

      for (
        const audience of
          audiences ?? []
      ) {
        if (
          audience.type ===
          'supporters'
        ) {
          if (
            supporterIds.has(
              profile.id
            )
          ) {
            selected = true;
          }
        } else if (
          audience.type ===
          'inactive'
        ) {
          if (
            !activeUserIds.has(
              profile.id
            )
          ) {
            selected = true;
          }
        } else {
          selected = true;
        }
      }

      if (selected) {
        users.set(
          profile.id,
          user
        );
      }
    }

    /*
     * ============================================================
     * 13. TRADUÇÕES
     * ============================================================
     */

    const {
      data: translations,
      error: translationsError,
    } =
      await supabase
        .from(
          'communication_campaign_translations'
        )
        .select('*')
        .eq(
          'campaign_id',
          campaign_id
        );

    if (translationsError) {
      throw translationsError;
    }

    const translationMap =
      new Map(
        (translations ?? [])
          .map(
            (translation) => [
              translation.language,
              translation,
            ]
          )
      );

    /*
     * ============================================================
     * 14. DELIVERIES
     * ============================================================
     */

    const deliveries = [];

    let emailEligible = 0;
    let emailSkipped = 0;

    let whatsappEligible = 0;
    let whatsappSkipped = 0;

    for (
      const user of
        users.values()
    ) {
      const language =
        SUPPORTED_LANGUAGES.includes(
          user.language
        )
          ? user.language
          : campaign.language;

      const translation =
        translationMap.get(
          language
        ) ??
        translationMap.get(
          campaign.language
        );

      const content =
        translation ??
        campaign;

      for (
        const channel of
          enabledChannels
      ) {
        let eligible =
          true;

        /*
         * --------------------------------------------------------
         * EMAIL
         * --------------------------------------------------------
         */

        if (
          channel ===
          'email'
        ) {
          const consentKey =
            `${user.id}:email:${purpose}`;

          const hasConsent =
            consentMap.get(
              consentKey
            ) === true;

          eligible =
            Boolean(
              user.email &&
              hasConsent
            );

          if (eligible) {
            emailEligible++;
          } else {
            emailSkipped++;
          }
        }

        /*
         * --------------------------------------------------------
         * WHATSAPP
         * --------------------------------------------------------
         */

        if (
          channel ===
          'whatsapp'
        ) {
          const consentKey =
            `${user.id}:whatsapp:${purpose}`;

          const hasConsent =
            consentMap.get(
              consentKey
            ) === true;

          eligible =
            Boolean(
              user.phone &&
              hasConsent
            );

          if (eligible) {
            whatsappEligible++;
          } else {
            whatsappSkipped++;
          }
        }

        /*
         * --------------------------------------------------------
         * DELIVERY
         * --------------------------------------------------------
         */

        deliveries.push({
          campaign_id,

          user_id:
            user.id,

          channel,

          status:
            eligible
              ? 'pending'
              : 'skipped',

          language,

          subject:
            content.subject ??
            null,

          title:
            content.title ??
            null,

          body:
            content.body ??
            '',

          cta_label:
            content.cta_label ??
            null,

          cta_url:
            content.cta_url ??
            campaign.cta_url ??
            null,

          recipient_email:
            channel ===
            'email'
              ? user.email
              : null,

          recipient_phone:
            channel ===
            'whatsapp'
              ? user.phone
              : null,
        });
      }
    }

    /*
     * ============================================================
     * 15. UPSERT
     * ============================================================
     */

    if (
      deliveries.length
    ) {
      const {
        error:
          deliveryError,
      } =
        await supabase
          .from(
            'communication_deliveries'
          )
          .upsert(
            deliveries,
            {
              onConflict:
                'campaign_id,user_id,channel',
            }
          );

      if (
        deliveryError
      ) {
        throw deliveryError;
      }
    }

    /*
     * ============================================================
     * 16. INICIAR CAMPANHA
     * ============================================================
     */

    const {
      data:
        updatedCampaign,
      error:
        updateError,
    } =
      await supabase
        .from(
          'communication_campaigns'
        )
        .update({
          status:
            'sending',

          started_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          campaign_id
        )
        .not(
          'status',
          'in',
          '("cancelled","completed")'
        )
        .select('id')
        .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (
      !updatedCampaign
    ) {
      throw new Error(
        'A campanha não pôde ser colocada em estado sending.'
      );
    }

    /*
     * ============================================================
     * 17. RESULTADO
     * ============================================================
     */

    return jsonResponse({
      success: true,

      campaign_id,

      users:
        users.size,

      deliveries:
        deliveries.length,

      channels:
        enabledChannels,

      purpose,

      email: {
        eligible:
          emailEligible,
        skipped:
          emailSkipped,
      },

      whatsapp: {
        eligible:
          whatsappEligible,
        skipped:
          whatsappSkipped,
      },

      consents_loaded:
        consents?.length ??
        0,
    });
  } catch (error) {
    console.error(
      'communication-dispatch error:',
      error
    );

    return jsonResponse(
      {
        success: false,

        error:
          error instanceof
          Error
            ? error.message
            : String(
                error
              ),
      },
      500
    );
  }
});
import { supabase } from '../lib/supabase';

import type {
    CommunicationAudience,
    CommunicationCampaign,
    CommunicationCampaignChannel,
    CommunicationCampaignStats,
    CommunicationDeliveryChannel,
    CommunicationLanguage,
    CommunicationSendResult,
} from '../types/Communication';


// =============================================================
// INPUTS
// =============================================================

export interface CreateCampaignInput {
    name: string;

    type: CommunicationCampaign['type'];

    language: CommunicationCampaign['language'];

    subject?: string | null;

    title?: string | null;

    body: string;

    cta_label?: string | null;

    cta_url?: string | null;

    scheduled_at?: string | null;

    channels?: CommunicationDeliveryChannel[];

    audience_ids?: string[];
}


export interface UpdateCampaignInput
    extends Partial<CreateCampaignInput> {

    status?: CommunicationCampaign['status'];
}


// =============================================================
// TRANSLATIONS
// =============================================================

export interface CommunicationCampaignTranslation {

    id: string;

    campaign_id: string;

    language: CommunicationLanguage;

    subject: string | null;

    title: string | null;

    body: string;

    cta_label: string | null;

    created_at: string;

    updated_at: string;
}


export interface UpsertCampaignTranslationInput {

    campaign_id: string;

    language: CommunicationLanguage;

    subject?: string | null;

    title?: string | null;

    body: string;

    cta_label?: string | null;
}


// =============================================================
// SERVICE
// =============================================================

class AdminCommunicationService {


    // =========================================================
    // CAMPAIGNS
    // =========================================================

    async listCampaigns(): Promise<CommunicationCampaign[]> {

        const {
            data,
            error,
        } = await supabase
            .from('communication_campaigns')
            .select('*')
            .order('created_at', {
                ascending: false,
            });


        if (error) {
            throw error;
        }


        return (
            data ?? []
        ) as CommunicationCampaign[];
    }


    async getCampaign(
        id: string
    ): Promise<CommunicationCampaign | null> {

        const {
            data,
            error,
        } = await supabase
            .from('communication_campaigns')
            .select('*')
            .eq('id', id)
            .maybeSingle();


        if (error) {
            throw error;
        }


        return data as CommunicationCampaign | null;
    }


    async createCampaign(
        input: CreateCampaignInput
    ): Promise<CommunicationCampaign> {

        // -----------------------------------------------------
        // Auth
        // -----------------------------------------------------

        const {
            data: userData,
            error: userError,
        } = await supabase.auth.getUser();


        if (userError) {
            throw userError;
        }


        if (!userData.user) {

            throw new Error(
                'Usuário não autenticado.'
            );
        }


        // -----------------------------------------------------
        // Campaign
        // -----------------------------------------------------

        const {
            data,
            error,
        } = await supabase
            .from('communication_campaigns')
            .insert({

                name:
                    input.name,

                type:
                    input.type,

                language:
                    input.language,

                subject:
                    input.subject ?? null,

                title:
                    input.title ?? null,

                body:
                    input.body,

                cta_label:
                    input.cta_label ?? null,

                cta_url:
                    input.cta_url ?? null,

                scheduled_at:
                    input.scheduled_at ?? null,

                created_by:
                    userData.user.id,

                status:
                    'draft',
            })
            .select()
            .single();


        if (error) {
            throw error;
        }


        const campaign =
            data as CommunicationCampaign;


        // -----------------------------------------------------
        // Channels
        // -----------------------------------------------------

        if (
            input.channels !== undefined
        ) {

            await this.setCampaignChannels(
                campaign.id,
                input.channels
            );
        }


        // -----------------------------------------------------
        // Audiences
        // -----------------------------------------------------

        if (
            input.audience_ids !== undefined
        ) {

            await this.setCampaignAudiences(
                campaign.id,
                input.audience_ids
            );
        }


        return campaign;
    }


    async updateCampaign(
        id: string,
        input: UpdateCampaignInput
    ): Promise<CommunicationCampaign> {

        const updatePayload: Record<
            string,
            unknown
        > = {};


        // -----------------------------------------------------
        // Basic fields
        // -----------------------------------------------------

        if (
            input.name !== undefined
        ) {

            updatePayload.name =
                input.name;
        }


        if (
            input.type !== undefined
        ) {

            updatePayload.type =
                input.type;
        }


        if (
            input.language !== undefined
        ) {

            updatePayload.language =
                input.language;
        }


        if (
            input.subject !== undefined
        ) {

            updatePayload.subject =
                input.subject;
        }


        if (
            input.title !== undefined
        ) {

            updatePayload.title =
                input.title;
        }


        if (
            input.body !== undefined
        ) {

            updatePayload.body =
                input.body;
        }


        // -----------------------------------------------------
        // CTA
        // -----------------------------------------------------

        if (
            input.cta_label !== undefined
        ) {

            updatePayload.cta_label =
                input.cta_label;
        }


        if (
            input.cta_url !== undefined
        ) {

            updatePayload.cta_url =
                input.cta_url;
        }


        // -----------------------------------------------------
        // Scheduling
        // -----------------------------------------------------

        if (
            input.scheduled_at !== undefined
        ) {

            updatePayload.scheduled_at =
                input.scheduled_at;
        }


        // -----------------------------------------------------
        // Status
        // -----------------------------------------------------

        if (
            input.status !== undefined
        ) {

            updatePayload.status =
                input.status;
        }


        // -----------------------------------------------------
        // Update campaign
        // -----------------------------------------------------

        let campaign: CommunicationCampaign;


        if (
            Object.keys(updatePayload).length > 0
        ) {

            const {
                data,
                error,
            } = await supabase
                .from(
                    'communication_campaigns'
                )
                .update(
                    updatePayload
                )
                .eq(
                    'id',
                    id
                )
                .select()
                .single();


            if (error) {
                throw error;
            }


            campaign =
                data as CommunicationCampaign;

        } else {

            const existing =
                await this.getCampaign(id);


            if (!existing) {

                throw new Error(
                    'Campanha não encontrada.'
                );
            }


            campaign =
                existing;
        }


        // -----------------------------------------------------
        // Channels
        // -----------------------------------------------------

        if (
            input.channels !== undefined
        ) {

            await this.setCampaignChannels(
                id,
                input.channels
            );
        }


        // -----------------------------------------------------
        // Audiences
        // -----------------------------------------------------

        if (
            input.audience_ids !== undefined
        ) {

            await this.setCampaignAudiences(
                id,
                input.audience_ids
            );
        }


        return campaign;
    }


    async deleteCampaign(
        id: string
    ): Promise<void> {

        const {
            error,
        } = await supabase
            .from(
                'communication_campaigns'
            )
            .delete()
            .eq(
                'id',
                id
            );


        if (error) {
            throw error;
        }
    }


    // =========================================================
    // TRANSLATIONS
    // =========================================================

    /**
     * Lista todas as traduções de uma campanha.
     */
    async listCampaignTranslations(
        campaignId: string
    ): Promise<CommunicationCampaignTranslation[]> {

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_translations'
            )
            .select('*')
            .eq(
                'campaign_id',
                campaignId
            )
            .order(
                'language',
                {
                    ascending: true,
                }
            );


        if (error) {
            throw error;
        }


        return (
            data ?? []
        ) as CommunicationCampaignTranslation[];
    }


    /**
     * Busca uma tradução específica.
     */
    async getCampaignTranslation(
        campaignId: string,
        language: CommunicationLanguage
    ): Promise<CommunicationCampaignTranslation | null> {

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_translations'
            )
            .select('*')
            .eq(
                'campaign_id',
                campaignId
            )
            .eq(
                'language',
                language
            )
            .maybeSingle();


        if (error) {
            throw error;
        }


        return (
            data as
            CommunicationCampaignTranslation | null
        );
    }


    /**
     * Cria ou atualiza uma tradução.
     *
     * A combinação campaign_id + language é única
     * no banco de dados.
     */
    async upsertCampaignTranslation(
        input: UpsertCampaignTranslationInput
    ): Promise<CommunicationCampaignTranslation> {

        // -----------------------------------------------------
        // Validation
        // -----------------------------------------------------

        if (
            !input.campaign_id
        ) {

            throw new Error(
                'Campanha não informada.'
            );
        }


        if (
            !input.language
        ) {

            throw new Error(
                'Idioma da tradução não informado.'
            );
        }


        if (
            !input.body ||
            !input.body.trim()
        ) {

            throw new Error(
                'O conteúdo da tradução é obrigatório.'
            );
        }


        // -----------------------------------------------------
        // Verify campaign
        // -----------------------------------------------------

        const campaign =
            await this.getCampaign(
                input.campaign_id
            );


        if (!campaign) {

            throw new Error(
                'Campanha não encontrada.'
            );
        }


        // -----------------------------------------------------
        // Upsert
        // -----------------------------------------------------

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_translations'
            )
            .upsert(
                {
                    campaign_id:
                        input.campaign_id,

                    language:
                        input.language,

                    subject:
                        input.subject ?? null,

                    title:
                        input.title ?? null,

                    body:
                        input.body,

                    cta_label:
                        input.cta_label ?? null,
                },
                {
                    onConflict:
                        'campaign_id,language',
                }
            )
            .select()
            .single();


        if (error) {
            throw error;
        }


        return (
            data
        ) as CommunicationCampaignTranslation;
    }


    /**
     * Atualiza uma tradução existente.
     */
    async updateCampaignTranslation(
        id: string,
        input: Partial<
            Omit<
                UpsertCampaignTranslationInput,
                'campaign_id'
            >
        >
    ): Promise<CommunicationCampaignTranslation> {

        const updatePayload: Record<
            string,
            unknown
        > = {};


        if (
            input.language !== undefined
        ) {

            updatePayload.language =
                input.language;
        }


        if (
            input.subject !== undefined
        ) {

            updatePayload.subject =
                input.subject;
        }


        if (
            input.title !== undefined
        ) {

            updatePayload.title =
                input.title;
        }


        if (
            input.body !== undefined
        ) {

            if (
                !input.body.trim()
            ) {

                throw new Error(
                    'O conteúdo da tradução não pode ficar vazio.'
                );
            }


            updatePayload.body =
                input.body;
        }


        if (
            input.cta_label !== undefined
        ) {

            updatePayload.cta_label =
                input.cta_label;
        }


        if (
            Object.keys(updatePayload).length === 0
        ) {

            const {
                data,
                error,
            } = await supabase
                .from(
                    'communication_campaign_translations'
                )
                .select('*')
                .eq(
                    'id',
                    id
                )
                .single();


            if (error) {
                throw error;
            }


            return (
                data
            ) as CommunicationCampaignTranslation;
        }


        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_translations'
            )
            .update(
                updatePayload
            )
            .eq(
                'id',
                id
            )
            .select()
            .single();


        if (error) {
            throw error;
        }


        return (
            data
        ) as CommunicationCampaignTranslation;
    }


    /**
     * Remove uma tradução.
     */
    async deleteCampaignTranslation(
        id: string
    ): Promise<void> {

        const {
            error,
        } = await supabase
            .from(
                'communication_campaign_translations'
            )
            .delete()
            .eq(
                'id',
                id
            );


        if (error) {
            throw error;
        }
    }


    /**
     * Remove uma tradução pelo idioma.
     *
     * Útil para o editor.
     */
    async deleteCampaignTranslationByLanguage(
        campaignId: string,
        language: CommunicationLanguage
    ): Promise<void> {

        const {
            error,
        } = await supabase
            .from(
                'communication_campaign_translations'
            )
            .delete()
            .eq(
                'campaign_id',
                campaignId
            )
            .eq(
                'language',
                language
            );


        if (error) {
            throw error;
        }
    }


    // =========================================================
    // CHANNELS
    // =========================================================

    async getCampaignChannels(
        campaignId: string
    ): Promise<CommunicationCampaignChannel[]> {

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_channels'
            )
            .select('*')
            .eq(
                'campaign_id',
                campaignId
            )
            .order(
                'created_at',
                {
                    ascending: true,
                }
            );


        if (error) {
            throw error;
        }


        return (
            data ?? []
        ) as CommunicationCampaignChannel[];
    }


    async setChannel(
        campaignId: string,
        channel: CommunicationDeliveryChannel,
        enabled: boolean
    ): Promise<void> {

        const {
            error,
        } = await supabase
            .from(
                'communication_campaign_channels'
            )
            .upsert(
                {
                    campaign_id:
                        campaignId,

                    channel,

                    enabled,
                },
                {
                    onConflict:
                        'campaign_id,channel',
                }
            );


        if (error) {
            throw error;
        }
    }


    async setCampaignChannels(
        campaignId: string,
        channels: CommunicationDeliveryChannel[]
    ): Promise<void> {

        const allChannels:
            CommunicationDeliveryChannel[] = [
                'in_app',
                'email',
                'whatsapp',
            ];


        const selectedChannels =
            Array.from(
                new Set(
                    channels
                )
            );


        await Promise.all(
            allChannels.map(
                (
                    channel
                ) =>
                    this.setChannel(
                        campaignId,
                        channel,
                        selectedChannels.includes(
                            channel
                        )
                    )
            )
        );
    }


    // =========================================================
    // AUDIENCES
    // =========================================================

    async listAudiences(): Promise<
        CommunicationAudience[]
    > {

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_audiences'
            )
            .select('*')
            .order(
                'name',
                {
                    ascending: true,
                }
            );


        if (error) {
            throw error;
        }


        return (
            data ?? []
        ) as CommunicationAudience[];
    }


    async getAudience(
        id: string
    ): Promise<CommunicationAudience | null> {

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_audiences'
            )
            .select('*')
            .eq(
                'id',
                id
            )
            .maybeSingle();


        if (error) {
            throw error;
        }


        return (
            data as CommunicationAudience | null
        );
    }


    async getCampaignAudienceIds(
        campaignId: string
    ): Promise<string[]> {

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_audiences'
            )
            .select(
                'audience_id'
            )
            .eq(
                'campaign_id',
                campaignId
            );


        if (error) {
            throw error;
        }


        return (
            data ?? []
        )
            .map(
                (
                    row
                ) =>
                    row.audience_id as string
            );
    }


    async getCampaignAudiences(
        campaignId: string
    ): Promise<CommunicationAudience[]> {

        const audienceIds =
            await this.getCampaignAudienceIds(
                campaignId
            );


        if (
            audienceIds.length === 0
        ) {

            return [];
        }


        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_audiences'
            )
            .select('*')
            .in(
                'id',
                audienceIds
            )
            .order(
                'name',
                {
                    ascending: true,
                }
            );


        if (error) {
            throw error;
        }


        return (
            data ?? []
        ) as CommunicationAudience[];
    }


    async setCampaignAudiences(
        campaignId: string,
        audienceIds: string[]
    ): Promise<void> {

        // -----------------------------------------------------
        // Remove duplicates and empty values
        // -----------------------------------------------------

        const uniqueAudienceIds =
            Array.from(
                new Set(
                    audienceIds.filter(
                        Boolean
                    )
                )
            );


        // -----------------------------------------------------
        // Remove current relations
        // -----------------------------------------------------

        const {
            error: deleteError,
        } = await supabase
            .from(
                'communication_campaign_audiences'
            )
            .delete()
            .eq(
                'campaign_id',
                campaignId
            );


        if (deleteError) {
            throw deleteError;
        }


        // -----------------------------------------------------
        // Nothing else to insert
        // -----------------------------------------------------

        if (
            uniqueAudienceIds.length === 0
        ) {

            return;
        }


        // -----------------------------------------------------
        // Insert new relations
        // -----------------------------------------------------

        const rows =
            uniqueAudienceIds.map(
                (
                    audienceId
                ) => ({

                    campaign_id:
                        campaignId,

                    audience_id:
                        audienceId,
                })
            );


        const {
            error: insertError,
        } = await supabase
            .from(
                'communication_campaign_audiences'
            )
            .insert(
                rows
            );


        if (insertError) {
            throw insertError;
        }
    }


    // =========================================================
    // PREVIEW / SEND
    // =========================================================

    /**
     * Retorna a quantidade de destinatários quando a infraestrutura
     * de contagem estiver disponível.
     *
     * A tabela `communication_campaign_recipient_counts` não faz
     * parte do schema atual do banco remoto. Portanto, não podemos
     * utilizá-la como requisito para iniciar uma campanha.
     *
     * O processamento efetivo dos destinatários fica a cargo da
     * Edge Function `communication-dispatch`.
     *
     * Retorno:
     *
     *  > 0  = quantidade conhecida
     *  = 0  = nenhum destinatário
     *  < 0  = quantidade ainda não disponível
     */
    async getCampaignRecipientCount(
        campaignId: string
    ): Promise<number> {

        if (
            !campaignId
        ) {

            return 0;
        }


        /*
         * A contagem não deve bloquear o envio enquanto a tabela
         * agregadora não existir no schema remoto.
         *
         * Tentamos consultar a tabela para manter compatibilidade
         * com ambientes que eventualmente ainda a possuam.
         */

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_recipient_counts'
            )
            .select(
                'total_recipients'
            )
            .eq(
                'campaign_id',
                campaignId
            )
            .maybeSingle();


        /*
         * PGRST205 = relação/tabela não encontrada no schema cache.
         *
         * Nesse caso não tratamos como erro de envio.
         * A Edge Function fará a resolução efetiva dos destinatários.
         */
        if (
            error
        ) {

            if (
                error.code === 'PGRST205'
            ) {

                console.warn(
                    '[Communication] A tabela communication_campaign_recipient_counts não existe no schema remoto. A validação seguirá sem contagem prévia.'
                );

                return -1;
            }


            throw error;
        }


        return (
            data?.total_recipients ?? 0
        );
    }


    async validateCampaignForSending(
        campaignId: string
    ): Promise<void> {

        // -----------------------------------------------------
        // Campaign
        // -----------------------------------------------------

        const campaign =
            await this.getCampaign(
                campaignId
            );


        if (!campaign) {

            throw new Error(
                'Campanha não encontrada.'
            );
        }


        // -----------------------------------------------------
        // Status
        // -----------------------------------------------------

        if (
            campaign.status === 'sending'
        ) {

            throw new Error(
                'Esta campanha já está sendo enviada.'
            );
        }


        if (
            campaign.status === 'completed'
        ) {

            throw new Error(
                'Esta campanha já foi enviada.'
            );
        }


        // -----------------------------------------------------
        // Content
        // -----------------------------------------------------

        if (
            !campaign.body ||
            !campaign.body.trim()
        ) {

            throw new Error(
                'O conteúdo da campanha está vazio.'
            );
        }


        // -----------------------------------------------------
        // Channels
        // -----------------------------------------------------

        const channels =
            await this.getCampaignChannels(
                campaignId
            );


        const enabledChannels =
            channels.filter(
                channel =>
                    channel.enabled
            );


        if (
            enabledChannels.length === 0
        ) {

            throw new Error(
                'Selecione pelo menos um canal de envio.'
            );
        }


        // -----------------------------------------------------
        // Audiences
        // -----------------------------------------------------

        const audiences =
            await this.getCampaignAudiences(
                campaignId
            );


        if (
            audiences.length === 0
        ) {

            throw new Error(
                'Selecione pelo menos um público.'
            );
        }


        // -----------------------------------------------------
        // Recipient count
        // -----------------------------------------------------

        const recipientCount =
            await this.getCampaignRecipientCount(
                campaignId
            );


        /*
         * Quando a quantidade é conhecida e é zero, bloqueamos
         * corretamente o envio.
         *
         * Quando retorna -1, significa que a tabela agregadora
         * não existe. Nesse cenário a validação continua e a
         * Edge Function será responsável por resolver os
         * destinatários.
         */
        if (
            recipientCount === 0
        ) {

            throw new Error(
                'Nenhum destinatário elegível foi encontrado.'
            );
        }
    }


    async sendCampaign(
        campaignId: string
    ): Promise<CommunicationSendResult> {

        // -----------------------------------------------------
        // Validation
        // -----------------------------------------------------

        await this.validateCampaignForSending(
            campaignId
        );


        // -----------------------------------------------------
        // Dispatch
        // -----------------------------------------------------

        const {
            data,
            error,
        } = await supabase.functions.invoke(
            'communication-dispatch',
            {
                body: {
                    campaign_id:
                        campaignId,
                },
            }
        );


        if (error) {
            throw error;
        }


        if (
            !data?.success
        ) {

            throw new Error(
                data?.error ??
                'Não foi possível iniciar o envio.'
            );
        }


        // -----------------------------------------------------
        // Result
        // -----------------------------------------------------

        return {

            campaign_id:
                campaignId,

            total_recipients:
                data.users ?? 0,

            total_deliveries:
                data.deliveries ?? 0,

            status:
                'sending',
        };
    }


    async completeCampaign(
        campaignId: string
    ): Promise<void> {

        const {
            error,
        } = await supabase
            .from(
                'communication_campaigns'
            )
            .update({

                status:
                    'completed',

                completed_at:
                    new Date().toISOString(),

            })
            .eq(
                'id',
                campaignId
            );


        if (error) {
            throw error;
        }
    }


    // =========================================================
    // STATS
    // =========================================================

    async getCampaignStats(): Promise<
        CommunicationCampaignStats[]
    > {

        const {
            data,
            error,
        } = await supabase
            .from(
                'communication_campaign_stats'
            )
            .select('*')
            .order(
                'name'
            );


        if (error) {
            throw error;
        }


        return (
            data ?? []
        ) as CommunicationCampaignStats[];
    }
}


// =============================================================
// SINGLETON
// =============================================================

export const adminCommunicationService =
    new AdminCommunicationService();
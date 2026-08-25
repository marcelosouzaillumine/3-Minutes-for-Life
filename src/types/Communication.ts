// =============================================================
// 3 MINUTES FOR LIFE
// Communication Center — Types
// =============================================================


// =============================================================
// STATUS
// =============================================================

export type CommunicationCampaignStatus =
    | 'draft'
    | 'scheduled'
    | 'sending'
    | 'completed'
    | 'cancelled'
    | 'failed';


// =============================================================
// CAMPAIGN TYPE
// =============================================================

export type CommunicationCampaignType =
    | 'devotional_update'
    | 'project_support'
    | 'announcement'
    | 'engagement'
    | 'custom';


// =============================================================
// DELIVERY CHANNEL
// =============================================================

export type CommunicationDeliveryChannel =
    | 'in_app'
    | 'email'
    | 'whatsapp';


// =============================================================
// DELIVERY STATUS
// =============================================================

export type CommunicationDeliveryStatus =
    | 'pending'
    | 'queued'
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'failed'
    | 'skipped';


// =============================================================
// AUDIENCE
// =============================================================

export type CommunicationAudienceType =
    | 'all_users'
    | 'opted_in'
    | 'supporters'
    | 'inactive'
    | 'custom';


// =============================================================
// LANGUAGE
// =============================================================

export type CommunicationLanguage =
    | 'pt-BR'
    | 'en'
    | 'es';


// =============================================================
// CONSENT
// =============================================================

export type CommunicationConsentPurpose =
    | 'devotional_updates'
    | 'project_support'
    | 'relationship_reply';


// =============================================================
// LANGUAGE METADATA
// =============================================================

export interface CommunicationLanguageOption {
    value: CommunicationLanguage;

    label: string;

    shortLabel: string;
}


export const COMMUNICATION_LANGUAGE_OPTIONS:
    CommunicationLanguageOption[] = [

        {
            value: 'pt-BR',

            label: 'Português',

            shortLabel: 'PT',
        },

        {
            value: 'en',

            label: 'English',

            shortLabel: 'EN',
        },

        {
            value: 'es',

            label: 'Español',

            shortLabel: 'ES',
        },

    ];


// =============================================================
// CAMPAIGN
//
// A campanha possui:
// - um idioma base;
// - conteúdo original;
// - traduções opcionais para outros idiomas.
//
// O conteúdo base permanece em communication_campaigns.
// =============================================================

export interface CommunicationCampaign {

    id: string;

    name: string;

    type: CommunicationCampaignType;

    status: CommunicationCampaignStatus;


    // ---------------------------------------------------------
    // Conteúdo editorial base
    // ---------------------------------------------------------

    subject: string | null;

    title: string | null;

    body: string | null;


    // ---------------------------------------------------------
    // CTA base
    // ---------------------------------------------------------

    cta_label: string | null;

    cta_url: string | null;


    // ---------------------------------------------------------
    // Idioma base
    // ---------------------------------------------------------

    language: CommunicationLanguage;


    // ---------------------------------------------------------
    // Auditoria
    // ---------------------------------------------------------

    created_by: string | null;


    // ---------------------------------------------------------
    // Agendamento
    // ---------------------------------------------------------

    scheduled_at: string | null;

    started_at: string | null;

    completed_at: string | null;


    // ---------------------------------------------------------
    // Timestamps
    // ---------------------------------------------------------

    created_at: string;

    updated_at: string;
}


// =============================================================
// CAMPAIGN TRANSLATION
//
// Cada campanha pode possuir no máximo uma tradução por idioma.
//
// A combinação:
//
//     campaign_id + language
//
// é única no banco de dados.
// =============================================================

export interface CommunicationCampaignTranslation {

    id: string;

    campaign_id: string;

    language: CommunicationLanguage;


    // ---------------------------------------------------------
    // Conteúdo traduzido
    // ---------------------------------------------------------

    subject: string | null;

    title: string | null;

    body: string;


    // ---------------------------------------------------------
    // CTA traduzido
    // ---------------------------------------------------------

    cta_label: string | null;


    // ---------------------------------------------------------
    // Timestamps
    // ---------------------------------------------------------

    created_at: string;

    updated_at: string;
}


// =============================================================
// CAMPAIGN TRANSLATION INPUT
//
// Usado pelo Service para criar ou atualizar uma tradução.
// =============================================================

export interface CommunicationCampaignTranslationInput {

    language: CommunicationLanguage;

    subject?: string | null;

    title?: string | null;

    body: string;

    cta_label?: string | null;
}


// =============================================================
// CAMPAIGN TRANSLATION FORM
//
// Modelo utilizado pelo formulário do editor.
// =============================================================

export interface CommunicationCampaignTranslationForm {

    language: CommunicationLanguage;

    subject: string;

    title: string;

    body: string;

    cta_label: string;
}


// =============================================================
// CAMPAIGN CONTENT BY LANGUAGE
//
// Mantém em memória o conteúdo dos três idiomas.
//
// O idioma base também aparece aqui para simplificar o editor,
// embora seja persistido na tabela principal.
// =============================================================

export type CommunicationCampaignContentByLanguage =
    Record<
        CommunicationLanguage,
        CommunicationCampaignTranslationForm
    >;


// =============================================================
// CAMPAIGN CHANNEL
// =============================================================

export interface CommunicationCampaignChannel {

    id: string;

    campaign_id: string;

    channel: CommunicationDeliveryChannel;

    enabled: boolean;

    created_at: string;
}


// =============================================================
// AUDIENCE
// =============================================================

export interface CommunicationAudience {

    id: string;

    name: string;

    type: CommunicationAudienceType;

    description: string | null;

    filters: Record<string, unknown>;

    created_by: string | null;

    created_at: string;

    updated_at: string;
}


// =============================================================
// CAMPAIGN ↔ AUDIENCE
// =============================================================

export interface CommunicationCampaignAudience {

    id: string;

    campaign_id: string;

    audience_id: string;

    created_at: string;
}


// =============================================================
// DELIVERY
// =============================================================

export interface CommunicationDelivery {

    id: string;

    campaign_id: string;

    user_id: string;

    channel: CommunicationDeliveryChannel;

    status: CommunicationDeliveryStatus;


    // ---------------------------------------------------------
    // Provider
    // ---------------------------------------------------------

    provider_message_id: string | null;

    provider: string | null;


    // ---------------------------------------------------------
    // Error
    // ---------------------------------------------------------

    error_code: string | null;

    error_message: string | null;


    // ---------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------

    queued_at: string | null;

    sent_at: string | null;

    delivered_at: string | null;

    opened_at: string | null;

    clicked_at: string | null;


    // ---------------------------------------------------------
    // Timestamps
    // ---------------------------------------------------------

    created_at: string;

    updated_at: string;
}


// =============================================================
// CAMPAIGN STATS
// =============================================================

export interface CommunicationCampaignStats {

    campaign_id: string;

    name: string;

    type: CommunicationCampaignType;

    status: CommunicationCampaignStatus;


    total: number;

    pending: number;

    queued: number;

    sent: number;

    delivered: number;

    opened: number;

    clicked: number;

    failed: number;

    skipped: number;
}


// =============================================================
// CAMPAIGN FORM
//
// Modelo legado/compatível com o editor de idioma único.
//
// Mantido para evitar quebrar componentes existentes.
// =============================================================

export interface CommunicationCampaignForm {

    name: string;

    type: CommunicationCampaignType;

    subject: string;

    title: string;

    body: string;

    cta_label: string;

    cta_url: string;

    language: CommunicationLanguage;

    channels: CommunicationDeliveryChannel[];

    audience_ids: string[];

    scheduled_at: string | null;
}


// =============================================================
// MULTILINGUAL CAMPAIGN FORM
//
// Modelo oficial do novo editor multilíngue.
// =============================================================

export interface CommunicationMultilingualCampaignForm {

    name: string;

    type: CommunicationCampaignType;

    base_language: CommunicationLanguage;

    content: CommunicationCampaignContentByLanguage;

    channels: CommunicationDeliveryChannel[];

    audience_ids: string[];

    scheduled_at: string | null;
}


// =============================================================
// AUDIENCE FORM
// =============================================================

export interface CommunicationAudienceForm {

    name: string;

    type: CommunicationAudienceType;

    description: string;

    filters: Record<string, unknown>;
}


// =============================================================
// CAMPAIGN FILTERS
// =============================================================

export type CampaignStatusFilter =
    | 'all'
    | CommunicationCampaignStatus;


export interface CommunicationCampaignFilters {

    status?: CampaignStatusFilter;

    type?: CommunicationCampaignType;

    search?: string;
}


// =============================================================
// CAMPAIGN SUMMARY
// =============================================================

export interface CommunicationCampaignSummary {

    campaign: CommunicationCampaign;

    channels: CommunicationCampaignChannel[];

    audiences: CommunicationAudience[];

    translations: CommunicationCampaignTranslation[];

    stats: CommunicationCampaignStats | null;
}


// =============================================================
// LANGUAGE HELPERS
// =============================================================

export const COMMUNICATION_LANGUAGE_LABELS:
    Record<
        CommunicationLanguage,
        string
    > = {

    'pt-BR':
        'Português',

    en:
        'English',

    es:
        'Español',
};


export const COMMUNICATION_LANGUAGE_SHORT_LABELS:
    Record<
        CommunicationLanguage,
        string
    > = {

    'pt-BR':
        'PT',

    en:
        'EN',

    es:
        'ES',
};


// =============================================================
// CAMPAIGN TYPE LABELS
// =============================================================

export const COMMUNICATION_CAMPAIGN_TYPE_LABELS:
    Record<
        CommunicationCampaignType,
        string
    > = {

    devotional_update:
        'Atualização devocional',

    project_support:
        'Apoio ao projeto',

    announcement:
        'Anúncio',

    engagement:
        'Engajamento',

    custom:
        'Personalizada',
};


// =============================================================
// CAMPAIGN STATUS LABELS
// =============================================================

export const COMMUNICATION_CAMPAIGN_STATUS_LABELS:
    Record<
        CommunicationCampaignStatus,
        string
    > = {

    draft:
        'Rascunho',

    scheduled:
        'Agendada',

    sending:
        'Enviando',

    completed:
        'Concluída',

    cancelled:
        'Cancelada',

    failed:
        'Falhou',
};


// =============================================================
// CHANNEL LABELS
// =============================================================

export const COMMUNICATION_CHANNEL_LABELS:
    Record<
        CommunicationDeliveryChannel,
        string
    > = {

    in_app:
        'In-App',

    email:
        'E-mail',

    whatsapp:
        'WhatsApp',
};


// =============================================================
// AUDIENCE TYPE LABELS
// =============================================================

export const COMMUNICATION_AUDIENCE_TYPE_LABELS:
    Record<
        CommunicationAudienceType,
        string
    > = {

    all_users:
        'Todos os usuários',

    opted_in:
        'Usuários com consentimento',

    supporters:
        'Apoiadores',

    inactive:
        'Usuários inativos',

    custom:
        'Personalizada',
};


// =============================================================
// CREATE EMPTY TRANSLATION
// =============================================================

export function createEmptyCampaignTranslation(
    language: CommunicationLanguage
): CommunicationCampaignTranslationForm {

    return {

        language,

        subject: '',

        title: '',

        body: '',

        cta_label: '',
    };
}


// =============================================================
// CREATE EMPTY MULTILINGUAL CONTENT
// =============================================================

export function createEmptyCampaignContent():
    CommunicationCampaignContentByLanguage {

    return {

        'pt-BR':
            createEmptyCampaignTranslation(
                'pt-BR'
            ),

        en:
            createEmptyCampaignTranslation(
                'en'
            ),

        es:
            createEmptyCampaignTranslation(
                'es'
            ),
    };
}


// =============================================================
// CREATE CAMPAIGN CONTENT FROM EXISTING CAMPAIGN
//
// Converte uma campanha existente para o modelo utilizado
// pelo editor multilíngue.
//
// Isso é importante para campanhas antigas que ainda não
// possuem traduções.
// =============================================================

export function createCampaignContentFromCampaign(
    campaign: CommunicationCampaign
): CommunicationCampaignContentByLanguage {

    const content =
        createEmptyCampaignContent();


    content[campaign.language] = {

        language:
            campaign.language,

        subject:
            campaign.subject ?? '',

        title:
            campaign.title ?? '',

        body:
            campaign.body ?? '',

        cta_label:
            campaign.cta_label ?? '',
    };


    return content;
}


// =============================================================
// APPLY TRANSLATION TO CONTENT
//
// Utilitário para inserir uma tradução carregada do banco
// no estado utilizado pelo editor.
// =============================================================

export function applyCampaignTranslation(
    content: CommunicationCampaignContentByLanguage,
    translation: CommunicationCampaignTranslation
): CommunicationCampaignContentByLanguage {

    return {

        ...content,

        [translation.language]: {

            language:
                translation.language,

            subject:
                translation.subject ?? '',

            title:
                translation.title ?? '',

            body:
                translation.body ?? '',

            cta_label:
                translation.cta_label ?? '',
        },
    };
}
export interface CommunicationCampaignRecipientCount {
    campaign_id: string;
    total_recipients: number;
}

export interface CommunicationSendResult {
    campaign_id: string;
    total_recipients: number;
    total_deliveries: number;
    status: CommunicationCampaignStatus;
}

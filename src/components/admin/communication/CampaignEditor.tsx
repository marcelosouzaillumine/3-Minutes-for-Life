import {
    useEffect,
    useState,
} from 'react';

import type {
    CommunicationAudience,
    CommunicationCampaign,
    CommunicationCampaignContentByLanguage,
    CommunicationCampaignType,
    CommunicationDeliveryChannel,
    CommunicationLanguage,
    CommunicationCampaignStatus,
} from '../../../types/Communication';

import {
    createEmptyCampaignContent,
} from '../../../types/Communication';

import {
    adminCommunicationService,
} from '../../../services/AdminCommunicationService';

import type {
    CreateCampaignInput,
    UpdateCampaignInput,
} from '../../../services/AdminCommunicationService';

import {
    RichTextEditor,
} from '../RichTextEditor';

import CampaignPreview from './CampaignPreview';


// =============================================================
// PROPS
// =============================================================

interface CampaignEditorProps {
    campaign?: CommunicationCampaign | null;

    onSaved: () => void;

    onCancel: () => void;
}


// =============================================================
// CHANNELS
// =============================================================

const CHANNELS: Array<{
    value: CommunicationDeliveryChannel;
    label: string;
    description: string;
}> = [

    {
        value: 'in_app',

        label: 'In-App',

        description:
            'Exibe a comunicação dentro do aplicativo.',
    },

    {
        value: 'email',

        label: 'E-mail',

        description:
            'Envia a comunicação por e-mail.',
    },

    {
        value: 'whatsapp',

        label: 'WhatsApp',

        description:
            'Prepara a comunicação para WhatsApp.',
    },

];


// =============================================================
// LANGUAGES
// =============================================================

const LANGUAGES: Array<{
    value: CommunicationLanguage;
    label: string;
    shortLabel: string;
}> = [

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
// HELPERS
// =============================================================

function createContentFromCampaign(
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
// ERROR MESSAGE
// =============================================================

function getErrorMessage(
    err: unknown,
    fallback: string
): string {

    if (
        err instanceof Error &&
        err.message
    ) {

        return err.message;

    }


    if (
        typeof err === 'object' &&
        err !== null
    ) {

        const possibleError =
            err as {
                message?: string;
                details?: string;
                hint?: string;
                code?: string;
            };


        if (
            possibleError.message
        ) {

            let message =
                possibleError.message;


            if (
                possibleError.details
            ) {

                message +=
                    ` ${possibleError.details}`;

            }


            if (
                possibleError.hint
            ) {

                message +=
                    ` ${possibleError.hint}`;

            }


            if (
                possibleError.code
            ) {

                message +=
                    ` (Código: ${possibleError.code})`;

            }


            return message;

        }

    }


    return fallback;
}


// =============================================================
// COMPONENT
// =============================================================

export default function CampaignEditor({
    campaign,
    onSaved,
    onCancel,
}: CampaignEditorProps) {

    // =========================================================
    // BASIC CAMPAIGN
    // =========================================================

    const [
        name,
        setName,
    ] = useState<string>(
        campaign?.name ?? ''
    );


    const [
        type,
        setType,
    ] = useState<CommunicationCampaignType>(
        campaign?.type ?? 'announcement'
    );


    const [
        baseLanguage,
        setBaseLanguage,
    ] = useState<CommunicationLanguage>(
        campaign?.language ?? 'pt-BR'
    );


    // =========================================================
    // CTA URL
    // =========================================================

    const [
        ctaUrl,
        setCtaUrl,
    ] = useState<string>(
        campaign?.cta_url ?? ''
    );


    // =========================================================
    // CONTENT
    // =========================================================

    const [
        contentByLanguage,
        setContentByLanguage,
    ] = useState<CommunicationCampaignContentByLanguage>(
        createEmptyCampaignContent()
    );


    // =========================================================
    // ACTIVE LANGUAGE
    // =========================================================

    const [
        activeLanguage,
        setActiveLanguage,
    ] = useState<CommunicationLanguage>(
        campaign?.language ?? 'pt-BR'
    );


    // =========================================================
    // CHANNELS
    // =========================================================

    const [
        selectedChannels,
        setSelectedChannels,
    ] = useState<
        CommunicationDeliveryChannel[]
    >([
        'in_app',
    ]);


    // =========================================================
    // AUDIENCES
    // =========================================================

    const [
        audiences,
        setAudiences,
    ] = useState<
        CommunicationAudience[]
    >([]);


    const [
        selectedAudienceIds,
        setSelectedAudienceIds,
    ] = useState<string[]>([]);


    // =========================================================
    // LOADING
    // =========================================================

    const [
        loadingConfiguration,
        setLoadingConfiguration,
    ] = useState<boolean>(false);


    // =========================================================
    // SAVING
    // =========================================================

    const [
        saving,
        setSaving,
    ] = useState<boolean>(false);


    // =========================================================
    // SENDING
    // =========================================================

    const [
        sending,
        setSending,
    ] = useState<boolean>(false);


    // =========================================================
    // PREVIEW
    // =========================================================

    const [
        showPreview,
        setShowPreview,
    ] = useState<boolean>(false);


    // =========================================================
    // ERROR
    // =========================================================

    const [
        error,
        setError,
    ] = useState<string | null>(null);


    // =========================================================
    // LOAD CONFIGURATION
    // =========================================================

    useEffect(() => {

        let cancelled = false;


        async function loadConfiguration() {

            try {

                setLoadingConfiguration(true);

                setError(null);


                // -------------------------------------------------
                // INITIAL CONTENT
                // -------------------------------------------------

                let initialContent =
                    createEmptyCampaignContent();


                // -------------------------------------------------
                // EXISTING CAMPAIGN
                // -------------------------------------------------

                if (
                    campaign
                ) {

                    initialContent =
                        createContentFromCampaign(
                            campaign
                        );


                    setCtaUrl(
                        campaign.cta_url ?? ''
                    );


                    // ---------------------------------------------
                    // TRANSLATIONS
                    // ---------------------------------------------

                    const translations =
                        await adminCommunicationService
                            .listCampaignTranslations(
                                campaign.id
                            );


                    if (
                        cancelled
                    ) {

                        return;

                    }


                    translations.forEach(
                        (
                            translation
                        ) => {

                            initialContent[
                                translation.language as CommunicationLanguage
                            ] = {

                                language:
                                    translation.language as CommunicationLanguage,

                                subject:
                                    translation.subject ??
                                    '',

                                title:
                                    translation.title ??
                                    '',

                                body:
                                    translation.body ??
                                    '',

                                cta_label:
                                    translation.cta_label ??
                                    '',
                            };

                        }
                    );

                } else {

                    setCtaUrl('');

                }


                // -------------------------------------------------
                // AUDIENCES
                // -------------------------------------------------

                const audienceData =
                    await adminCommunicationService
                        .listAudiences();


                if (
                    cancelled
                ) {

                    return;

                }


                setContentByLanguage(
                    initialContent
                );


                setAudiences(
                    audienceData
                );


                // -------------------------------------------------
                // EXISTING CAMPAIGN CONFIGURATION
                // -------------------------------------------------

                if (
                    campaign
                ) {

                    // ---------------------------------------------
                    // CHANNELS
                    // ---------------------------------------------

                    const channelData =
                        await adminCommunicationService
                            .getCampaignChannels(
                                campaign.id
                            );


                    if (
                        cancelled
                    ) {

                        return;

                    }


                    const enabledChannels =
                        channelData
                            .filter(
                                (
                                    channel
                                ) =>
                                    channel.enabled
                            )
                            .map(
                                (
                                    channel
                                ) =>
                                    channel.channel
                            );


                    setSelectedChannels(
                        enabledChannels.length > 0
                            ? enabledChannels
                            : ['in_app']
                    );


                    // ---------------------------------------------
                    // AUDIENCES
                    // ---------------------------------------------

                    const audienceIds =
                        await adminCommunicationService
                            .getCampaignAudienceIds(
                                campaign.id
                            );


                    if (
                        cancelled
                    ) {

                        return;

                    }


                    setSelectedAudienceIds(
                        audienceIds
                    );

                } else {

                    // -------------------------------------------------
                    // NEW CAMPAIGN
                    // -------------------------------------------------

                    setSelectedChannels(
                        ['in_app']
                    );


                    const allUsers =
                        audienceData.find(
                            (
                                audience
                            ) =>
                                audience.type ===
                                'all_users'
                        );


                    setSelectedAudienceIds(
                        allUsers
                            ? [allUsers.id]
                            : []
                    );

                }

            } catch (err) {

                console.error(
                    'Erro ao carregar configuração da campanha:',
                    err
                );


                if (
                    !cancelled
                ) {

                    setError(
                        getErrorMessage(
                            err,
                            'Não foi possível carregar a configuração da campanha.'
                        )
                    );

                }

            } finally {

                if (
                    !cancelled
                ) {

                    setLoadingConfiguration(
                        false
                    );

                }

            }

        }


        loadConfiguration();


        return () => {

            cancelled = true;

        };

    }, [campaign]);


    // =========================================================
    // SYNC CAMPAIGN
    // =========================================================

    useEffect(() => {

        setName(
            campaign?.name ?? ''
        );


        setType(
            campaign?.type ??
            'announcement'
        );


        const campaignLanguage =
            campaign?.language ??
            'pt-BR';


        setBaseLanguage(
            campaignLanguage
        );


        setActiveLanguage(
            campaignLanguage
        );


        setCtaUrl(
            campaign?.cta_url ??
            ''
        );


        setError(null);

        setShowPreview(false);

    }, [campaign]);


    // =========================================================
    // ACTIVE CONTENT
    // =========================================================

    const activeContent =
        contentByLanguage[
            activeLanguage
        ] ?? {

            language:
                activeLanguage,

            subject:
                '',

            title:
                '',

            body:
                '',

            cta_label:
                '',
        };


    // =========================================================
    // UPDATE ACTIVE CONTENT
    // =========================================================

    function updateActiveContent(
        field:
            | 'subject'
            | 'title'
            | 'body'
            | 'cta_label',
        value: string
    ) {

        setContentByLanguage(
            (
                current
            ) => ({

                ...current,

                [activeLanguage]: {

                    ...(current[
                        activeLanguage
                    ] ?? {

                        language:
                            activeLanguage,

                        subject:
                            '',

                        title:
                            '',

                        body:
                            '',

                        cta_label:
                            '',
                    }),

                    language:
                        activeLanguage,

                    [field]:
                        value,
                },

            })
        );

    }


    // =========================================================
    // LANGUAGE LABEL
    // =========================================================

    function getLanguageLabel(
        language: CommunicationLanguage
    ): string {

        return (
            LANGUAGES.find(
                (
                    item
                ) =>
                    item.value ===
                    language
            )?.label ??
            language
        );

    }


    // =========================================================
    // CHANGE BASE LANGUAGE
    // =========================================================

    function handleBaseLanguageChange(
        language: CommunicationLanguage
    ) {

        setBaseLanguage(
            language
        );

        setActiveLanguage(
            language
        );

    }


    // =========================================================
    // TOGGLE CHANNEL
    // =========================================================

    function toggleChannel(
        channel: CommunicationDeliveryChannel
    ) {

        setSelectedChannels(
            (
                current
            ) => {

                if (
                    current.includes(
                        channel
                    )
                ) {

                    return current.filter(
                        (
                            item
                        ) =>
                            item !== channel
                    );

                }


                return [
                    ...current,
                    channel,
                ];

            }
        );

    }


    // =========================================================
    // TOGGLE AUDIENCE
    // =========================================================

    function toggleAudience(
        audienceId: string
    ) {

        setSelectedAudienceIds(
            (
                current
            ) => {

                if (
                    current.includes(
                        audienceId
                    )
                ) {

                    return current.filter(
                        (
                            id
                        ) =>
                            id !== audienceId
                    );

                }


                return [
                    ...current,
                    audienceId,
                ];

            }
        );

    }


    // =========================================================
    // VALIDATE
    // =========================================================

    function validateCampaign() {

        if (
            !name.trim()
        ) {

            throw new Error(
                'Informe o nome da campanha.'
            );

        }


        const baseContent =
            contentByLanguage[
                baseLanguage
            ];


        if (
            !baseContent ||
            !baseContent.body.trim()
        ) {

            throw new Error(
                `Informe o conteúdo no idioma base (${getLanguageLabel(
                    baseLanguage
                )}).`
            );

        }


        if (
            selectedChannels.length === 0
        ) {

            throw new Error(
                'Selecione pelo menos um canal de comunicação.'
            );

        }


        if (
            selectedAudienceIds.length === 0
        ) {

            throw new Error(
                'Selecione pelo menos um público para a campanha.'
            );

        }


        /*
         * A URL do CTA é opcional.
         *
         * Porém, quando houver texto de CTA,
         * a URL precisa ser informada.
         */

        if (
            baseContent.cta_label.trim() &&
            !ctaUrl.trim()
        ) {

            throw new Error(
                'Informe a URL do botão de CTA.'
            );

        }


        /*
         * Se houver URL, ela precisa ser válida.
         */

        if (
            ctaUrl.trim()
        ) {

            try {

                new URL(
                    ctaUrl.trim()
                );

            } catch {

                throw new Error(
                    'Informe uma URL válida para o botão de CTA.'
                );

            }

        }

    }


    // =========================================================
    // BUILD CAMPAIGN OBJECT FOR PREVIEW
    // =========================================================

    function buildPreviewCampaign(): CommunicationCampaign {

        /*
         * O preview deve reproduzir o idioma que está
         * atualmente aberto no editor.
         */

        const previewContent =
            contentByLanguage[
                activeLanguage
            ] ?? {

                language:
                    activeLanguage,

                subject:
                    '',

                title:
                    '',

                body:
                    '',

                cta_label:
                    '',
            };


        /*
         * O body é enviado integralmente.
         *
         * Não fazemos:
         *
         * - slice()
         * - substring()
         * - substr()
         * - truncate
         * - remoção de HTML
         * - conversão para texto
         *
         * O HTML produzido pelo RichTextEditor passa
         * diretamente para o CampaignPreview.
         */

        const previewCampaign = {

            ...(campaign ?? {}),

            id:
                campaign?.id ??
                'preview',

            name:
                name.trim(),

            type,

            language:
                activeLanguage,

            subject:
                previewContent.subject.trim() ||
                null,

            title:
                previewContent.title.trim() ||
                null,

            body:
                previewContent.body,

            cta_label:
                previewContent.cta_label.trim() ||
                null,

            cta_url:
                ctaUrl.trim() ||
                null,

            scheduled_at:
                null,

            status:
                'draft' as CommunicationCampaignStatus,

        };


        return previewCampaign as CommunicationCampaign;

    }


    // =========================================================
    // PREVIEW
    // =========================================================

    function handlePreview() {

        try {

            setError(null);

            validateCampaign();

            setShowPreview(true);

        } catch (err) {

            console.error(
                'Erro ao abrir preview:',
                err
            );

            setError(
                getErrorMessage(
                    err,
                    'Não foi possível abrir a pré-visualização.'
                )
            );

        }

    }


    // =========================================================
    // PERSIST CAMPAIGN
    // =========================================================

    async function persistCampaign(): Promise<string> {

        validateCampaign();


        // -------------------------------------------------
        // BASE CONTENT
        // -------------------------------------------------

        const baseContent =
            contentByLanguage[
                baseLanguage
            ];


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        const status:
            CommunicationCampaignStatus =
            'draft';


        // -------------------------------------------------
        // CTA
        // -------------------------------------------------

        const normalizedCtaLabel =
            baseContent.cta_label.trim() ||
            null;


        const normalizedCtaUrl =
            ctaUrl.trim() ||
            null;


        // -------------------------------------------------
        // CREATE PAYLOAD
        // -------------------------------------------------

        const createPayload:
            CreateCampaignInput = {

            name:
                name.trim(),

            type,

            language:
                baseLanguage,

            subject:
                baseContent.subject.trim() ||
                null,

            title:
                baseContent.title.trim() ||
                null,

            body:
                baseContent.body,

            cta_label:
                normalizedCtaLabel,

            cta_url:
                normalizedCtaUrl,

            scheduled_at:
                null,

            channels:
                selectedChannels,

            audience_ids:
                selectedAudienceIds,
        };


        // -------------------------------------------------
        // UPDATE PAYLOAD
        // -------------------------------------------------

        const updatePayload:
            UpdateCampaignInput = {

            name:
                name.trim(),

            type,

            language:
                baseLanguage,

            subject:
                baseContent.subject.trim() ||
                null,

            title:
                baseContent.title.trim() ||
                null,

            body:
                baseContent.body,

            cta_label:
                normalizedCtaLabel,

            cta_url:
                normalizedCtaUrl,

            scheduled_at:
                null,

            status,

            channels:
                selectedChannels,

            audience_ids:
                selectedAudienceIds,
        };


        // -------------------------------------------------
        // CREATE / UPDATE
        // -------------------------------------------------

        let campaignId =
            campaign?.id;


        try {

            if (
                !campaignId
            ) {

                const created =
                    await adminCommunicationService
                        .createCampaign(
                            createPayload
                        );


                campaignId =
                    created.id;

            } else {

                await adminCommunicationService
                    .updateCampaign(
                        campaignId,
                        updatePayload
                    );

            }

        } catch (err) {

            throw new Error(
                `Erro ao salvar os dados da campanha: ${getErrorMessage(
                    err,
                    'erro desconhecido'
                )}`
            );

        }


        // -------------------------------------------------
        // VERIFY ID
        // -------------------------------------------------

        if (
            !campaignId
        ) {

            throw new Error(
                'A campanha foi processada, mas não foi possível obter o ID da campanha.'
            );

        }


        // -------------------------------------------------
        // TRANSLATIONS
        // -------------------------------------------------

        for (
            const languageOption
            of LANGUAGES
        ) {

            const language =
                languageOption.value;


            if (
                language ===
                baseLanguage
            ) {

                continue;

            }


            const translation =
                contentByLanguage[
                    language
                ];


            if (
                !translation
            ) {

                continue;

            }


            const hasContent =
                Boolean(

                    translation.body.trim() ||

                    translation.subject.trim() ||

                    translation.title.trim() ||

                    translation.cta_label.trim()

                );


            // -------------------------------------------------
            // EMPTY TRANSLATION
            // -------------------------------------------------

            if (
                !hasContent
            ) {

                try {

                    await adminCommunicationService
                        .deleteCampaignTranslationByLanguage(
                            campaignId,
                            language
                        );

                } catch (err) {

                    throw new Error(
                        `Erro ao remover a tradução ${getLanguageLabel(
                            language
                        )}: ${getErrorMessage(
                            err,
                            'erro desconhecido'
                        )}`
                    );

                }


                continue;

            }


            // -------------------------------------------------
            // UPSERT TRANSLATION
            // -------------------------------------------------

            try {

                await adminCommunicationService
                    .upsertCampaignTranslation({

                        campaign_id:
                            campaignId,

                        language,

                        subject:
                            translation.subject.trim() ||
                            null,

                        title:
                            translation.title.trim() ||
                            null,

                        body:
                            translation.body,

                        cta_label:
                            translation.cta_label.trim() ||
                            null,

                    });

            } catch (err) {

                throw new Error(
                    `Erro ao salvar a tradução ${getLanguageLabel(
                        language
                    )}: ${getErrorMessage(
                        err,
                        'erro desconhecido'
                    )}`
                );

            }

        }


        // -------------------------------------------------
        // CHANNELS
        // -------------------------------------------------

        try {

            await adminCommunicationService
                .setCampaignChannels(
                    campaignId,
                    selectedChannels
                );

        } catch (err) {

            throw new Error(
                `Erro ao salvar os canais da campanha: ${getErrorMessage(
                    err,
                    'erro desconhecido'
                )}`
            );

        }


        // -------------------------------------------------
        // AUDIENCES
        // -------------------------------------------------

        try {

            await adminCommunicationService
                .setCampaignAudiences(
                    campaignId,
                    selectedAudienceIds
                );

        } catch (err) {

            throw new Error(
                `Erro ao salvar os públicos da campanha: ${getErrorMessage(
                    err,
                    'erro desconhecido'
                )}`
            );

        }


        return campaignId;

    }


    // =========================================================
    // SAVE
    // =========================================================

    async function handleSave() {

        try {

            setSaving(true);

            setError(null);


            await persistCampaign();


            onSaved();

        } catch (err) {

            console.error(
                'Erro ao salvar campanha:',
                err
            );


            setError(
                getErrorMessage(
                    err,
                    'Não foi possível salvar a campanha.'
                )
            );

        } finally {

            setSaving(false);

        }

    }


    // =========================================================
    // SEND
    // =========================================================

    async function handleSend() {

        try {

            setSending(true);

            setError(null);


            /*
             * Primeiro persistimos tudo.
             *
             * Isso garante que:
             * - o conteúdo atual esteja no banco;
             * - canais estejam configurados;
             * - públicos estejam configurados;
             * - traduções estejam atualizadas;
             * - CTA esteja atualizado.
             */

            const campaignId =
                await persistCampaign();


            /*
             * Agora o serviço faz a segunda camada
             * de validação, incluindo:
             *
             * - campanha existente;
             * - campanha não enviada;
             * - conteúdo;
             * - canais;
             * - públicos;
             * - quantidade de destinatários.
             */

            await adminCommunicationService
                .sendCampaign(
                    campaignId
                );


            /*
             * O dispatch foi iniciado com sucesso.
             */

            onSaved();

        } catch (err) {

            console.error(
                'Erro ao enviar campanha:',
                err
            );


            setError(
                getErrorMessage(
                    err,
                    'Não foi possível iniciar o envio da campanha.'
                )
            );

        } finally {

            setSending(false);

        }

    }


    // =========================================================
    // PREVIEW SCREEN
    // =========================================================

    if (
        showPreview
    ) {

        return (

            <CampaignPreview
                campaign={
                    buildPreviewCampaign()
                }
                onBack={() =>
                    setShowPreview(false)
                }
                onSend={() => {

                    setShowPreview(false);

                    void handleSend();

                }}
                sending={
                    sending
                }
            />

        );

    }


    // =========================================================
    // RENDER EDITOR
    // =========================================================

    return (

        <section className="communication-editor">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="communication-editor-header">

                <div>

                    <span className="communication-eyebrow">
                        Centro de Comunicação
                    </span>

                    <h2>
                        {campaign
                            ? 'Editar campanha'
                            : 'Nova campanha'}
                    </h2>

                    <p>
                        Prepare a comunicação antes
                        de programar o envio.
                    </p>

                </div>

            </header>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div
                    className="communication-error"
                    role="alert"
                >
                    {error}
                </div>

            )}


            {/* =================================================
                LOADING
            ================================================= */}

            {loadingConfiguration && (

                <div
                    className="communication-state"
                    style={{
                        marginBottom:
                            '1rem',
                    }}
                >

                    <div className="communication-spinner" />

                    <p>
                        Carregando configuração...
                    </p>

                </div>

            )}


            {/* =================================================
                FORM
            ================================================= */}

            <div className="communication-form">

                {/* =================================================
                    1. CONTENT
                ================================================= */}

                <div>

                    <div
                        style={{
                            marginBottom:
                                '1rem',
                        }}
                    >

                        <span className="communication-eyebrow">
                            1. Conteúdo
                        </span>

                        <h3
                            style={{
                                margin:
                                    '0.25rem 0 0',
                            }}
                        >
                            Conteúdo da comunicação
                        </h3>

                    </div>


                    {/* =================================================
                        BASIC DATA
                    ================================================= */}

                    <div className="communication-form-grid">

                        <label className="communication-field">

                            <span>
                                Nome interno
                            </span>

                            <input
                                type="text"
                                value={name}
                                onChange={(
                                    event
                                ) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="Ex.: Devocional de segunda-feira"
                                disabled={
                                    saving ||
                                    sending
                                }
                            />

                        </label>


                        <label className="communication-field">

                            <span>
                                Tipo
                            </span>

                            <select
                                value={type}
                                onChange={(
                                    event
                                ) =>
                                    setType(
                                        event.target.value as
                                        CommunicationCampaignType
                                    )
                                }
                                disabled={
                                    saving ||
                                    sending
                                }
                            >

                                <option value="devotional_update">
                                    Atualização devocional
                                </option>

                                <option value="project_support">
                                    Apoio ao projeto
                                </option>

                                <option value="announcement">
                                    Anúncio
                                </option>

                                <option value="engagement">
                                    Engajamento
                                </option>

                                <option value="custom">
                                    Personalizada
                                </option>

                            </select>

                        </label>


                        <label className="communication-field">

                            <span>
                                Idioma base
                            </span>

                            <select
                                value={baseLanguage}
                                onChange={(
                                    event
                                ) =>
                                    handleBaseLanguageChange(
                                        event.target.value as
                                        CommunicationLanguage
                                    )
                                }
                                disabled={
                                    saving ||
                                    sending
                                }
                            >

                                {LANGUAGES.map(
                                    (
                                        language
                                    ) => (

                                        <option
                                            key={
                                                language.value
                                            }
                                            value={
                                                language.value
                                            }
                                        >
                                            {
                                                language.label
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </label>

                    </div>


                    {/* =================================================
                        LANGUAGE TABS
                    ================================================= */}

                    <div
                        className="communication-language-tabs"
                        role="tablist"
                        aria-label="Idiomas da comunicação"
                    >

                        {LANGUAGES.map(
                            (
                                language
                            ) => {

                                const selected =
                                    activeLanguage ===
                                    language.value;


                                const isBase =
                                    baseLanguage ===
                                    language.value;


                                const translation =
                                    contentByLanguage[
                                        language.value
                                    ];


                                const hasContent =
                                    Boolean(

                                        translation?.body?.trim() ||

                                        translation?.subject?.trim() ||

                                        translation?.title?.trim() ||

                                        translation?.cta_label?.trim()

                                    );


                                return (

                                    <button
                                        key={
                                            language.value
                                        }
                                        type="button"
                                        role="tab"
                                        aria-selected={
                                            selected
                                        }
                                        onClick={() =>
                                            setActiveLanguage(
                                                language.value
                                            )
                                        }
                                        disabled={
                                            saving ||
                                            sending
                                        }
                                        className={
                                            selected
                                                ? 'communication-language-tab active'
                                                : 'communication-language-tab'
                                        }
                                    >

                                        <span className="communication-language-tab-main">

                                            <span
                                                className="communication-language-code"
                                                aria-hidden="true"
                                            >
                                                {
                                                    language.shortLabel
                                                }
                                            </span>

                                            <span className="communication-language-name">
                                                {
                                                    language.label
                                                }
                                            </span>

                                        </span>


                                        <span className="communication-language-tab-meta">

                                            {isBase && (

                                                <span className="communication-language-base">
                                                    Base
                                                </span>

                                            )}


                                            {hasContent && (

                                                <span
                                                    className="communication-language-status"
                                                    aria-label="Conteúdo preenchido"
                                                />

                                            )}

                                        </span>

                                    </button>

                                );

                            }
                        )}

                    </div>


                    {/* =================================================
                        ACTIVE LANGUAGE
                    ================================================= */}

                    <div
                        style={{
                            marginTop:
                                '1.25rem',
                        }}
                    >

                        <div
                            style={{
                                marginBottom:
                                    '1rem',

                                padding:
                                    '0.75rem 1rem',

                                borderRadius:
                                    '10px',

                                background:
                                    '#faf8f6',

                                fontSize:
                                    '0.85rem',

                                color:
                                    '#666',
                            }}
                        >

                            Editando versão em{' '}

                            <strong>
                                {
                                    getLanguageLabel(
                                        activeLanguage
                                    )
                                }
                            </strong>

                            {activeLanguage ===
                                baseLanguage && (

                                <>
                                    {' '}
                                    — idioma base
                                </>

                            )}

                        </div>


                        {/* =================================================
                            SUBJECT
                        ================================================= */}

                        <label className="communication-field">

                            <span>
                                Assunto
                            </span>

                            <input
                                type="text"
                                value={
                                    activeContent.subject
                                }
                                onChange={(
                                    event
                                ) =>
                                    updateActiveContent(
                                        'subject',
                                        event.target.value
                                    )
                                }
                                placeholder={
                                    activeLanguage === 'pt-BR'
                                        ? 'Assunto da mensagem'
                                        : activeLanguage === 'en'
                                            ? 'Message subject'
                                            : 'Asunto del mensaje'
                                }
                                disabled={
                                    saving ||
                                    sending
                                }
                            />

                            <small
                                style={{
                                    display:
                                        'block',

                                    marginTop:
                                        '0.35rem',

                                    color:
                                        '#888',

                                    fontSize:
                                        '0.75rem',
                                }}
                            >
                                Usado principalmente no assunto do e-mail.
                            </small>

                        </label>


                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <label
                            className="communication-field communication-field-full"
                            style={{
                                marginTop:
                                    '1rem',
                            }}
                        >

                            <span>
                                Título da comunicação
                            </span>

                            <input
                                type="text"
                                value={
                                    activeContent.title
                                }
                                onChange={(
                                    event
                                ) =>
                                    updateActiveContent(
                                        'title',
                                        event.target.value
                                    )
                                }
                                placeholder={
                                    activeLanguage === 'pt-BR'
                                        ? 'Ex.: Há uma palavra para você hoje'
                                        : activeLanguage === 'en'
                                            ? 'Ex.: There is a word for you today'
                                            : 'Ej.: Hay una palabra para ti hoy'
                                }
                                disabled={
                                    saving ||
                                    sending
                                }
                            />

                        </label>


                        {/* =================================================
                            BODY
                        ================================================= */}

                        <div
                            className="communication-field communication-field-full"
                            style={{
                                marginTop:
                                    '1rem',
                            }}
                        >

                            <span>
                                Conteúdo
                            </span>

                            <div
                                style={{
                                    marginTop:
                                        '0.5rem',
                                }}
                            >

                                <RichTextEditor
                                    value={
                                        activeContent.body
                                    }
                                    onChange={(
                                        value
                                    ) =>
                                        updateActiveContent(
                                            'body',
                                            value
                                        )
                                    }
                                />

                            </div>

                        </div>


                        {/* =================================================
                            CTA
                        ================================================= */}

                        <div
                            style={{
                                marginTop:
                                    '1.25rem',

                                padding:
                                    '1rem',

                                border:
                                    '1px solid #eee',

                                borderRadius:
                                    '12px',

                                background:
                                    '#fafafa',
                            }}
                        >

                            <div
                                style={{
                                    marginBottom:
                                        '0.85rem',
                                }}
                            >

                                <strong>
                                    Botão de ação
                                </strong>

                                <p
                                    style={{
                                        margin:
                                            '0.3rem 0 0',

                                        color:
                                            '#777',

                                        fontSize:
                                            '0.8rem',

                                        lineHeight:
                                            1.45,
                                    }}
                                >
                                    Opcional. O texto do botão pode
                                    ser traduzido para cada idioma.
                                    A URL é compartilhada entre os
                                    idiomas.
                                </p>

                            </div>


                            <label
                                className="communication-field"
                            >

                                <span>
                                    Texto do botão
                                </span>

                                <input
                                    type="text"
                                    value={
                                        activeContent.cta_label
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        updateActiveContent(
                                            'cta_label',
                                            event.target.value
                                        )
                                    }
                                    placeholder={
                                        activeLanguage === 'pt-BR'
                                            ? 'Ex.: Ler devocional'
                                            : activeLanguage === 'en'
                                                ? 'Ex.: Read devotional'
                                                : 'Ej.: Leer devocional'
                                    }
                                    disabled={
                                        saving ||
                                        sending
                                    }
                                />

                            </label>


                            <label
                                className="communication-field"
                                style={{
                                    marginTop:
                                        '0.85rem',
                                }}
                            >

                                <span>
                                    URL do botão
                                </span>

                                <input
                                    type="url"
                                    value={
                                        ctaUrl
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCtaUrl(
                                            event.target.value
                                        )
                                    }
                                    placeholder="https://3minutesforlife.com/..."
                                    disabled={
                                        saving ||
                                        sending
                                    }
                                />

                                <small
                                    style={{
                                        display:
                                            'block',

                                        marginTop:
                                            '0.35rem',

                                        color:
                                            '#888',

                                        fontSize:
                                            '0.75rem',
                                    }}
                                >
                                    Ex.: https://3minutesforlife.com/devotional/...
                                </small>

                            </label>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    2. CHANNELS
                ================================================= */}

                <div
                    style={{
                        marginTop:
                            '2rem',

                        paddingTop:
                            '1.5rem',

                        borderTop:
                            '1px solid #eee',
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                '1rem',
                        }}
                    >

                        <span className="communication-eyebrow">
                            2. Canais
                        </span>

                        <h3
                            style={{
                                margin:
                                    '0.25rem 0 0',
                            }}
                        >
                            Onde essa comunicação será enviada?
                        </h3>

                    </div>


                    <div
                        style={{
                            display:
                                'grid',

                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(220px, 1fr))',

                            gap:
                                '0.75rem',
                        }}
                    >

                        {CHANNELS.map(
                            (
                                channel
                            ) => {

                                const selected =
                                    selectedChannels.includes(
                                        channel.value
                                    );


                                return (

                                    <button
                                        key={
                                            channel.value
                                        }
                                        type="button"
                                        onClick={() =>
                                            toggleChannel(
                                                channel.value
                                            )
                                        }
                                        disabled={
                                            saving ||
                                            sending
                                        }
                                        style={{
                                            textAlign:
                                                'left',

                                            padding:
                                                '1rem',

                                            borderRadius:
                                                '12px',

                                            border:
                                                selected
                                                    ? '2px solid #c46d53'
                                                    : '1px solid #ddd',

                                            background:
                                                selected
                                                    ? '#fdf7f5'
                                                    : '#fff',

                                            cursor:
                                                'pointer',
                                        }}
                                    >

                                        <div
                                            style={{
                                                display:
                                                    'flex',

                                                alignItems:
                                                    'center',

                                                gap:
                                                    '0.65rem',

                                                marginBottom:
                                                    '0.4rem',
                                            }}
                                        >

                                            <span
                                                style={{
                                                    width:
                                                        '20px',

                                                    height:
                                                        '20px',

                                                    borderRadius:
                                                        '50%',

                                                    border:
                                                        selected
                                                            ? '6px solid #c46d53'
                                                            : '1px solid #bbb',

                                                    boxSizing:
                                                        'border-box',

                                                    flexShrink:
                                                        0,
                                                }}
                                            />

                                            <strong>
                                                {
                                                    channel.label
                                                }
                                            </strong>

                                        </div>


                                        <p
                                            style={{
                                                margin:
                                                    0,

                                                fontSize:
                                                    '0.8rem',

                                                color:
                                                    '#777',

                                                lineHeight:
                                                    1.45,
                                            }}
                                        >
                                            {
                                                channel.description
                                            }
                                        </p>

                                    </button>

                                );

                            }
                        )}

                    </div>

                </div>


                {/* =================================================
                    3. AUDIENCE
                ================================================= */}

                <div
                    style={{
                        marginTop:
                            '2rem',

                        paddingTop:
                            '1.5rem',

                        borderTop:
                            '1px solid #eee',
                    }}
                >

                    <div
                        style={{
                            marginBottom:
                                '1rem',
                        }}
                    >

                        <span className="communication-eyebrow">
                            3. Público
                        </span>

                        <h3
                            style={{
                                margin:
                                    '0.25rem 0 0',
                            }}
                        >
                            Quem receberá essa comunicação?
                        </h3>

                        <p
                            style={{
                                margin:
                                    '0.4rem 0 0',

                                color:
                                    '#777',

                                fontSize:
                                    '0.85rem',
                            }}
                        >
                            Selecione um ou mais públicos
                            para esta campanha.
                        </p>

                    </div>


                    {audiences.length === 0 ? (

                        <div
                            className="communication-empty"
                            style={{
                                padding:
                                    '1.5rem',
                            }}
                        >

                            <h4>
                                Nenhum público cadastrado
                            </h4>

                            <p>
                                Cadastre uma audiência
                                antes de programar
                                esta campanha.
                            </p>

                        </div>

                    ) : (

                        <div
                            style={{
                                display:
                                    'grid',

                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(250px, 1fr))',

                                gap:
                                    '0.75rem',
                            }}
                        >

                            {audiences.map(
                                (
                                    audience
                                ) => {

                                    const selected =
                                        selectedAudienceIds.includes(
                                            audience.id
                                        );


                                    return (

                                        <button
                                            key={
                                                audience.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                toggleAudience(
                                                    audience.id
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                sending
                                            }
                                            style={{
                                                textAlign:
                                                    'left',

                                                padding:
                                                    '1rem',

                                                borderRadius:
                                                    '12px',

                                                border:
                                                    selected
                                                        ? '2px solid #c46d53'
                                                        : '1px solid #ddd',

                                                background:
                                                    selected
                                                        ? '#fdf7f5'
                                                        : '#fff',

                                                cursor:
                                                    'pointer',
                                            }}
                                        >

                                            <div
                                                style={{
                                                    display:
                                                        'flex',

                                                    alignItems:
                                                        'center',

                                                    gap:
                                                        '0.65rem',

                                                    marginBottom:
                                                        '0.4rem',
                                                }}
                                            >

                                                <span
                                                    style={{
                                                        width:
                                                            '20px',

                                                        height:
                                                            '20px',

                                                        borderRadius:
                                                            '50%',

                                                        border:
                                                            selected
                                                                ? '6px solid #c46d53'
                                                                : '1px solid #bbb',

                                                        boxSizing:
                                                            'border-box',

                                                        flexShrink:
                                                            0,
                                                    }}
                                                />

                                                <strong>
                                                    {
                                                        audience.name
                                                    }
                                                </strong>

                                            </div>


                                            {audience.description && (

                                                <p
                                                    style={{
                                                        margin:
                                                            0,

                                                        fontSize:
                                                            '0.8rem',

                                                        color:
                                                            '#777',

                                                        lineHeight:
                                                            1.45,
                                                    }}
                                                >
                                                    {
                                                        audience.description
                                                    }
                                                </p>

                                            )}

                                        </button>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <footer
                className="communication-editor-actions"
                style={{
                    display:
                        'flex',

                    alignItems:
                        'center',

                    justifyContent:
                        'space-between',

                    gap:
                        '0.75rem',

                    flexWrap:
                        'wrap',
                }}
            >

                {/* -------------------------------------------------
                    LEFT
                ------------------------------------------------- */}

                <button
                    type="button"
                    className="communication-button communication-button-secondary"
                    onClick={onCancel}
                    disabled={
                        saving ||
                        sending
                    }
                >
                    Cancelar
                </button>


                {/* -------------------------------------------------
                    RIGHT
                ------------------------------------------------- */}

                <div
                    style={{
                        display:
                            'flex',

                        alignItems:
                            'center',

                        gap:
                            '0.75rem',

                        flexWrap:
                            'wrap',
                    }}
                >

                    {/* PREVIEW */}

                    <button
                        type="button"
                        className="communication-button communication-button-secondary"
                        onClick={handlePreview}
                        disabled={
                            saving ||
                            sending ||
                            loadingConfiguration
                        }
                    >
                        👁️ Preview
                    </button>


                    {/* SAVE */}

                    <button
                        type="button"
                        className="communication-button communication-button-secondary"
                        onClick={() =>
                            void handleSave()
                        }
                        disabled={
                            saving ||
                            sending ||
                            loadingConfiguration
                        }
                    >

                        {saving
                            ? 'Salvando...'
                            : 'Salvar rascunho'}

                    </button>


                    {/* SEND */}

                    <button
                        type="button"
                        className="communication-button communication-button-primary"
                        onClick={() =>
                            void handleSend()
                        }
                        disabled={
                            saving ||
                            sending ||
                            loadingConfiguration
                        }
                    >

                        {sending
                            ? 'Enviando...'
                            : 'Enviar campanha'}

                    </button>

                </div>

            </footer>

        </section>

    );

}
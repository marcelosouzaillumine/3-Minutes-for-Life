import { illumineFetch } from '../lib/illumine';

import type {
    CommunicationAudience,
    CommunicationCampaign,
    CommunicationCampaignChannel,
    CommunicationCampaignStats,
    CommunicationDeliveryChannel,
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

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
    status?: CommunicationCampaign['status'];
}

export interface CommunicationCampaignTranslation {
    id: string;
    campaign_id: string;
    language: string;
    subject: string | null;
    title: string | null;
    body: string;
    cta_label: string | null;
    created_at: string;
    updated_at: string;
}

export interface UpsertCampaignTranslationInput {
    campaign_id: string;
    language: string;
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
        const res = await illumineFetch('/communications/campaigns?pageSize=200');
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 /communications/campaigns falhou com status ${res.status}`);
        const result = await res.json();
        return result.data ?? [];
    }

    async getCampaign(id: string): Promise<CommunicationCampaign | null> {
        const res = await illumineFetch(`/communications/campaigns/${id}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 /communications/campaigns/${id} falhou com status ${res.status}`);
        return await res.json();
    }

    async createCampaign(input: CreateCampaignInput): Promise<CommunicationCampaign> {
        const res = await illumineFetch('/communications/campaigns', {
            method: 'POST',
            body: JSON.stringify({
                name: input.name,
                type: input.type,
                language: input.language,
                subject: input.subject ?? null,
                title: input.title ?? null,
                body: input.body,
                cta_label: input.cta_label ?? null,
                cta_url: input.cta_url ?? null,
                scheduled_at: input.scheduled_at ?? null,
                channels: input.channels ?? [],
                audience_ids: input.audience_ids ?? [],
            }),
        });
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 POST /communications/campaigns falhou com status ${res.status}`);
        return await res.json();
    }

    async updateCampaign(id: string, input: UpdateCampaignInput): Promise<CommunicationCampaign> {
        const payload: Record<string, unknown> = {};
        if (input.name !== undefined) payload.name = input.name;
        if (input.type !== undefined) payload.type = input.type;
        if (input.language !== undefined) payload.language = input.language;
        if (input.subject !== undefined) payload.subject = input.subject;
        if (input.title !== undefined) payload.title = input.title;
        if (input.body !== undefined) payload.body = input.body;
        if (input.cta_label !== undefined) payload.cta_label = input.cta_label;
        if (input.cta_url !== undefined) payload.cta_url = input.cta_url;
        if (input.scheduled_at !== undefined) payload.scheduled_at = input.scheduled_at;
        if (input.status !== undefined) payload.status = input.status;
        if (input.channels !== undefined) payload.channels = input.channels;
        if (input.audience_ids !== undefined) payload.audience_ids = input.audience_ids;

        const res = await illumineFetch(`/communications/campaigns/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 PUT /communications/campaigns/${id} falhou com status ${res.status}`);
        return await res.json();
    }

    async deleteCampaign(id: string): Promise<void> {
        const res = await illumineFetch(`/communications/campaigns/${id}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error(`[AdminCommunicationService] L1 DELETE /communications/campaigns/${id} falhou com status ${res.status}`);
    }


    // =========================================================
    // TRANSLATIONS
    // TODO (L1): endpoints de tradução de campanhas não implementados no Illumine OS.
    // Estas operações não têm equivalente no gateway até que o L1 implemente
    // GET/POST/PATCH/DELETE /communications/campaigns/{id}/translations
    // =========================================================

    async listCampaignTranslations(_campaignId: string): Promise<CommunicationCampaignTranslation[]> {
        console.warn('[AdminCommunicationService] listCampaignTranslations: endpoint L1 não disponível');
        return [];
    }

    async getCampaignTranslation(_campaignId: string, _language: string): Promise<CommunicationCampaignTranslation | null> {
        console.warn('[AdminCommunicationService] getCampaignTranslation: endpoint L1 não disponível');
        return null;
    }

    async upsertCampaignTranslation(_input: UpsertCampaignTranslationInput): Promise<CommunicationCampaignTranslation> {
        throw new Error('[AdminCommunicationService] upsertCampaignTranslation: aguardando endpoint L1 /communications/campaigns/{id}/translations.');
    }

    async updateCampaignTranslation(
        _id: string,
        _input: Partial<Omit<UpsertCampaignTranslationInput, 'campaign_id'>>,
    ): Promise<CommunicationCampaignTranslation> {
        throw new Error('[AdminCommunicationService] updateCampaignTranslation: aguardando endpoint L1 /communications/campaigns/{id}/translations/{id}.');
    }

    async deleteCampaignTranslation(_id: string): Promise<void> {
        throw new Error('[AdminCommunicationService] deleteCampaignTranslation: aguardando endpoint L1.');
    }

    async deleteCampaignTranslationByLanguage(_campaignId: string, _language: string): Promise<void> {
        throw new Error('[AdminCommunicationService] deleteCampaignTranslationByLanguage: aguardando endpoint L1.');
    }


    // =========================================================
    // CHANNELS
    // =========================================================

    async getCampaignChannels(campaignId: string): Promise<CommunicationCampaignChannel[]> {
        const res = await illumineFetch(`/communications/campaigns/${campaignId}/channels`);
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 /communications/campaigns/${campaignId}/channels falhou`);
        return await res.json();
    }

    async setCampaignChannels(campaignId: string, channels: CommunicationDeliveryChannel[]): Promise<void> {
        const res = await illumineFetch(`/communications/campaigns/${campaignId}/channels`, {
            method: 'PUT',
            body: JSON.stringify({ channels }),
        });
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 PUT /communications/campaigns/${campaignId}/channels falhou`);
    }


    // =========================================================
    // AUDIENCES
    // =========================================================

    async listAudiences(): Promise<CommunicationAudience[]> {
        const res = await illumineFetch('/communications/audiences');
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 /communications/audiences falhou com status ${res.status}`);
        return await res.json();
    }

    async getAudience(_id: string): Promise<CommunicationAudience | null> {
        // TODO (L1): endpoint GET /communications/audiences/{id} não implementado ainda no Illumine OS
        console.warn('[AdminCommunicationService] getAudience: endpoint L1 individual não disponível');
        return null;
    }

    async getCampaignAudienceIds(campaignId: string): Promise<string[]> {
        const res = await illumineFetch(`/communications/campaigns/${campaignId}/audiences`);
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 /communications/campaigns/${campaignId}/audiences falhou`);
        const result = await res.json();
        return result.audience_ids ?? [];
    }

    async getCampaignAudiences(campaignId: string): Promise<CommunicationAudience[]> {
        const audienceIds = await this.getCampaignAudienceIds(campaignId);
        if (audienceIds.length === 0) return [];
        const all = await this.listAudiences();
        return all.filter(a => audienceIds.includes(a.id));
    }

    async setCampaignAudiences(campaignId: string, audienceIds: string[]): Promise<void> {
        const res = await illumineFetch(`/communications/campaigns/${campaignId}/audiences`, {
            method: 'PUT',
            body: JSON.stringify({ audience_ids: [...new Set(audienceIds.filter(Boolean))] }),
        });
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 PUT /communications/campaigns/${campaignId}/audiences falhou`);
    }


    // =========================================================
    // PREVIEW / SEND
    // =========================================================

    async getCampaignRecipientCount(_campaignId: string): Promise<number> {
        // TODO (L1): endpoint de contagem de destinatários não implementado no Illumine OS
        return -1;
    }

    async validateCampaignForSending(campaignId: string): Promise<void> {
        const campaign = await this.getCampaign(campaignId);
        if (!campaign) throw new Error('Campanha não encontrada.');
        if (campaign.status === 'sending') throw new Error('Esta campanha já está sendo enviada.');
        if (campaign.status === 'completed') throw new Error('Esta campanha já foi enviada.');
        if (!campaign.body?.trim()) throw new Error('O conteúdo da campanha está vazio.');

        const channels = await this.getCampaignChannels(campaignId);
        if (!channels.some(c => c.enabled)) throw new Error('Selecione pelo menos um canal de envio.');

        const audiences = await this.getCampaignAudiences(campaignId);
        if (audiences.length === 0) throw new Error('Selecione pelo menos um público.');
    }

    async sendCampaign(campaignId: string): Promise<CommunicationSendResult> {
        await this.validateCampaignForSending(campaignId);

        const res = await illumineFetch('/communications/dispatch', {
            method: 'POST',
            body: JSON.stringify({ campaignId }),
        });
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 /communications/dispatch falhou com status ${res.status}`);

        const result = await res.json();
        return {
            campaign_id: campaignId,
            total_recipients: result.users ?? 0,
            total_deliveries: result.deliveries ?? 0,
            status: 'sending',
        };
    }

    async completeCampaign(campaignId: string): Promise<void> {
        // Sinaliza conclusão via L1 update de status
        await this.updateCampaign(campaignId, { status: 'completed' });
    }


    // =========================================================
    // STATS
    // =========================================================

    async getCampaignStats(): Promise<CommunicationCampaignStats[]> {
        const res = await illumineFetch('/communications/campaigns/stats');
        if (!res.ok) throw new Error(`[AdminCommunicationService] L1 /communications/campaigns/stats falhou com status ${res.status}`);
        return await res.json();
    }
}


// =============================================================
// SINGLETON
// =============================================================

export const adminCommunicationService = new AdminCommunicationService();

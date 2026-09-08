import { supabase } from '../lib/supabase';
import { authService } from './authService';
import { illumineFetch, illumineAuth } from '../lib/illumine';

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
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch('/communications/campaigns?pageSize=200');
                if (res.ok) {
                    const result = await res.json();
                    return result.data ?? [];
                }
            } catch (e) {
                console.warn('[Comm] Illumine listCampaigns failed, falling back:', e);
            }
        }

        const { data, error } = await supabase
            .from('communication_campaigns')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []) as CommunicationCampaign[];
    }

    async getCampaign(id: string): Promise<CommunicationCampaign | null> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch(`/communications/campaigns/${id}`);
                if (res.ok) return await res.json();
                if (res.status === 404) return null;
            } catch (e) {
                console.warn('[Comm] Illumine getCampaign failed, falling back:', e);
            }
        }

        const { data, error } = await supabase
            .from('communication_campaigns')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data as CommunicationCampaign | null;
    }

    async createCampaign(input: CreateCampaignInput): Promise<CommunicationCampaign> {
        if (illumineAuth.isAuthenticated()) {
            try {
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
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('[Comm] Illumine createCampaign failed, falling back:', e);
            }
        }

        const session = await authService.getSession();
        const userId = session?.user?.id;
        if (!userId) throw new Error('Usuário não autenticado.');

        const { data, error } = await supabase
            .from('communication_campaigns')
            .insert({
                name: input.name,
                type: input.type,
                language: input.language,
                subject: input.subject ?? null,
                title: input.title ?? null,
                body: input.body,
                cta_label: input.cta_label ?? null,
                cta_url: input.cta_url ?? null,
                scheduled_at: input.scheduled_at ?? null,
                created_by: userId,
                status: 'draft',
            })
            .select()
            .single();
        if (error) throw error;

        const campaign = data as CommunicationCampaign;
        if (input.channels !== undefined) await this.setCampaignChannels(campaign.id, input.channels);
        if (input.audience_ids !== undefined) await this.setCampaignAudiences(campaign.id, input.audience_ids);
        return campaign;
    }

    async updateCampaign(id: string, input: UpdateCampaignInput): Promise<CommunicationCampaign> {
        if (illumineAuth.isAuthenticated()) {
            try {
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
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('[Comm] Illumine updateCampaign failed, falling back:', e);
            }
        }

        // Supabase fallback
        const updatePayload: Record<string, unknown> = {};
        if (input.name !== undefined) updatePayload.name = input.name;
        if (input.type !== undefined) updatePayload.type = input.type;
        if (input.language !== undefined) updatePayload.language = input.language;
        if (input.subject !== undefined) updatePayload.subject = input.subject;
        if (input.title !== undefined) updatePayload.title = input.title;
        if (input.body !== undefined) updatePayload.body = input.body;
        if (input.cta_label !== undefined) updatePayload.cta_label = input.cta_label;
        if (input.cta_url !== undefined) updatePayload.cta_url = input.cta_url;
        if (input.scheduled_at !== undefined) updatePayload.scheduled_at = input.scheduled_at;
        if (input.status !== undefined) updatePayload.status = input.status;

        let campaign: CommunicationCampaign;
        if (Object.keys(updatePayload).length > 0) {
            const { data, error } = await supabase
                .from('communication_campaigns')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            campaign = data as CommunicationCampaign;
        } else {
            const existing = await this.getCampaign(id);
            if (!existing) throw new Error('Campanha não encontrada.');
            campaign = existing;
        }

        if (input.channels !== undefined) await this.setCampaignChannels(id, input.channels);
        if (input.audience_ids !== undefined) await this.setCampaignAudiences(id, input.audience_ids);
        return campaign;
    }

    async deleteCampaign(id: string): Promise<void> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch(`/communications/campaigns/${id}`, { method: 'DELETE' });
                if (res.ok || res.status === 204) return;
            } catch (e) {
                console.warn('[Comm] Illumine deleteCampaign failed, falling back:', e);
            }
        }

        const { error } = await supabase
            .from('communication_campaigns')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }


    // =========================================================
    // TRANSLATIONS (Supabase only — sem equivalente no gateway)
    // =========================================================

    async listCampaignTranslations(campaignId: string): Promise<CommunicationCampaignTranslation[]> {
        const { data, error } = await supabase
            .from('communication_campaign_translations')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('language', { ascending: true });
        if (error) throw error;
        return (data ?? []) as CommunicationCampaignTranslation[];
    }

    async getCampaignTranslation(campaignId: string, language: string): Promise<CommunicationCampaignTranslation | null> {
        const { data, error } = await supabase
            .from('communication_campaign_translations')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('language', language)
            .maybeSingle();
        if (error) throw error;
        return data as CommunicationCampaignTranslation | null;
    }

    async upsertCampaignTranslation(input: UpsertCampaignTranslationInput): Promise<CommunicationCampaignTranslation> {
        if (!input.campaign_id) throw new Error('Campanha não informada.');
        if (!input.language) throw new Error('Idioma da tradução não informado.');
        if (!input.body?.trim()) throw new Error('O conteúdo da tradução é obrigatório.');

        const campaign = await this.getCampaign(input.campaign_id);
        if (!campaign) throw new Error('Campanha não encontrada.');

        const { data, error } = await supabase
            .from('communication_campaign_translations')
            .upsert(
                {
                    campaign_id: input.campaign_id,
                    language: input.language,
                    subject: input.subject ?? null,
                    title: input.title ?? null,
                    body: input.body,
                    cta_label: input.cta_label ?? null,
                },
                { onConflict: 'campaign_id,language' },
            )
            .select()
            .single();
        if (error) throw error;
        return data as CommunicationCampaignTranslation;
    }

    async updateCampaignTranslation(
        id: string,
        input: Partial<Omit<UpsertCampaignTranslationInput, 'campaign_id'>>,
    ): Promise<CommunicationCampaignTranslation> {
        const payload: Record<string, unknown> = {};
        if (input.language !== undefined) payload.language = input.language;
        if (input.subject !== undefined) payload.subject = input.subject;
        if (input.title !== undefined) payload.title = input.title;
        if (input.body !== undefined) {
            if (!input.body.trim()) throw new Error('O conteúdo da tradução não pode ficar vazio.');
            payload.body = input.body;
        }
        if (input.cta_label !== undefined) payload.cta_label = input.cta_label;

        if (Object.keys(payload).length === 0) {
            const { data, error } = await supabase
                .from('communication_campaign_translations')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data as CommunicationCampaignTranslation;
        }

        const { data, error } = await supabase
            .from('communication_campaign_translations')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as CommunicationCampaignTranslation;
    }

    async deleteCampaignTranslation(id: string): Promise<void> {
        const { error } = await supabase
            .from('communication_campaign_translations')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async deleteCampaignTranslationByLanguage(campaignId: string, language: string): Promise<void> {
        const { error } = await supabase
            .from('communication_campaign_translations')
            .delete()
            .eq('campaign_id', campaignId)
            .eq('language', language);
        if (error) throw error;
    }


    // =========================================================
    // CHANNELS
    // =========================================================

    async getCampaignChannels(campaignId: string): Promise<CommunicationCampaignChannel[]> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch(`/communications/campaigns/${campaignId}/channels`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('[Comm] Illumine getCampaignChannels failed, falling back:', e);
            }
        }

        const { data, error } = await supabase
            .from('communication_campaign_channels')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return (data ?? []) as CommunicationCampaignChannel[];
    }

    async setCampaignChannels(campaignId: string, channels: CommunicationDeliveryChannel[]): Promise<void> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch(`/communications/campaigns/${campaignId}/channels`, {
                    method: 'PUT',
                    body: JSON.stringify({ channels }),
                });
                if (res.ok) return;
            } catch (e) {
                console.warn('[Comm] Illumine setCampaignChannels failed, falling back:', e);
            }
        }

        const all: CommunicationDeliveryChannel[] = ['in_app', 'email', 'whatsapp'];
        const selected = new Set(channels);
        await Promise.all(
            all.map(ch =>
                supabase
                    .from('communication_campaign_channels')
                    .upsert({ campaign_id: campaignId, channel: ch, enabled: selected.has(ch) }, { onConflict: 'campaign_id,channel' }),
            ),
        );
    }


    // =========================================================
    // AUDIENCES
    // =========================================================

    async listAudiences(): Promise<CommunicationAudience[]> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch('/communications/audiences');
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('[Comm] Illumine listAudiences failed, falling back:', e);
            }
        }

        const { data, error } = await supabase
            .from('communication_audiences')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return (data ?? []) as CommunicationAudience[];
    }

    async getAudience(id: string): Promise<CommunicationAudience | null> {
        const { data, error } = await supabase
            .from('communication_audiences')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data as CommunicationAudience | null;
    }

    async getCampaignAudienceIds(campaignId: string): Promise<string[]> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch(`/communications/campaigns/${campaignId}/audiences`);
                if (res.ok) {
                    const result = await res.json();
                    return result.audience_ids ?? [];
                }
            } catch (e) {
                console.warn('[Comm] Illumine getCampaignAudienceIds failed, falling back:', e);
            }
        }

        const { data, error } = await supabase
            .from('communication_campaign_audiences')
            .select('audience_id')
            .eq('campaign_id', campaignId);
        if (error) throw error;
        return (data ?? []).map(row => row.audience_id as string);
    }

    async getCampaignAudiences(campaignId: string): Promise<CommunicationAudience[]> {
        const audienceIds = await this.getCampaignAudienceIds(campaignId);
        if (audienceIds.length === 0) return [];

        const { data, error } = await supabase
            .from('communication_audiences')
            .select('*')
            .in('id', audienceIds)
            .order('name', { ascending: true });
        if (error) throw error;
        return (data ?? []) as CommunicationAudience[];
    }

    async setCampaignAudiences(campaignId: string, audienceIds: string[]): Promise<void> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch(`/communications/campaigns/${campaignId}/audiences`, {
                    method: 'PUT',
                    body: JSON.stringify({ audience_ids: [...new Set(audienceIds.filter(Boolean))] }),
                });
                if (res.ok) return;
            } catch (e) {
                console.warn('[Comm] Illumine setCampaignAudiences failed, falling back:', e);
            }
        }

        const unique = [...new Set(audienceIds.filter(Boolean))];
        const { error: deleteError } = await supabase
            .from('communication_campaign_audiences')
            .delete()
            .eq('campaign_id', campaignId);
        if (deleteError) throw deleteError;

        if (unique.length === 0) return;

        const { error: insertError } = await supabase
            .from('communication_campaign_audiences')
            .insert(unique.map(audienceId => ({ campaign_id: campaignId, audience_id: audienceId })));
        if (insertError) throw insertError;
    }


    // =========================================================
    // PREVIEW / SEND
    // =========================================================

    async getCampaignRecipientCount(campaignId: string): Promise<number> {
        if (!campaignId) return 0;

        const { data, error } = await supabase
            .from('communication_campaign_recipient_counts')
            .select('total_recipients')
            .eq('campaign_id', campaignId)
            .maybeSingle();

        if (error) {
            if (error.code === 'PGRST205') {
                console.warn('[Communication] tabela recipient_counts não existe. Validação continua sem contagem.');
                return -1;
            }
            throw error;
        }
        return data?.total_recipients ?? 0;
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

        const recipientCount = await this.getCampaignRecipientCount(campaignId);
        if (recipientCount === 0) throw new Error('Nenhum destinatário elegível foi encontrado.');
    }

    async sendCampaign(campaignId: string): Promise<CommunicationSendResult> {
        await this.validateCampaignForSending(campaignId);

        // Illumine-first dispatch
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch('/communications/dispatch', {
                    method: 'POST',
                    body: JSON.stringify({ campaignId }),
                });
                if (res.ok) {
                    const result = await res.json();
                    return {
                        campaign_id: campaignId,
                        total_recipients: result.users ?? 0,
                        total_deliveries: result.deliveries ?? 0,
                        status: 'sending',
                    };
                }
            } catch (e) {
                console.warn('[Comm] Illumine dispatch failed, falling back to edge function:', e);
            }
        }

        // Supabase edge function fallback
        const { data, error } = await supabase.functions.invoke('communication-dispatch', {
            body: { campaign_id: campaignId },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error ?? 'Não foi possível iniciar o envio.');

        return {
            campaign_id: campaignId,
            total_recipients: data.users ?? 0,
            total_deliveries: data.deliveries ?? 0,
            status: 'sending',
        };
    }

    async completeCampaign(campaignId: string): Promise<void> {
        const { error } = await supabase
            .from('communication_campaigns')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', campaignId);
        if (error) throw error;
    }


    // =========================================================
    // STATS
    // =========================================================

    async getCampaignStats(): Promise<CommunicationCampaignStats[]> {
        if (illumineAuth.isAuthenticated()) {
            try {
                const res = await illumineFetch('/communications/campaigns/stats');
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('[Comm] Illumine getCampaignStats failed, falling back:', e);
            }
        }

        const { data, error } = await supabase
            .from('communication_campaign_stats')
            .select('*')
            .order('name');
        if (error) throw error;
        return (data ?? []) as CommunicationCampaignStats[];
    }
}


// =============================================================
// SINGLETON
// =============================================================

export const adminCommunicationService = new AdminCommunicationService();

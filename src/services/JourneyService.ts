import { illumineFetch } from '../lib/illumine';
import { AnalyticsService } from './AnalyticsService';

export const JourneyService = {

  /**
   * Registra a abertura de um episódio por um usuário logado: o evento de
   * analytics (aberturas) e a marcação como lido (leituras únicas). Os dois
   * precisam andar juntos — quando só o evento era enviado (Home, desde
   * 20/08), as leituras únicas deixaram de crescer.
   */
  registerOpen(
    devotional: { id: string; legacy_id?: number; title?: string },
    channel: 'home' | 'library' | 'favorites',
    language: string
  ) {
    AnalyticsService.trackEvent('devotional_opened', {
      devotional_id: devotional.id,
      title: devotional.title,
      channel,
      language,
    });
    return this.start(devotional.id, devotional.legacy_id).catch(console.error);
  },

  async start(devotionalId: string, legacyId?: number) {
    const path = legacyId
      ? `/devotionals/legacy/${legacyId}/read`
      : `/devotionals/${devotionalId}/read`;
    await illumineFetch(path, { method: 'POST' });
  },

  async complete(devotionalId: string, legacyId?: number) {
    const path = legacyId
      ? `/devotionals/legacy/${legacyId}/complete`
      : `/devotionals/${devotionalId}/complete`;
    await illumineFetch(path, { method: 'POST' });
  },

  async toggleFavorite(devotionalId: string, legacyId?: number): Promise<boolean> {
    const favRes = await illumineFetch('/devotionals/favorites');
    if (!favRes.ok) throw new Error('Failed to fetch favorites');

    const favs = await favRes.json() as any[];
    const isFav = favs.some(f =>
      (f.devotional?.supabaseId ?? f.devotional?.id) === devotionalId ||
      f.devotionalId === devotionalId
    );

    const method = isFav ? 'DELETE' : 'POST';
    const path = legacyId
      ? `/devotionals/legacy/${legacyId}/favorite`
      : `/devotionals/${devotionalId}/favorite`;

    await illumineFetch(path, { method });
    return !isFav;
  },

  async getStatus(devotionalId: string, legacyId?: number) {
    const path = legacyId
      ? `/devotionals/legacy/${legacyId}/status`
      : `/devotionals/${devotionalId}/status`;

    const res = await illumineFetch(path);
    if (!res.ok) return null;

    const d = await res.json();
    return { started_at: d.readAt ?? null, completed_at: d.completedAt ?? null };
  },

  async isFavorite(devotionalId: string, _legacyId?: number): Promise<boolean> {
    const favIds = await this.listFavorites();
    return favIds.includes(devotionalId);
  },

  async listFavorites(): Promise<string[]> {
    const res = await illumineFetch('/devotionals/favorites');
    if (!res.ok) return [];
    const data = await res.json();
    return (data as any[])
      .map(f => f.devotional?.supabaseId ?? f.devotional?.id)
      .filter(Boolean);
  },
};

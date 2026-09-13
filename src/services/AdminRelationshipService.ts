import { illumineFetch } from '../lib/illumine';
import type {
  AdminTestimonialItem,
  AdminPrayerRequestItem,
  RelationshipOverviewMetrics,
  RecentRelationshipItem,
  RelationshipFilters,
  PaginatedResult,
  TestimonialAdminStatus,
  PrayerRequestAdminStatus,
  RelationshipContact,
  RelationshipReply,
} from '../types/Relationship';

export const AdminRelationshipService = {
  async checkRelationshipAccess(): Promise<boolean> {
    const res = await illumineFetch('/users/me');
    if (!res.ok) return false;
    const user = await res.json();
    const role = user?.role ?? user?.app_role ?? user?.admin_role;
    return role ? ['super_admin', 'admin'].includes(role) : false;
  },

  async getOverview(): Promise<RelationshipOverviewMetrics> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) throw new Error('Unauthorized: Requires super_admin or admin role');

    const res = await illumineFetch('/pastoral/metrics');
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 /pastoral/metrics falhou com status ${res.status}`);

    const m = await res.json();
    const recentActivity: RecentRelationshipItem[] = [
      ...(m.recent_testimonials || []).map((t: any): RecentRelationshipItem => ({
        id: t.id,
        type: 'testimonial',
        user_id: t.userId,
        user_full_name: t.user?.name ?? null,
        devotional_id: t.devotionalId ?? null,
        devotional_title: null,
        language: t.language ?? 'pt-BR',
        content_preview: (t.content || '').slice(0, 120),
        full_content: t.content || '',
        status: t.status,
        created_at: t.createdAt,
      })),
      ...(m.recent_prayers || []).map((p: any): RecentRelationshipItem => ({
        id: p.id,
        type: 'prayer_request',
        user_id: p.userId,
        user_full_name: p.user?.name ?? null,
        devotional_id: p.devotionalId ?? null,
        devotional_title: null,
        language: p.language ?? 'pt-BR',
        content_preview: (p.request || '').slice(0, 120),
        full_content: p.request || '',
        status: p.status,
        created_at: p.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    const langDist = { 'pt-BR': 0, 'en': 0, 'es': 0 };
    Object.entries(m.language_distribution || {}).forEach(([lang, count]) => {
      const k: 'pt-BR' | 'en' | 'es' = lang.startsWith('en') ? 'en' : lang.startsWith('es') ? 'es' : 'pt-BR';
      langDist[k] = (langDist[k] || 0) + (count as number);
    });

    return {
      testimonials: m.testimonials,
      prayer_requests: m.prayer_requests,
      recent_activity: recentActivity,
      language_distribution: langDist,
    };
  },

  async getTestimonials(filters: RelationshipFilters = {}): Promise<PaginatedResult<AdminTestimonialItem>> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) throw new Error('Unauthorized: Requires super_admin or admin role');

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.search?.trim()) params.set('search', filters.search.trim());

    const res = await illumineFetch(`/pastoral/testimonials?${params}`);
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 /pastoral/testimonials falhou com status ${res.status}`);

    const body = await res.json();
    return {
      data: (body.data || []).map((t: any): AdminTestimonialItem => ({
        id: t.id,
        user_id: t.userId,
        user_full_name: t.user?.name ?? null,
        devotional_id: t.devotionalId ?? null,
        devotional_title: null,
        content: t.content,
        status: t.status as TestimonialAdminStatus,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
      total: body.total,
      page: body.page,
      pageSize: body.pageSize,
      totalPages: body.totalPages,
    };
  },

  async getPrayerRequests(filters: RelationshipFilters = {}): Promise<PaginatedResult<AdminPrayerRequestItem>> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) throw new Error('Unauthorized: Requires super_admin or admin role');

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.language && filters.language !== 'all') params.set('language', filters.language);
    if (filters.search?.trim()) params.set('search', filters.search.trim());

    const res = await illumineFetch(`/pastoral/prayer-requests?${params}`);
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 /pastoral/prayer-requests falhou com status ${res.status}`);

    const body = await res.json();
    return {
      data: (body.data || []).map((p: any): AdminPrayerRequestItem => ({
        id: p.id,
        user_id: p.userId,
        user_full_name: p.user?.name ?? null,
        devotional_id: p.devotionalId ?? null,
        devotional_title: null,
        language: p.language,
        request: p.request,
        status: p.status as PrayerRequestAdminStatus,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
      total: body.total,
      page: body.page,
      pageSize: body.pageSize,
      totalPages: body.totalPages,
    };
  },

  async updateTestimonialStatus(id: string, newStatus: TestimonialAdminStatus): Promise<void> {
    const res = await illumineFetch(`/pastoral/testimonials/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 /pastoral/testimonials/${id}/status falhou`);
  },

  async updatePrayerRequestStatus(id: string, newStatus: PrayerRequestAdminStatus): Promise<void> {
    const res = await illumineFetch(`/pastoral/prayer-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 /pastoral/prayer-requests/${id}/status falhou`);
  },

  async getContact(
    relationshipType: 'testimonial' | 'prayer_request',
    relationshipId: string
  ): Promise<RelationshipContact> {
    const path = relationshipType === 'testimonial'
      ? `/pastoral/testimonials/${relationshipId}/contact`
      : `/pastoral/prayer-requests/${relationshipId}/contact`;
    const res = await illumineFetch(path);
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 ${path} falhou com status ${res.status}`);
    const d = await res.json();
    return {
      user_id: d.user_id,
      full_name: d.full_name,
      phone: d.phone ?? d.whatsapp_number ?? null,
      email: d.email,
      consent_whatsapp: null,
      consent_email: null,
    };
  },

  async recordReply(params: {
    relationshipType: 'testimonial' | 'prayer_request';
    relationshipId: string;
    channel: 'whatsapp' | 'email' | 'in_app';
    message: string;
  }): Promise<void> {
    const path = params.relationshipType === 'testimonial'
      ? `/pastoral/testimonials/${params.relationshipId}/reply`
      : `/pastoral/prayer-requests/${params.relationshipId}/reply`;
    const res = await illumineFetch(path, {
      method: 'POST',
      body: JSON.stringify({ channel: params.channel, message: params.message }),
    });
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 ${path} falhou com status ${res.status}`);
  },

  async getReplies(
    relationshipType: 'testimonial' | 'prayer_request',
    relationshipId: string
  ): Promise<RelationshipReply[]> {
    const path = relationshipType === 'testimonial'
      ? `/pastoral/testimonials/${relationshipId}/replies`
      : `/pastoral/prayer-requests/${relationshipId}/replies`;
    const res = await illumineFetch(path);
    if (!res.ok) throw new Error(`[AdminRelationshipService] L1 ${path} falhou com status ${res.status}`);
    return (await res.json()) as RelationshipReply[];
  },
};

export function buildReplyLink(
  channel: 'whatsapp' | 'email',
  contact: RelationshipContact,
  message: string,
  subject = 'Sobre a sua mensagem no 3 Minutos para a Vida'
): string | null {
  if (channel === 'whatsapp') {
    if (!contact.phone) return null;
    const digits = contact.phone.replace(/\D/g, '');
    if (!digits) return null;
    const normalized = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  }
  if (!contact.email) return null;
  return `mailto:${contact.email}`
    + `?subject=${encodeURIComponent(subject)}`
    + `&body=${encodeURIComponent(message)}`;
}

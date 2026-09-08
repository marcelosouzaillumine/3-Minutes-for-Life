import { supabase } from '../lib/supabase';
import { illumineFetch } from '../lib/illumine';
import { authService } from './authService';
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

function getPeriodStartDate(period?: 'today' | '7d' | '30d' | 'all'): string | null {
  if (!period || period === 'all') return null;
  const date = new Date();
  if (period === 'today') {
    date.setHours(0, 0, 0, 0);
  } else if (period === '7d') {
    date.setDate(date.getDate() - 7);
  } else if (period === '30d') {
    date.setDate(date.getDate() - 30);
  }
  return date.toISOString();
}

async function resolveProfilesAndDevotionals(
  items: Array<{ user_id: string; devotional_id?: string | null }>
): Promise<{ profilesMap: Map<string, string>; devotionalsMap: Map<string, string> }> {
  const userIds = [...new Set(items.map(i => i.user_id).filter(Boolean))];
  const devotionalIds = [...new Set(items.map(i => i.devotional_id).filter(Boolean))] as string[];

  const profilesMap = new Map<string, string>();
  const devotionalsMap = new Map<string, string>();

  if (userIds.length > 0) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      (profiles || []).forEach((p: any) => {
        if (p.full_name) profilesMap.set(p.id, p.full_name);
      });
    } catch (err) {
      console.warn('Could not batch-resolve profiles:', err);
    }
  }

  if (devotionalIds.length > 0) {
    try {
      const { data: devotionals } = await supabase
        .from('devotionals')
        .select('id, title')
        .in('id', devotionalIds);
      (devotionals || []).forEach((d: any) => {
        if (d.title) devotionalsMap.set(d.id, d.title);
      });
    } catch (err) {
      console.warn('Could not batch-resolve devotionals:', err);
    }
  }

  return { profilesMap, devotionalsMap };
}

export const AdminRelationshipService = {
  async checkRelationshipAccess(): Promise<boolean> {
    // Illumine-first
    try {
      const res = await illumineFetch('/users/me');
      if (res.ok) {
        const user = await res.json();
        const role = user?.role ?? user?.app_role ?? user?.admin_role;
        if (role) return ['super_admin', 'admin'].includes(role);
      }
    } catch {
      // fallthrough
    }

    // Supabase: user_roles table
    const session = await authService.getSession().catch(() => null);
    const userId = session?.user?.id;
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .is('revoked_at', null)
        .maybeSingle();
      if (!error && data?.role) return ['super_admin', 'admin'].includes((data as any).role);
    } catch {
      // fallthrough
    }

    // Supabase: JWT app_metadata fallback (set via Supabase dashboard or auth hook)
    const appRole = (session?.user as any)?.app_metadata?.role
      ?? (session?.user as any)?.app_metadata?.app_role;
    if (appRole) return ['super_admin', 'admin'].includes(appRole);

    return false;
  },

  async getOverview(): Promise<RelationshipOverviewMetrics> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) throw new Error('Unauthorized: Requires super_admin or admin role');

    try {
      const res = await illumineFetch('/pastoral/metrics');
      if (res.ok) {
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
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    const { data: rawTestimonials, error: tmError } = await supabase
      .from('testimonials')
      .select('id, user_id, content, status, created_at, devotional_id')
      .order('created_at', { ascending: false });
    if (tmError) throw tmError;

    const { data: rawPrayers, error: prError } = await supabase
      .from('prayer_requests')
      .select('id, user_id, request, language, status, created_at, devotional_id')
      .order('created_at', { ascending: false });
    if (prError) throw prError;

    const testimonialsList = rawTestimonials || [];
    const prayersList = rawPrayers || [];

    const tmMetrics = {
      pending: testimonialsList.filter(t => t.status === 'pending').length,
      reviewed: testimonialsList.filter(t => t.status === 'reviewed').length,
      archived: testimonialsList.filter(t => t.status === 'archived').length,
      total: testimonialsList.length,
    };
    const prMetrics = {
      pending: prayersList.filter(p => p.status === 'pending').length,
      prayed: prayersList.filter(p => p.status === 'prayed').length,
      archived: prayersList.filter(p => p.status === 'archived').length,
      total: prayersList.length,
    };
    const langDist = { 'pt-BR': 0, 'en': 0, 'es': 0 };
    prayersList.forEach(p => {
      const l: 'pt-BR' | 'en' | 'es' = p.language?.startsWith('en') ? 'en' : p.language?.startsWith('es') ? 'es' : 'pt-BR';
      langDist[l] = (langDist[l] || 0) + 1;
    });

    const topRecentRaw = [...testimonialsList.slice(0, 10), ...prayersList.slice(0, 10)];
    const { profilesMap, devotionalsMap } = await resolveProfilesAndDevotionals(topRecentRaw);

    const recentActivity: RecentRelationshipItem[] = [
      ...testimonialsList.slice(0, 10).map((t: any): RecentRelationshipItem => ({
        id: t.id, type: 'testimonial', user_id: t.user_id,
        user_full_name: profilesMap.get(t.user_id) || null,
        devotional_id: t.devotional_id || null,
        devotional_title: t.devotional_id ? devotionalsMap.get(t.devotional_id) || null : null,
        language: 'pt-BR', content_preview: t.content.slice(0, 120),
        full_content: t.content, status: t.status, created_at: t.created_at,
      })),
      ...prayersList.slice(0, 10).map((p: any): RecentRelationshipItem => ({
        id: p.id, type: 'prayer_request', user_id: p.user_id,
        user_full_name: profilesMap.get(p.user_id) || null,
        devotional_id: p.devotional_id || null,
        devotional_title: p.devotional_id ? devotionalsMap.get(p.devotional_id) || null : null,
        language: p.language || 'pt-BR', content_preview: p.request.slice(0, 120),
        full_content: p.request, status: p.status, created_at: p.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return { testimonials: tmMetrics, prayer_requests: prMetrics, recent_activity: recentActivity, language_distribution: langDist };
  },

  async getTestimonials(filters: RelationshipFilters = {}): Promise<PaginatedResult<AdminTestimonialItem>> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) throw new Error('Unauthorized: Requires super_admin or admin role');

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);

    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.search?.trim()) params.set('search', filters.search.trim());
      const res = await illumineFetch(`/pastoral/testimonials?${params}`);
      if (res.ok) {
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
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('testimonials')
      .select('id, user_id, content, status, created_at, updated_at, devotional_id', { count: 'exact' });
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    const startDate = getPeriodStartDate(filters.period);
    if (startDate) query = query.gte('created_at', startDate);
    if (filters.search?.trim()) query = query.ilike('content', `%${filters.search.trim()}%`);
    query = query.order('created_at', { ascending: false }).range(from, to);
    const { data, error, count } = await query;
    if (error) throw error;
    const rawList = data || [];
    const { profilesMap, devotionalsMap } = await resolveProfilesAndDevotionals(rawList);
    const total = count || 0;
    return {
      data: rawList.map((t: any) => ({
        id: t.id, user_id: t.user_id, user_full_name: profilesMap.get(t.user_id) || null,
        devotional_id: t.devotional_id || null,
        devotional_title: t.devotional_id ? devotionalsMap.get(t.devotional_id) || null : null,
        content: t.content, status: t.status as TestimonialAdminStatus,
        created_at: t.created_at, updated_at: t.updated_at,
      })),
      total, page, pageSize, totalPages: Math.ceil(total / pageSize),
    };
  },

  async getPrayerRequests(filters: RelationshipFilters = {}): Promise<PaginatedResult<AdminPrayerRequestItem>> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) throw new Error('Unauthorized: Requires super_admin or admin role');

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);

    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.language && filters.language !== 'all') params.set('language', filters.language);
      if (filters.search?.trim()) params.set('search', filters.search.trim());
      const res = await illumineFetch(`/pastoral/prayer-requests?${params}`);
      if (res.ok) {
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
      }
    } catch {
      // fallthrough
    }

    // Supabase fallback
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('prayer_requests')
      .select('id, user_id, request, language, status, created_at, updated_at, devotional_id', { count: 'exact' });
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.language && filters.language !== 'all') query = query.eq('language', filters.language);
    const startDate = getPeriodStartDate(filters.period);
    if (startDate) query = query.gte('created_at', startDate);
    if (filters.search?.trim()) query = query.ilike('request', `%${filters.search.trim()}%`);
    query = query.order('created_at', { ascending: false }).range(from, to);
    const { data, error, count } = await query;
    if (error) throw error;
    const rawList = data || [];
    const { profilesMap, devotionalsMap } = await resolveProfilesAndDevotionals(rawList);
    const total = count || 0;
    return {
      data: rawList.map((p: any) => ({
        id: p.id, user_id: p.user_id, user_full_name: profilesMap.get(p.user_id) || null,
        devotional_id: p.devotional_id || null,
        devotional_title: p.devotional_id ? devotionalsMap.get(p.devotional_id) || null : null,
        language: p.language, request: p.request, status: p.status as PrayerRequestAdminStatus,
        created_at: p.created_at, updated_at: p.updated_at,
      })),
      total, page, pageSize, totalPages: Math.ceil(total / pageSize),
    };
  },

  async updateTestimonialStatus(id: string, newStatus: TestimonialAdminStatus): Promise<void> {
    try {
      const res = await illumineFetch(`/pastoral/testimonials/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) return;
    } catch {
      // fallthrough
    }

    const { error } = await supabase.rpc('update_relationship_status', {
      p_relationship_type: 'testimonial',
      p_relationship_id: id,
      p_new_status: newStatus,
    });
    if (error) throw error;
  },

  async updatePrayerRequestStatus(id: string, newStatus: PrayerRequestAdminStatus): Promise<void> {
    try {
      const res = await illumineFetch(`/pastoral/prayer-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) return;
    } catch {
      // fallthrough
    }

    const { error } = await supabase.rpc('update_relationship_status', {
      p_relationship_type: 'prayer_request',
      p_relationship_id: id,
      p_new_status: newStatus,
    });
    if (error) throw error;
  },

  async getContact(
    relationshipType: 'testimonial' | 'prayer_request',
    relationshipId: string
  ): Promise<RelationshipContact> {
    try {
      const path = relationshipType === 'testimonial'
        ? `/pastoral/testimonials/${relationshipId}/contact`
        : `/pastoral/prayer-requests/${relationshipId}/contact`;
      const res = await illumineFetch(path);
      if (res.ok) {
        const d = await res.json();
        return {
          user_id: d.user_id,
          full_name: d.full_name,
          phone: d.phone ?? d.whatsapp_number ?? null,
          email: d.email,
          consent_whatsapp: null,
          consent_email: null,
        };
      }
    } catch {
      // fallthrough
    }

    const { data, error } = await supabase.rpc('get_relationship_contact', {
      p_relationship_type: relationshipType,
      p_relationship_id: relationshipId,
    });
    if (error) throw error;
    return data as RelationshipContact;
  },

  async recordReply(params: {
    relationshipType: 'testimonial' | 'prayer_request';
    relationshipId: string;
    channel: 'whatsapp' | 'email' | 'in_app';
    message: string;
  }): Promise<void> {
    try {
      const path = params.relationshipType === 'testimonial'
        ? `/pastoral/testimonials/${params.relationshipId}/reply`
        : `/pastoral/prayer-requests/${params.relationshipId}/reply`;
      const res = await illumineFetch(path, {
        method: 'POST',
        body: JSON.stringify({ channel: params.channel, message: params.message }),
      });
      if (res.ok) return;
    } catch {
      // fallthrough
    }

    const { error } = await supabase.rpc('record_relationship_reply', {
      p_relationship_type: params.relationshipType,
      p_relationship_id: params.relationshipId,
      p_channel: params.channel,
      p_message: params.message,
    });
    if (error) throw error;
  },

  async getReplies(
    relationshipType: 'testimonial' | 'prayer_request',
    relationshipId: string
  ): Promise<RelationshipReply[]> {
    try {
      const path = relationshipType === 'testimonial'
        ? `/pastoral/testimonials/${relationshipId}/replies`
        : `/pastoral/prayer-requests/${relationshipId}/replies`;
      const res = await illumineFetch(path);
      if (res.ok) {
        return (await res.json()) as RelationshipReply[];
      }
    } catch {
      // fallthrough
    }

    const { data, error } = await supabase
      .from('relationship_replies')
      .select('id, channel, message, sent_at, admin_user_id')
      .eq('relationship_type', relationshipType)
      .eq('relationship_id', relationshipId)
      .order('sent_at', { ascending: false });
    if (error) throw error;
    return (data || []) as RelationshipReply[];
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

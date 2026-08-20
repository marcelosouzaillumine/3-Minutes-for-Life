import { supabase } from '../lib/supabase';
import type {
  AdminTestimonialItem,
  AdminPrayerRequestItem,
  RelationshipOverviewMetrics,
  RecentRelationshipItem,
  RelationshipFilters,
  PaginatedResult,
  TestimonialAdminStatus,
  PrayerRequestAdminStatus,
} from '../types/Relationship';

/**
 * Calculates ISO date range string based on period filter.
 */
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

/**
 * Helper to safely and efficiently batch-resolve profile names and devotional titles.
 */
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
      console.warn("Could not batch-resolve profiles:", err);
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
      console.warn("Could not batch-resolve devotionals:", err);
    }
  }

  return { profilesMap, devotionalsMap };
}

export const AdminRelationshipService = {
  /**
   * Checks if the authenticated user has explicit pastoral/admin access ('super_admin' or 'admin').
   * Note: 'analyst' is intentionally excluded from relationship pastoral access.
   */
  async checkRelationshipAccess(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .is('revoked_at', null)
      .limit(1);

    if (error) {
      console.error('[AdminRelationshipService] checkRelationshipAccess error:', error);
      return false;
    }
    if (!data || data.length === 0) return false;
    return ['super_admin', 'admin'].includes(data[0].role);
  },

  /**
   * Fetches aggregated overview metrics for the Relationship Management Center.
   */
  async getOverview(): Promise<RelationshipOverviewMetrics> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) {
      throw new Error("Unauthorized: Requires super_admin or admin role");
    }

    // 1. Fetch Testimonials
    const { data: rawTestimonials, error: tmError } = await supabase
      .from('testimonials')
      .select('id, user_id, content, status, created_at, devotional_id')
      .order('created_at', { ascending: false });

    if (tmError) {
      console.error('[AdminRelationshipService] getOverview testimonials error:', JSON.stringify(tmError));
      throw tmError;
    }

    // 2. Fetch Prayer Requests
    const { data: rawPrayers, error: prError } = await supabase
      .from('prayer_requests')
      .select('id, user_id, request, language, status, created_at, devotional_id')
      .order('created_at', { ascending: false });

    if (prError) {
      console.error('[AdminRelationshipService] getOverview prayer_requests error:', JSON.stringify(prError));
      throw prError;
    }

    const testimonialsList = rawTestimonials || [];
    const prayersList = rawPrayers || [];

    // Calculate Testimonials metrics
    const tmMetrics = {
      pending: testimonialsList.filter(t => t.status === 'pending').length,
      reviewed: testimonialsList.filter(t => t.status === 'reviewed').length,
      archived: testimonialsList.filter(t => t.status === 'archived').length,
      total: testimonialsList.length,
    };

    // Calculate Prayer Requests metrics
    const prMetrics = {
      pending: prayersList.filter(p => p.status === 'pending').length,
      prayed: prayersList.filter(p => p.status === 'prayed').length,
      archived: prayersList.filter(p => p.status === 'archived').length,
      total: prayersList.length,
    };

    // Calculate Language Distribution
    const langDist = {
      'pt-BR': 0,
      'en': 0,
      'es': 0,
    };

    prayersList.forEach(p => {
      const l = p.language?.startsWith('en') ? 'en' : p.language?.startsWith('es') ? 'es' : 'pt-BR';
      langDist[l] = (langDist[l] || 0) + 1;
    });

    // Batch resolve top 10 profiles and devotionals for recent activity
    const topRecentRaw = [
      ...testimonialsList.slice(0, 10),
      ...prayersList.slice(0, 10),
    ];
    const { profilesMap, devotionalsMap } = await resolveProfilesAndDevotionals(topRecentRaw);

    // Merge recent items into unified activity feed
    const recentActivity: RecentRelationshipItem[] = [
      ...testimonialsList.slice(0, 10).map((t: any): RecentRelationshipItem => ({
        id: t.id,
        type: 'testimonial',
        user_id: t.user_id,
        user_full_name: profilesMap.get(t.user_id) || null,
        devotional_id: t.devotional_id || null,
        devotional_title: t.devotional_id ? devotionalsMap.get(t.devotional_id) || null : null,
        language: 'pt-BR',
        content_preview: t.content.slice(0, 120),
        full_content: t.content,
        status: t.status,
        created_at: t.created_at,
      })),
      ...prayersList.slice(0, 10).map((p: any): RecentRelationshipItem => ({
        id: p.id,
        type: 'prayer_request',
        user_id: p.user_id,
        user_full_name: profilesMap.get(p.user_id) || null,
        devotional_id: p.devotional_id || null,
        devotional_title: p.devotional_id ? devotionalsMap.get(p.devotional_id) || null : null,
        language: p.language || 'pt-BR',
        content_preview: p.request.slice(0, 120),
        full_content: p.request,
        status: p.status,
        created_at: p.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, 10);

    return {
      testimonials: tmMetrics,
      prayer_requests: prMetrics,
      recent_activity: recentActivity,
      language_distribution: langDist,
    };
  },

  /**
   * Fetches paginated testimonials with filters.
   */
  async getTestimonials(filters: RelationshipFilters = {}): Promise<PaginatedResult<AdminTestimonialItem>> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) {
      throw new Error("Unauthorized: Requires super_admin or admin role");
    }

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('testimonials')
      .select('id, user_id, content, status, created_at, updated_at, devotional_id', { count: 'exact' });

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Filter by period
    const startDate = getPeriodStartDate(filters.period);
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    // Filter by search term
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      query = query.ilike('content', `%${term}%`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const rawList = data || [];
    const { profilesMap, devotionalsMap } = await resolveProfilesAndDevotionals(rawList);

    const total = count || 0;
    const items: AdminTestimonialItem[] = rawList.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      user_full_name: profilesMap.get(t.user_id) || null,
      devotional_id: t.devotional_id || null,
      devotional_title: t.devotional_id ? devotionalsMap.get(t.devotional_id) || null : null,
      content: t.content,
      status: t.status as TestimonialAdminStatus,
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * Fetches paginated prayer requests with filters.
   */
  async getPrayerRequests(filters: RelationshipFilters = {}): Promise<PaginatedResult<AdminPrayerRequestItem>> {
    const isAuthorized = await this.checkRelationshipAccess();
    if (!isAuthorized) {
      throw new Error("Unauthorized: Requires super_admin or admin role");
    }

    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 15);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('prayer_requests')
      .select('id, user_id, request, language, status, created_at, updated_at, devotional_id', { count: 'exact' });

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    // Filter by language
    if (filters.language && filters.language !== 'all') {
      query = query.eq('language', filters.language);
    }

    // Filter by period
    const startDate = getPeriodStartDate(filters.period);
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    // Filter by search term
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      query = query.ilike('request', `%${term}%`);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const rawList = data || [];
    const { profilesMap, devotionalsMap } = await resolveProfilesAndDevotionals(rawList);

    const total = count || 0;
    const items: AdminPrayerRequestItem[] = rawList.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      user_full_name: profilesMap.get(p.user_id) || null,
      devotional_id: p.devotional_id || null,
      devotional_title: p.devotional_id ? devotionalsMap.get(p.devotional_id) || null : null,
      language: p.language,
      request: p.request,
      status: p.status as PrayerRequestAdminStatus,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  /**
   * Safely updates the status of a testimonial via the security-definer RPC `update_relationship_status`.
   * Automatically creates an audit log entry on the backend.
   */
  async updateTestimonialStatus(id: string, newStatus: TestimonialAdminStatus): Promise<void> {
    const { error } = await supabase.rpc('update_relationship_status', {
      p_relationship_type: 'testimonial',
      p_relationship_id: id,
      p_new_status: newStatus,
    });

    if (error) {
      console.error("Error updating testimonial status via RPC:", error);
      throw error;
    }
  },

  /**
   * Safely updates the status of a prayer request via the security-definer RPC `update_relationship_status`.
   * Automatically creates an audit log entry on the backend.
   */
  async updatePrayerRequestStatus(id: string, newStatus: PrayerRequestAdminStatus): Promise<void> {
    const { error } = await supabase.rpc('update_relationship_status', {
      p_relationship_type: 'prayer_request',
      p_relationship_id: id,
      p_new_status: newStatus,
    });

    if (error) {
      console.error("Error updating prayer request status via RPC:", error);
      throw error;
    }
  }
};

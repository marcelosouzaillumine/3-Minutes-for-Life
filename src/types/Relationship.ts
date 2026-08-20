export type TestimonialAdminStatus = 'pending' | 'reviewed' | 'archived';
export type PrayerRequestAdminStatus = 'pending' | 'prayed' | 'archived';
export type RelationshipItemType = 'testimonial' | 'prayer_request';

export interface AdminTestimonialItem {
  id: string;
  user_id: string;
  user_full_name: string | null;
  devotional_id: string | null;
  devotional_title: string | null;
  content: string;
  status: TestimonialAdminStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminPrayerRequestItem {
  id: string;
  user_id: string;
  user_full_name: string | null;
  devotional_id: string | null;
  devotional_title: string | null;
  language: string;
  request: string;
  status: PrayerRequestAdminStatus;
  created_at: string;
  updated_at: string;
}

export interface RecentRelationshipItem {
  id: string;
  type: RelationshipItemType;
  user_id: string;
  user_full_name: string | null;
  devotional_id: string | null;
  devotional_title: string | null;
  language?: string;
  content_preview: string;
  full_content: string;
  status: string;
  created_at: string;
}

export interface RelationshipOverviewMetrics {
  testimonials: {
    pending: number;
    reviewed: number;
    archived: number;
    total: number;
  };
  prayer_requests: {
    pending: number;
    prayed: number;
    archived: number;
    total: number;
  };
  recent_activity: RecentRelationshipItem[];
  language_distribution: {
    'pt-BR': number;
    'en': number;
    'es': number;
  };
}

export interface RelationshipFilters {
  status?: string; // 'all' | status value
  language?: string; // 'all' | 'pt-BR' | 'en' | 'es'
  period?: 'today' | '7d' | '30d' | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RelationshipAuditEntry {
  id: string;
  admin_user_id: string;
  relationship_type: RelationshipItemType;
  relationship_id: string;
  action: string;
  previous_status: string;
  new_status: string;
  created_at: string;
}

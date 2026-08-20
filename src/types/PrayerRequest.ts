export type PrayerRequestStatus = 'pending' | 'reviewed' | 'archived';

export interface PrayerRequest {
  id: string;
  user_id: string;
  devotional_id: string | null;
  language: string;
  request: string;
  status: PrayerRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface PrayerRequestInsert {
  devotional_id?: string | null;
  language?: string;
  request: string;
}

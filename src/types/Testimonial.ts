export type TestimonialStatus = 'pending' | 'reviewed' | 'archived';

export interface Testimonial {
  id: string;
  user_id: string;
  devotional_id: string | null;
  content: string;
  status: TestimonialStatus;
  created_at: string;
  updated_at: string;
}

export interface TestimonialInsert {
  devotional_id?: string | null;
  content: string;
}

export interface TestimonialUserUpdate {
  devotional_id?: string | null;
  content?: string;
}

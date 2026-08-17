-- Create supporters table
CREATE TABLE public.supporters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- active, completed, draft
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_id UUID REFERENCES public.supporters(id) NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  frequency TEXT NOT NULL, -- one_time, recurring
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, active, canceled, failed
  provider TEXT NOT NULL, -- asaas, stripe
  provider_reference TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create payment_events table
CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(provider, provider_event_id)
);

-- Enable RLS
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at (we can reuse the existing handle_updated_at function)
CREATE TRIGGER on_supporters_updated
  BEFORE UPDATE ON public.supporters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_campaigns_updated
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_contributions_updated
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies

-- Supporters: user can read their own supporter status
CREATE POLICY "Users can read own supporter status" 
  ON public.supporters FOR SELECT 
  USING (auth.uid() = user_id);

-- Campaigns: anyone can read active campaigns
CREATE POLICY "Anyone can read active campaigns" 
  ON public.campaigns FOR SELECT 
  USING (status = 'active');

-- Contributions: users can read their own contributions
CREATE POLICY "Users can read own contributions" 
  ON public.contributions FOR SELECT 
  USING (
    supporter_id IN (
      SELECT id FROM public.supporters WHERE user_id = auth.uid()
    )
  );

-- Payment events: NO CLIENT ACCESS
-- By default RLS denies everything, so no policy = no access.


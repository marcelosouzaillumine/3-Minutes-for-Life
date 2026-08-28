-- Migration: partner_api_foundation
-- Purpose: Tables for partner API key management and request logging.

CREATE TABLE public.api_applications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT,
  contact_email TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage api_applications"
  ON public.api_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin')
    )
  );

CREATE TABLE public.api_keys (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID        NOT NULL REFERENCES public.api_applications(id) ON DELETE CASCADE,
  key_hash            TEXT        NOT NULL UNIQUE,
  key_prefix          TEXT        NOT NULL,
  name                TEXT,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  rate_limit_per_hour INTEGER     NOT NULL DEFAULT 1000,
  last_used_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage api_keys"
  ON public.api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin')
    )
  );

CREATE TABLE public.api_request_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id       UUID        REFERENCES public.api_keys(id) ON DELETE SET NULL,
  application_id   UUID        REFERENCES public.api_applications(id) ON DELETE SET NULL,
  endpoint         TEXT        NOT NULL,
  method           TEXT        NOT NULL DEFAULT 'GET',
  status_code      INTEGER,
  response_time_ms INTEGER,
  ip_address       TEXT,
  lang             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view api_request_logs"
  ON public.api_request_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin')
    )
  );

CREATE INDEX idx_api_request_logs_key_time
  ON public.api_request_logs (api_key_id, created_at DESC);

CREATE INDEX idx_api_request_logs_app_time
  ON public.api_request_logs (application_id, created_at DESC);

CREATE TRIGGER on_api_applications_updated
  BEFORE UPDATE ON public.api_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_api_keys_updated
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

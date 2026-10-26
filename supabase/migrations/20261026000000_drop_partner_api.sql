-- Migration: drop_partner_api
-- Purpose: Remove totalmente a partner-api legada do Supabase (função já removida;
-- substituto: GET /partner/* no gateway do Illumine OS, chaves em tenant_api_keys).
-- Revoga também a API key antiga (api_keys.key_hash) por cascata.

DROP TABLE IF EXISTS public.api_request_logs;
DROP TABLE IF EXISTS public.api_keys;
DROP TABLE IF EXISTS public.api_applications;

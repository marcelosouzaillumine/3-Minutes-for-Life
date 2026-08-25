-- =============================================================
-- 3 MINUTES FOR LIFE
-- Communication Center
-- Seed — Públicos padrão
-- =============================================================

INSERT INTO public.communication_audiences (
    name,
    type,
    description,
    filters
)
SELECT
    'Todos os usuários',
    'all_users'::public.communication_audience_type,
    'Todos os usuários cadastrados na plataforma.',
    '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1
    FROM public.communication_audiences
    WHERE type = 'all_users'
);


INSERT INTO public.communication_audiences (
    name,
    type,
    description,
    filters
)
SELECT
    'Usuários com consentimento',
    'opted_in'::public.communication_audience_type,
    'Usuários que autorizaram o recebimento de comunicações.',
    '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1
    FROM public.communication_audiences
    WHERE type = 'opted_in'
);


INSERT INTO public.communication_audiences (
    name,
    type,
    description,
    filters
)
SELECT
    'Apoiadores',
    'supporters'::public.communication_audience_type,
    'Usuários que apoiam financeiramente o projeto.',
    '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1
    FROM public.communication_audiences
    WHERE type = 'supporters'
);


INSERT INTO public.communication_audiences (
    name,
    type,
    description,
    filters
)
SELECT
    'Usuários inativos',
    'inactive'::public.communication_audience_type,
    'Usuários que não possuem atividade recente na plataforma.',
    '{}'::jsonb
WHERE NOT EXISTS (
    SELECT 1
    FROM public.communication_audiences
    WHERE type = 'inactive'
);
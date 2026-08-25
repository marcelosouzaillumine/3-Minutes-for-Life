-- =============================================================
-- FIX: COMMUNICATION CAMPAIGN TRANSLATIONS RLS
-- =============================================================

-- Remove policies antigas relacionadas à tabela
drop policy if exists
    "Admins can manage communication campaign translations"
on public.communication_campaign_translations;

drop policy if exists
    "Admins can manage campaign translations"
on public.communication_campaign_translations;

drop policy if exists
    "communication_campaign_translations_service_role_all"
on public.communication_campaign_translations;


-- =============================================================
-- ADMIN POLICY
-- =============================================================

create policy
    "Admins can manage communication campaign translations"
on public.communication_campaign_translations

for all

to public

using (
    has_role(
        ARRAY[
            'super_admin'::app_role,
            'admin'::app_role
        ]
    )
)

with check (
    has_role(
        ARRAY[
            'super_admin'::app_role,
            'admin'::app_role
        ]
    )
);


-- =============================================================
-- SERVICE ROLE
-- =============================================================

create policy
    "communication_campaign_translations_service_role_all"
on public.communication_campaign_translations

for all

to service_role

using (true)

with check (true);
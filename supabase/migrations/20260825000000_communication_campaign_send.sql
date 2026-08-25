create or replace view public.communication_campaign_recipient_counts
with (security_invoker = true)
as
select
    c.id as campaign_id,
    count(distinct p.id)::integer as total_recipients
from public.communication_campaigns c
join public.communication_campaign_audiences ca
    on ca.campaign_id = c.id
join public.communication_audiences a
    on a.id = ca.audience_id
join public.profiles p
    on (
        a.type = 'all_users'
        or a.type = 'opted_in'
    )
group by c.id;


create index if not exists communication_deliveries_campaign_id_idx
    on public.communication_deliveries(campaign_id);

create index if not exists communication_deliveries_user_id_idx
    on public.communication_deliveries(user_id);

create index if not exists communication_deliveries_status_idx
    on public.communication_deliveries(status);

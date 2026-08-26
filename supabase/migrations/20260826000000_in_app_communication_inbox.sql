-- ============================================================
-- In-App Communication Inbox
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_in_app_messages()
RETURNS TABLE (
  id uuid,
  title text,
  body text,
  cta_label text,
  cta_url text,
  status text,
  language text,
  created_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.body,
    d.cta_label,
    d.cta_url,
    d.status::text,
    d.language,
    d.created_at,
    d.delivered_at,
    d.opened_at,
    d.clicked_at
  FROM public.communication_deliveries d
  WHERE d.user_id = v_user_id
    AND d.channel = 'in_app'
    AND d.status IN ('delivered', 'opened')
  ORDER BY d.created_at DESC;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_my_unread_communication_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid;
  v_count integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.communication_deliveries d
  WHERE d.user_id = v_user_id
    AND d.channel = 'in_app'
    AND d.status = 'delivered'
    AND d.opened_at IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$function$;


CREATE OR REPLACE FUNCTION public.mark_communication_as_opened(
  p_delivery_ids uuid[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid;
  v_updated integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;

  UPDATE public.communication_deliveries
  SET
    status = 'opened',
    opened_at = COALESCE(opened_at, NOW()),
    updated_at = NOW()
  WHERE user_id = v_user_id
    AND channel = 'in_app'
    AND id = ANY(p_delivery_ids)
    AND opened_at IS NULL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated;
END;
$function$;


CREATE OR REPLACE FUNCTION public.mark_communication_as_clicked(
  p_delivery_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no authenticated user';
  END IF;

  UPDATE public.communication_deliveries
  SET
    clicked_at = COALESCE(clicked_at, NOW()),
    updated_at = NOW()
  WHERE id = p_delivery_id
    AND user_id = v_user_id
    AND channel = 'in_app';

  RETURN FOUND;
END;
$function$;


GRANT EXECUTE ON FUNCTION public.get_my_in_app_messages()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_unread_communication_count()
TO authenticated;

GRANT EXECUTE ON FUNCTION public.mark_communication_as_opened(uuid[])
TO authenticated;

GRANT EXECUTE ON FUNCTION public.mark_communication_as_clicked(uuid)
TO authenticated;

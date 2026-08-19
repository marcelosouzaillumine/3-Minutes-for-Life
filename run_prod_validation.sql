-- 1. Distribuição de Estados
SELECT 
  CASE 
    WHEN user_id IS NOT NULL AND anonymous_id IS NULL THEN '1. Somente user_id'
    WHEN user_id IS NULL AND anonymous_id IS NOT NULL THEN '2. Somente anonymous_id'
    WHEN user_id IS NOT NULL AND anonymous_id IS NOT NULL THEN '3. Ambos preenchidos'
    ELSE '4. Ambos nulos'
  END as estado_identidade,
  count(*) as quantidade_eventos
FROM app_events
GROUP BY 1
ORDER BY 1 ASC;

-- 2. Dispositivos Compartilhados
WITH device_mapping AS (
  SELECT anonymous_id, COUNT(DISTINCT user_id) as qtd_users
  FROM app_events WHERE anonymous_id IS NOT NULL AND user_id IS NOT NULL GROUP BY anonymous_id
)
SELECT 
  CASE 
    WHEN qtd_users = 1 THEN 'Dispositivos 1:1'
    WHEN qtd_users > 1 THEN 'Dispositivos 1:N'
  END as perfil_associacao,
  COUNT(*) as total_dispositivos
FROM device_mapping GROUP BY 1;

-- 3. Continuidade Temporal
WITH reliable_devices AS (
  SELECT anonymous_id, MAX(user_id::text) as canonical_user
  FROM app_events WHERE anonymous_id IS NOT NULL AND user_id IS NOT NULL GROUP BY anonymous_id HAVING COUNT(DISTINCT user_id) = 1
),
temporal_analysis AS (
  SELECT e.anonymous_id, MIN(CASE WHEN e.user_id IS NULL THEN e.occurred_at END) as first_anon, MIN(CASE WHEN e.user_id IS NOT NULL THEN e.occurred_at END) as first_auth
  FROM app_events e JOIN reliable_devices r ON e.anonymous_id = r.anonymous_id GROUP BY e.anonymous_id
)
SELECT COUNT(*) as dispositivos_1_para_1, SUM(CASE WHEN first_anon < first_auth THEN 1 ELSE 0 END) as anonimo_antes_auth_correto, SUM(CASE WHEN first_anon > first_auth THEN 1 ELSE 0 END) as anonimo_depois_auth_anomalo
FROM temporal_analysis;

-- 4. Impacto
WITH reliable_devices AS (
  SELECT anonymous_id, MAX(user_id::text) as canonical_user
  FROM app_events WHERE anonymous_id IS NOT NULL AND user_id IS NOT NULL GROUP BY anonymous_id HAVING COUNT(DISTINCT user_id) = 1
),
identity_resolved AS (
  SELECT e.id, e.user_id as actual_user_id, COALESCE(r.canonical_user, e.anonymous_id) as canonical_id, e.anonymous_id
  FROM app_events e LEFT JOIN reliable_devices r ON e.anonymous_id = r.anonymous_id
)
SELECT COUNT(DISTINCT actual_user_id) as atual_dashboard_users, COUNT(DISTINCT canonical_id) as novo_dashboard_identidades_resolvidas, COUNT(DISTINCT anonymous_id) as total_devices_brutos, (COUNT(DISTINCT canonical_id) - COUNT(DISTINCT actual_user_id)) as ganho_visibilidade_absoluto
FROM identity_resolved;

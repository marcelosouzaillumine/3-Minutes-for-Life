-- 1. Medir quantos registros existem em cada combinação de IDs
SELECT 
  CASE 
    WHEN user_id IS NOT NULL AND anonymous_id IS NULL THEN 'Somente user_id'
    WHEN user_id IS NULL AND anonymous_id IS NOT NULL THEN 'Somente anonymous_id'
    WHEN user_id IS NOT NULL AND anonymous_id IS NOT NULL THEN 'Ambos preenchidos'
    ELSE 'Ambos nulos'
  END as id_state,
  count(*) as event_count
FROM app_events
GROUP BY 1
ORDER BY event_count DESC;

-- 2. Verificar o overlap: visitantes que têm eventos mistos
WITH user_events AS (
  SELECT 
    anonymous_id,
    count(DISTINCT user_id) as distinct_users,
    count(*) as total_events
  FROM app_events
  WHERE anonymous_id IS NOT NULL
  GROUP BY anonymous_id
)
SELECT 
  CASE 
    WHEN distinct_users > 1 THEN '1 Anonymous_ID para Múltiplos User_IDs'
    WHEN distinct_users = 1 THEN '1 Anonymous_ID para 1 User_ID (Mapeado)'
    ELSE 'Apenas Anônimo (Nenhum User_ID)'
  END as overlap_state,
  count(*) as distinct_visitors
FROM user_events
GROUP BY 1;

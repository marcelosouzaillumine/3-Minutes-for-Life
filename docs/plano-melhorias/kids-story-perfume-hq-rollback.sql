-- Desfaz kids-story-perfume-hq.sql: volta a arte em SVG.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM devotional_kids
   WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND language IN ('pt-BR','en','es','fr','it') AND band IN ('4-6','7-10','11-13') AND story IS NOT NULL AND story::text ~ '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-1\.webp';
  IF n <> 15 THEN RAISE EXCEPTION 'esperava 15 versões com a arte de partida e encontrei %', n; END IF;
END $$;
UPDATE devotional_kids SET story = (replace(replace(replace(story::text, '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-1.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/4-6-1.svg'), '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-2.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/4-6-2.svg'), '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-4.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/4-6-3.svg'))::jsonb WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '4-6' AND language IN ('pt-BR','en','es','fr','it');
UPDATE devotional_kids SET story = (replace(replace(replace(replace(story::text, '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-1.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/7-10-1.svg'), '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-2.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/7-10-2.svg'), '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-3.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/7-10-3.svg'), '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-4.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/7-10-4.svg'))::jsonb WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '7-10' AND language IN ('pt-BR','en','es','fr','it');
UPDATE devotional_kids SET story = (replace(story::text, '/ilustracoes/a-mulher-e-o-perfume/quadros/hq-1.webp', '/ilustracoes/a-mulher-e-o-perfume/quadros/11-13-cena.svg'))::jsonb WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it');
SELECT band, count(*) AS versoes, bool_and(story::text LIKE '%.svg%') AS arte_nova
  FROM devotional_kids WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND language IN ('pt-BR','en','es','fr','it') GROUP BY band ORDER BY band;
COMMIT;

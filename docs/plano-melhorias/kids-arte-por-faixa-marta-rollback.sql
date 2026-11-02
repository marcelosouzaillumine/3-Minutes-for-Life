-- Desfaz kids-arte-por-faixa-marta.sql: volta ao conjunto único hd-1..4.webp.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND language IN ('pt-BR','en','es','fr','it') AND band IN ('4-6','7-10','11-13') AND story IS NOT NULL AND story::text LIKE '%/ilustracoes/marta-e-maria/quadros/faixa-%';
  IF n <> 15 THEN RAISE EXCEPTION 'marta-e-maria: esperava 15 versões com a arte de partida e encontrei %', n; END IF;
END $$;
UPDATE devotional_kids SET story = replace(story::text, '/ilustracoes/marta-e-maria/quadros/faixa-4-6-', '/ilustracoes/marta-e-maria/quadros/hd-')::jsonb WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '4-6' AND language IN ('pt-BR','en','es','fr','it') AND story::text LIKE '%/ilustracoes/marta-e-maria/quadros/faixa-4-6-%';
UPDATE devotional_kids SET story = replace(story::text, '/ilustracoes/marta-e-maria/quadros/faixa-7-10-', '/ilustracoes/marta-e-maria/quadros/hd-')::jsonb WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '7-10' AND language IN ('pt-BR','en','es','fr','it') AND story::text LIKE '%/ilustracoes/marta-e-maria/quadros/faixa-7-10-%';
UPDATE devotional_kids SET story = replace(story::text, '/ilustracoes/marta-e-maria/quadros/faixa-11-13-', '/ilustracoes/marta-e-maria/quadros/hd-')::jsonb WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND story::text LIKE '%/ilustracoes/marta-e-maria/quadros/faixa-11-13-%';
SELECT band, count(*) AS versoes, bool_and(story::text NOT LIKE '%/quadros/faixa-%') AS arte_ok FROM devotional_kids WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND language IN ('pt-BR','en','es','fr','it') AND band IN ('4-6','7-10','11-13') GROUP BY 1 ORDER BY 1;
COMMIT;

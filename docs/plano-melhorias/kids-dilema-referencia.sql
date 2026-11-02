-- Passagem bíblica (selo) no dilema do 11-13 e citações em NAA no pt-BR. Só mexe na história (story). Publicar o app e a API ANTES de rodar.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ('cmvyv3ozp003ho72lezbf5h9r','cmvyun7rw0032o72lmlzc68bk','cmvv1whpq0002pm2l3f1bfo13','cmvue6llj000koe2lqtw0xdz2','cmvudrag10002oe2ldyzmvhaa') AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND story->>'format' = 'dilemma' AND NOT (story ? 'reference');
  IF n <> 25 THEN RAISE EXCEPTION 'esperava 25 dilemas sem reference e encontrei %', n; END IF;
END $$;
UPDATE devotional_kids SET story = story || '{"reference": "Lucas 10.38-42", "quote": "Maria escolheu a boa parte, e esta não lhe será tirada.", "quoteSource": "Lucas 10.42"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luke 10:38-42"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Lucas 10:38-42"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luc 10.38-42"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luca 10,38-42"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Lucas 7.36-50", "quote": "Os seus pecados estão perdoados.", "quoteSource": "Lucas 7.48"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luke 7:36-50"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Lucas 7:36-50"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luc 7.36-50"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luca 7,36-50"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Lucas 5.27-32", "quote": "Os sãos não precisam de médico, e sim os doentes.", "quoteSource": "Lucas 5.31"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luke 5:27-32"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Lucas 5:27-32"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luc 5.27-32"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Luca 5,27-32"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "2 Samuel 6.12-16", "quote": "Davi dançava com todas as suas forças diante do SENHOR.", "quoteSource": "2 Samuel 6.14"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "2 Samuel 6:12-16"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "2 Samuel 6:12-16"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "2 Samuel 6.12-16"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "2 Samuele 6,12-16"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Romanos 1.16-17", "quoteSource": "Martinho Lutero, Worms, 1521"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Romans 1:16-17", "quoteSource": "Martin Luther, Worms, 1521"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Romanos 1:16-17", "quoteSource": "Martín Lutero, Worms, 1521"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Romains 1.16-17", "quoteSource": "Martin Luther, Worms, 1521"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story || '{"reference": "Romani 1,16-17", "quoteSource": "Martino Lutero, Worms, 1521"}'::jsonb, updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM devotional_kids WHERE devotional_id IN ('cmvyv3ozp003ho72lezbf5h9r','cmvyun7rw0032o72lmlzc68bk','cmvv1whpq0002pm2l3f1bfo13','cmvue6llj000koe2lqtw0xdz2','cmvudrag10002oe2ldyzmvhaa') AND band = '11-13' AND language IN ('pt-BR','en','es','fr','it') AND (story->>'reference') IS NULL;
  IF n <> 0 THEN RAISE EXCEPTION '% dilemas sem reference', n; END IF;
END $$;
SELECT language, count(*) AS dilemas, count(story->>'quoteSource') AS com_fonte FROM devotional_kids WHERE devotional_id IN ('cmvyv3ozp003ho72lezbf5h9r','cmvyun7rw0032o72lmlzc68bk','cmvv1whpq0002pm2l3f1bfo13','cmvue6llj000koe2lqtw0xdz2','cmvudrag10002oe2ldyzmvhaa') AND band = '11-13' GROUP BY 1 ORDER BY 1;
COMMIT;

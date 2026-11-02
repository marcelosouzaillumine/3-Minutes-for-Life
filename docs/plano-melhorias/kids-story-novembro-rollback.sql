-- Desliga as histórias dos devocionais de 01 a 04/11 (voltam ao texto corrido, na hora).
-- railway connect 3minutes-db < docs/plano-melhorias/kids-story-novembro-rollback.sql
\set ON_ERROR_STOP on
BEGIN;
UPDATE devotional_kids SET story = NULL
 WHERE devotional_id IN ('cmvue6llj000koe2lqtw0xdz2','cmvv1whpq0002pm2l3f1bfo13','cmvyun7rw0032o72lmlzc68bk','cmvyv3ozp003ho72lezbf5h9r') AND language IN ('pt-BR','en','es','fr','it') AND band IN ('4-6','7-10','11-13');
SELECT devotional_id, count(*) FILTER (WHERE story IS NOT NULL) AS com_historia FROM devotional_kids WHERE devotional_id IN ('cmvue6llj000koe2lqtw0xdz2','cmvv1whpq0002pm2l3f1bfo13','cmvyun7rw0032o72lmlzc68bk','cmvyv3ozp003ho72lezbf5h9r') GROUP BY 1;
COMMIT;

-- Desliga a história da Reforma (pt-BR): as famílias voltam a ver o texto corrido, na hora.
-- railway connect 3minutes-db < docs/plano-melhorias/kids-story-reforma-rollback.sql
\set ON_ERROR_STOP on
BEGIN;
UPDATE devotional_kids SET story = NULL
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' AND band IN ('4-6','7-10','11-13');
SELECT band, status, (story IS NOT NULL) AS tem_historia FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' ORDER BY band;
COMMIT;

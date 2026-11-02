-- Desliga a história da Reforma em en, es, fr e it (voltam ao texto corrido, na hora).
-- railway connect 3minutes-db < docs/plano-melhorias/kids-story-reforma-traducoes-rollback.sql
\set ON_ERROR_STOP on
BEGIN;
UPDATE devotional_kids SET story = NULL
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language IN ('en','es','fr','it') AND band IN ('4-6','7-10','11-13');
SELECT language, band, (story IS NOT NULL) AS tem_historia FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language IN ('en','es','fr','it') ORDER BY language, band;
COMMIT;

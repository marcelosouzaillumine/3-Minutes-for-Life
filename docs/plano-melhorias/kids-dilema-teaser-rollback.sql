-- Desfaz kids-dilema-teaser.sql.
\set ON_ERROR_STOP on
BEGIN;
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyv3ozp003ho72lezbf5h9r' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvyun7rw0032o72lmlzc68bk' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvv1whpq0002pm2l3f1bfo13' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvue6llj000koe2lqtw0xdz2' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'en' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'es' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'fr' AND story->>'format' = 'dilemma';
UPDATE devotional_kids SET story = story - 'teaser', updated_at = now() WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'it' AND story->>'format' = 'dilemma';
COMMIT;

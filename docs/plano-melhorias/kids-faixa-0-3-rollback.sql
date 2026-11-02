-- Desfaz kids-faixa-0-3.sql: apaga as versões 0-3 desses 5 devocionais.
\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM devotional_kids WHERE band = '0-3' AND devotional_id IN ('cmvue6llj000koe2lqtw0xdz2','cmvv1whpq0002pm2l3f1bfo13','cmvyun7rw0032o72lmlzc68bk','cmvudrag10002oe2ldyzmvhaa','cmvyv3ozp003ho72lezbf5h9r');
  IF n <> 25 THEN RAISE EXCEPTION 'esperava 25 versoes 0-3 e encontrei %', n; END IF;
END $$;
DELETE FROM devotional_kids WHERE band = '0-3' AND devotional_id IN ('cmvue6llj000koe2lqtw0xdz2','cmvv1whpq0002pm2l3f1bfo13','cmvyun7rw0032o72lmlzc68bk','cmvudrag10002oe2ldyzmvhaa','cmvyv3ozp003ho72lezbf5h9r');
COMMIT;

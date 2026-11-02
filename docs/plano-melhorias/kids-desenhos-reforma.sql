-- Desenhos novos da Reforma (pt-BR): 4-6 e 7-10 com 4 quadros do desenho; 11-13 com a cena de Worms.
-- railway connect 3minutes-db < docs/plano-melhorias/kids-desenhos-reforma.sql
-- ANTES: o app com os arquivos quadros/reforma-1..4.webp precisa estar publicado. As versões publicadas mudam no COMMIT.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' AND band IN ('4-6','7-10','11-13')) <> 3 THEN
    RAISE EXCEPTION 'Esperava as 3 faixas pt-BR; nada foi alterado.';
  END IF;
END $$;

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/reforma-1.webp", "caption": "Lutero lia a Bíblia com muita atenção e descobriu o amor de Deus.", "speech": "Deus nos ama de graça!"}, {"image": "/ilustracoes/reforma-protestante/quadros/reforma-2.webp", "caption": "Ele contou o que descobriu e colocou a mensagem na porta da igreja.", "speech": "Vamos conversar sobre isso?"}, {"image": "/ilustracoes/reforma-protestante/quadros/reforma-3.webp", "caption": "Diante de gente muito importante, ele quis ser fiel à Bíblia.", "speech": "A Bíblia é o que mais importa!"}, {"image": "/ilustracoes/reforma-protestante/quadros/reforma-4.webp", "caption": "Depois, as famílias puderam ler a Bíblia em casa.", "speech": "Vamos ler juntos?"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/reforma-1.webp", "caption": "Wittenberg, 1517. Estudando a carta de Paulo, Lutero descobriu: o perdão é um presente de Deus.", "speech": "Não se compra. Se recebe!"}, {"image": "/ilustracoes/reforma-protestante/quadros/reforma-2.webp", "caption": "Ele escreveu suas dúvidas e as pregou na porta da igreja, para todos conversarem.", "speech": "95 ideias para conversar!"}, {"image": "/ilustracoes/reforma-protestante/quadros/reforma-3.webp", "caption": "Em Worms, pediram que ele negasse o que escreveu. Ele respondeu que só a Bíblia poderia convencê-lo.", "speech": "Só a Bíblia pode me convencer."}, {"image": "/ilustracoes/reforma-protestante/quadros/reforma-4.webp", "caption": "Depois, a Bíblia foi traduzida e impressa, e famílias comuns puderam lê-la.", "speech": "Agora todos entendem!"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'pt-BR';
UPDATE devotional_kids SET story = jsonb_set(story, '{image}', to_jsonb('/ilustracoes/reforma-protestante/quadros/reforma-3.webp'::text))
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';

SELECT band, status, story->>'format' AS formato, jsonb_array_length(story->'panels') AS quadros, story->>'image' AS cena
  FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' ORDER BY band;
COMMIT;

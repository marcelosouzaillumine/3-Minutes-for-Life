-- Volta aos quadros em SVG anteriores da Reforma (pt-BR).
-- railway connect 3minutes-db < docs/plano-melhorias/kids-desenhos-reforma-rollback.sql
-- ANTES: o app com os arquivos quadros/reforma-1..4.webp precisa estar publicado. As versões publicadas mudam no COMMIT.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' AND band IN ('4-6','7-10','11-13')) <> 3 THEN
    RAISE EXCEPTION 'Esperava as 3 faixas pt-BR; nada foi alterado.';
  END IF;
END $$;

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/4-6-1.svg", "caption": "Em casa, havia um livro muito especial.", "speech": "Que livro grande!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-2.svg", "caption": "Antes, quase ninguém podia abrir a Bíblia.", "speech": "Não alcanço!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-3.svg", "caption": "Lutero abriu a Bíblia e viu o amor de Deus.", "speech": "Deus nos ama de graça!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-4.svg", "caption": "Hoje a Bíblia é para todos!", "speech": "Vamos ler juntos?"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'pt-BR';
UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/7-10-1.svg", "caption": "Wittenberg, 1517.", "speech": "Algo precisa mudar."}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-2.svg", "caption": "Estudando a Bíblia, ele descobriu: o perdão é um presente de Deus.", "speech": "Não se compra. Se recebe!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-3.svg", "caption": "Ele escreveu suas dúvidas e as pregou na porta da igreja.", "speech": "95 ideias para conversar!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-4.svg", "caption": "Todo mundo começou a conversar.", "speech": "Será que é isso mesmo?"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-5.svg", "caption": "Depois, ele traduziu a Bíblia para o povo ler.", "speech": "Agora todos entendem!"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'pt-BR';
UPDATE devotional_kids SET story = jsonb_set(story, '{image}', to_jsonb('/ilustracoes/reforma-protestante/quadros/11-13-cena.svg'::text))
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'pt-BR' AND story->>'format' = 'dilemma';

SELECT band, status, story->>'format' AS formato, jsonb_array_length(story->'panels') AS quadros, story->>'image' AS cena
  FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' ORDER BY band;
COMMIT;

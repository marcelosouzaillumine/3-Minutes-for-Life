-- História por faixa do devocional "A Reforma Protestante" (id cmvudrag10002oe2ldyzmvhaa), em pt-BR.
-- Quadrinhos em 4-6 e 7-10; dilema com debate em 11-13. O texto corrido (what_it_says) não é tocado: é a reserva.
--
-- ANTES DE RODAR
--   · A API com a coluna story já está no ar (migração 20261103120000_kids_story) e o app novo já foi publicado.
--   · Confirme com o editorial a redação da fala de Worms (paráfrase): "Minha consciência está presa à Palavra de Deus."
--   · ATENÇÃO: as versões já publicadas passam a mostrar a história assim que o COMMIT acontece.
--
-- COMO RODAR (pede a conexão com o banco de produção; leia o resultado das conferências)
--   railway connect 3minutes-db < docs/plano-melhorias/kids-story-reforma.sql
--
-- O script é tudo ou nada: se não houver exatamente 3 faixas pt-BR ou se algum UPDATE não atingir 1 linha,
-- ele para e desfaz. Para desligar depois: docs/plano-melhorias/kids-story-reforma-rollback.sql
--
-- Outros idiomas: no admin, abra a faixa no idioma, use "Copiar a estrutura do português" e traduza os textos.

\set ON_ERROR_STOP on
BEGIN;

-- Conferência: deve listar as 3 faixas em pt-BR e nenhuma com história ainda.
SELECT band, language, status, (story IS NOT NULL) AS tem_historia
  FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' ORDER BY band, language;

DO $$
BEGIN
  IF (SELECT count(*) FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' AND band IN ('4-6','7-10','11-13')) <> 3 THEN
    RAISE EXCEPTION 'Esperava as 3 faixas pt-BR do devocional cmvudrag10002oe2ldyzmvhaa; nada foi alterado.';
  END IF;
END $$;

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/4-6-1.svg", "caption": "Em casa, havia um livro muito especial.", "speech": "Que livro grande!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-2.svg", "caption": "Antes, quase ninguém podia abrir a Bíblia.", "speech": "Não alcanço!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-3.svg", "caption": "Lutero abriu a Bíblia e viu o amor de Deus.", "speech": "Deus nos ama de graça!"}, {"image": "/ilustracoes/reforma-protestante/quadros/4-6-4.svg", "caption": "Hoje a Bíblia é para todos!", "speech": "Vamos ler juntos?"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '4-6' AND language = 'pt-BR';

UPDATE devotional_kids SET story = $j${"format": "panels", "panels": [{"image": "/ilustracoes/reforma-protestante/quadros/7-10-1.svg", "caption": "Wittenberg, 1517.", "speech": "Algo precisa mudar."}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-2.svg", "caption": "Estudando a Bíblia, ele descobriu: o perdão é um presente de Deus.", "speech": "Não se compra. Se recebe!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-3.svg", "caption": "Ele escreveu suas dúvidas e as pregou na porta da igreja.", "speech": "95 ideias para conversar!"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-4.svg", "caption": "Todo mundo começou a conversar.", "speech": "Será que é isso mesmo?"}, {"image": "/ilustracoes/reforma-protestante/quadros/7-10-5.svg", "caption": "Depois, ele traduziu a Bíblia para o povo ler.", "speech": "Agora todos entendem!"}]}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '7-10' AND language = 'pt-BR';

UPDATE devotional_kids SET story = $j${"format": "dilemma", "image": "/ilustracoes/reforma-protestante/quadros/11-13-cena.svg", "setup": "Worms, 1521. Você é Martinho Lutero. Diante de príncipes e bispos, pedem que você negue tudo o que escreveu. Se negar, volta para casa em paz. Se recusar, pode perder tudo.", "question": "O que você faria?", "options": ["Negar e ficar seguro", "Manter o que acredito", "Pedir tempo para pensar"], "outcome": "Lutero pediu um dia para pensar. No dia seguinte, recusou-se a negar sem ser convencido pela Escritura. Depois disso, ficou escondido num castelo e traduziu o Novo Testamento para o alemão.", "quote": "Minha consciência está presa à Palavra de Deus.", "outcomeQuestion": "Alguém mudaria a escolha de agora há pouco?", "today": "Naquele tempo, a imprensa espalhava ideias em semanas. Hoje, uma ideia chega ao mundo em segundos.", "todayQuestion": "Quando você precisa saber se algo é verdade, onde procura primeiro?"}$j$::jsonb
 WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND band = '11-13' AND language = 'pt-BR';

-- Confirmação: cada faixa com o formato certo e a quantidade de quadros (dilema não tem).
SELECT band, status, story->>'format' AS formato, jsonb_array_length(story->'panels') AS quadros
  FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' ORDER BY band;

DO $$
BEGIN
  IF (SELECT count(*) FROM devotional_kids WHERE devotional_id = 'cmvudrag10002oe2ldyzmvhaa' AND language = 'pt-BR' AND story IS NOT NULL) <> 3 THEN
    RAISE EXCEPTION 'Os 3 UPDATEs não atingiram as 3 faixas; desfazendo.';
  END IF;
END $$;

COMMIT;

-- Adiciona link externo opcional às seções "Dica de conteúdo" e "Apoie o projeto".
-- content_tip_url: torna a imagem da Dica clicável, abrindo o link em nova aba.
-- support_link_url: exibe um botão de CTA na seção Apoio, apontando para o link.
-- Ambos opcionais — sem valor, nenhum comportamento de clique é adicionado.

ALTER TABLE public.devotionals
  ADD COLUMN IF NOT EXISTS content_tip_url TEXT,
  ADD COLUMN IF NOT EXISTS support_link_url TEXT;

ALTER TABLE public.devotional_translations
  ADD COLUMN IF NOT EXISTS content_tip_url TEXT,
  ADD COLUMN IF NOT EXISTS support_link_url TEXT;

-- Complementa 20260823020000_content_tip_support.sql: aquela migration só
-- adicionou os campos em `devotionals` (idioma fonte). Sem esta aqui,
-- devotional_translations não tem essas colunas, e todo `upsert` feito por
-- saveManualTranslation()/saveTranslations() falha ao tentar gravar
-- content_tip/content_tip_image_url/support_message/support_banner_url
-- para qualquer idioma traduzido.

ALTER TABLE public.devotional_translations
  ADD COLUMN IF NOT EXISTS content_tip TEXT,
  ADD COLUMN IF NOT EXISTS content_tip_image_url TEXT,
  ADD COLUMN IF NOT EXISTS support_message TEXT,
  ADD COLUMN IF NOT EXISTS support_banner_url TEXT;

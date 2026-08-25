-- =============================================================
-- 3 MINUTES FOR LIFE
-- Communication Center
-- Campaign Translations
-- =============================================================

-- =============================================================
-- 1. IDIOMA DA CAMPANHA
-- =============================================================
-- A campanha original continua existindo em communication_campaigns.
-- Esta tabela armazena as versões traduzidas da mesma campanha.
--
-- Regra:
-- - A campanha possui um idioma base em communication_campaigns.language.
-- - As traduções adicionais ficam nesta tabela.
-- - O idioma do usuário será utilizado posteriormente pelo serviço
--   de envio para selecionar a versão correspondente.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.communication_campaign_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_id uuid NOT NULL
        REFERENCES public.communication_campaigns(id)
        ON DELETE CASCADE,

    language text NOT NULL,

    subject text,

    title text,

    body text NOT NULL,

    cta_label text,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT communication_campaign_translations_language_check
        CHECK (
            language IN (
                'pt-BR',
                'en',
                'es'
            )
        ),

    CONSTRAINT communication_campaign_translations_campaign_language_unique
        UNIQUE (
            campaign_id,
            language
        )
);


-- =============================================================
-- 2. ÍNDICES
-- =============================================================

CREATE INDEX IF NOT EXISTS
    idx_communication_campaign_translations_campaign_id
ON public.communication_campaign_translations (
    campaign_id
);

CREATE INDEX IF NOT EXISTS
    idx_communication_campaign_translations_language
ON public.communication_campaign_translations (
    language
);


-- =============================================================
-- 3. UPDATED_AT
-- =============================================================

CREATE OR REPLACE FUNCTION public.set_communication_campaign_translation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();

    RETURN NEW;
END;
$function$;


DROP TRIGGER IF EXISTS
    communication_campaign_translations_updated_at
ON public.communication_campaign_translations;


CREATE TRIGGER
    communication_campaign_translations_updated_at
BEFORE UPDATE ON public.communication_campaign_translations
FOR EACH ROW
EXECUTE FUNCTION
    public.set_communication_campaign_translation_updated_at();


-- =============================================================
-- 4. RLS
-- =============================================================

ALTER TABLE public.communication_campaign_translations
ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- 5. POLICIES
-- =============================================================
-- O gerenciamento desta estrutura será feito pelo Communication
-- Center através das funções/serviços administrativos.
--
-- Mantemos acesso restrito por padrão.
-- =============================================================

DROP POLICY IF EXISTS
    "communication_campaign_translations_service_role_all"
ON public.communication_campaign_translations;


CREATE POLICY
    "communication_campaign_translations_service_role_all"
ON public.communication_campaign_translations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- =============================================================
-- 6. GRANTS
-- =============================================================

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.communication_campaign_translations
TO service_role;


-- =============================================================
-- 7. COMENTÁRIOS
-- =============================================================

COMMENT ON TABLE
    public.communication_campaign_translations
IS
    'Versões multilíngues das campanhas do Centro de Comunicação.';


COMMENT ON COLUMN
    public.communication_campaign_translations.campaign_id
IS
    'Campanha original à qual esta tradução pertence.';


COMMENT ON COLUMN
    public.communication_campaign_translations.language
IS
    'Idioma da versão da campanha: pt-BR, en ou es.';


COMMENT ON COLUMN
    public.communication_campaign_translations.subject
IS
    'Assunto da campanha neste idioma.';


COMMENT ON COLUMN
    public.communication_campaign_translations.title
IS
    'Título da campanha neste idioma.';


COMMENT ON COLUMN
    public.communication_campaign_translations.body
IS
    'Conteúdo da campanha neste idioma.';


COMMENT ON COLUMN
    public.communication_campaign_translations.cta_label
IS
    'Texto do botão/CTA neste idioma.';
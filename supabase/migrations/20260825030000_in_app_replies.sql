-- =============================================================
-- Resposta dentro do app
--
-- Muda o canal padrão de resposta: em vez de sair para WhatsApp/e-mail,
-- a resposta vive dentro da área logada.
--
-- Vantagens sobre o canal externo:
--   - não depende de consentimento de marketing (a pessoa já está no
--     produto, no espaço dela)
--   - funciona para quem não cadastrou telefone
--   - não expõe o número pessoal de quem responde
--   - traz a pessoa de volta ao app, que é o hábito que o projeto quer
--
-- ATENÇÃO: ALTER TYPE ... ADD VALUE não pode ter o valor novo USADO na
-- mesma transação em que é adicionado. Por isso esta migration só
-- declara, e as RPCs que usam 'in_app' ficam na migration seguinte.
-- =============================================================

ALTER TYPE public.reply_channel ADD VALUE IF NOT EXISTS 'in_app';

-- Marca quando a pessoa leu. NULL = ainda não lida.
ALTER TABLE public.relationship_replies
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Índice para o contador de não lidas, que roda a cada carga do app.
CREATE INDEX IF NOT EXISTS idx_replies_unread
  ON public.relationship_replies(recipient_user_id)
  WHERE read_at IS NULL;

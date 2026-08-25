-- =============================================================
-- Consentimento no cadastro
--
-- PROBLEMA: logo após signUp() pode não haver sessão (quando a
-- confirmação de e-mail está ativa), então chamar
-- set_communication_consent do front falharia — a RPC depende de
-- auth.uid().
--
-- SOLUÇÃO: o aceite viaja em raw_user_meta_data e o próprio trigger
-- de criação de conta grava os consentimentos. Fica atômico com a
-- criação do perfil e não depende de sessão.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_accepts_updates BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  );

  -- Resposta a pedido de oração e testemunho: sempre concedido na
  -- criação da conta. Não é campanha — é retorno a um contato que a
  -- própria pessoa inicia ao escrever. Continua revogável no perfil.
  INSERT INTO public.communication_consents
    (user_id, channel, purpose, granted, source)
  VALUES
    (NEW.id, 'email',    'relationship_reply', TRUE, 'signup'),
    (NEW.id, 'whatsapp', 'relationship_reply', TRUE, 'signup');

  -- Novidades e apoio: só se a pessoa marcou explicitamente.
  -- Ausência do campo é tratada como recusa, nunca como aceite.
  v_accepts_updates := COALESCE(
    (NEW.raw_user_meta_data->>'accepts_updates')::BOOLEAN, FALSE
  );

  INSERT INTO public.communication_consents
    (user_id, channel, purpose, granted, source)
  VALUES
    (NEW.id, 'email',    'devotional_updates', v_accepts_updates, 'signup'),
    (NEW.id, 'whatsapp', 'devotional_updates', v_accepts_updates, 'signup'),
    (NEW.id, 'email',    'project_support',    v_accepts_updates, 'signup'),
    (NEW.id, 'whatsapp', 'project_support',    v_accepts_updates, 'signup');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration to ensure the first devotional is always published today for testing,
-- and contains dummy translations in English and Spanish.

UPDATE public.devotionals 
SET publication_date = timezone('America/Sao_Paulo', CURRENT_TIMESTAMP)::date 
WHERE title = 'Você está dando atenção ao que importa?';

-- Insert English translation
INSERT INTO public.devotional_translations (devotional_id, language, title, reflection, practical_application, status)
SELECT 
  id,
  'en',
  '[EN] Are you paying attention to what matters?',
  '[EN] What receives your attention gains space in your life. Every day, many things compete for our attention...',
  '[EN] Try to put your phone away for 1 hour today.',
  'published'
FROM public.devotionals
WHERE title = 'Você está dando atenção ao que importa?'
ON CONFLICT (devotional_id, language) DO UPDATE 
SET title = EXCLUDED.title, reflection = EXCLUDED.reflection;

-- Insert Spanish translation
INSERT INTO public.devotional_translations (devotional_id, language, title, reflection, practical_application, status)
SELECT 
  id,
  'es',
  '[ES] ¿Estás prestando atención a lo que importa?',
  '[ES] Lo que recibe tu atención gana espacio en tu vida. Todos los días, muchas cosas compiten por nuestra atención...',
  '[ES] Intenta dejar tu teléfono por 1 hora hoy.',
  'published'
FROM public.devotionals
WHERE title = 'Você está dando atenção ao que importa?'
ON CONFLICT (devotional_id, language) DO UPDATE 
SET title = EXCLUDED.title, reflection = EXCLUDED.reflection;

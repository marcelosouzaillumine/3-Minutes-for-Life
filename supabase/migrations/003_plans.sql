-- Create plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policy for reading plans
CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (active = true);

-- Insert seed data
INSERT INTO public.plans (code, name, description) VALUES
  ('free', 'Free', 'O essencial para começar'),
  ('plus', 'Plus', 'Mais recursos e histórico'),
  ('premium', 'Premium', 'Acesso completo a todo o conteúdo');

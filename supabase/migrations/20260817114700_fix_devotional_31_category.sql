UPDATE public.devotionals SET category_id = (SELECT id FROM public.categories WHERE name = 'Vida') WHERE legacy_id = 31;

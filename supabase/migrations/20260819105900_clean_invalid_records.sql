-- Migration: clean_invalid_records
-- Purpose: Remove the two ghost translation records inserted during testing

DELETE FROM public.devotional_translations
WHERE id IN ('707993be-bf07-4b32-8d66-b29c750b48cd', '2316ea5a-b9d8-4a9a-9255-fc93ac1e1f9f');

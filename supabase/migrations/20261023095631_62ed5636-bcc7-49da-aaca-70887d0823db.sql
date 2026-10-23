CREATE TABLE public.livestock_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sell','buy')),
  animal TEXT NOT NULL,
  breed TEXT,
  age_years NUMERIC CHECK (age_years IS NULL OR age_years >= 0),
  price NUMERIC NOT NULL CHECK (price >= 0),
  location TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.livestock_listings TO authenticated;
GRANT ALL ON public.livestock_listings TO service_role;
ALTER TABLE public.livestock_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users view listings" ON public.livestock_listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own listings" ON public.livestock_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own listings" ON public.livestock_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own listings" ON public.livestock_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.livestock_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER livestock_updated_at BEFORE UPDATE ON public.livestock_listings FOR EACH ROW EXECUTE FUNCTION public.livestock_set_updated_at();
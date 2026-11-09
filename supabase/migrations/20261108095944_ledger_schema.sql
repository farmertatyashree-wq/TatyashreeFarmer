CREATE TABLE public.ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  crop text,
  season text NOT NULL DEFAULT 'kharif',
  year int NOT NULL DEFAULT extract(year from now())::int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ledgers_user_idx ON public.ledgers(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledgers TO authenticated;
GRANT ALL ON public.ledgers TO service_role;
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own ledgers select" ON public.ledgers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own ledgers insert" ON public.ledgers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own ledgers update" ON public.ledgers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own ledgers delete" ON public.ledgers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id uuid NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT current_date,
  entry_type text NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  note text,
  crop text,
  quantity numeric(12,3),
  quantity_unit text,
  receipt_path text,
  is_estimate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT entry_type_valid CHECK (entry_type IN ('income','expense')),
  CONSTRAINT amount_positive CHECK (amount > 0)
);
CREATE INDEX ledger_entries_ledger_idx ON public.ledger_entries(ledger_id, entry_date);
CREATE INDEX ledger_entries_user_idx ON public.ledger_entries(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own entries select" ON public.ledger_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own entries insert" ON public.ledger_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.ledgers l WHERE l.id = ledger_id AND l.user_id = auth.uid()));
CREATE POLICY "Own entries update" ON public.ledger_entries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.ledgers l WHERE l.id = ledger_id AND l.user_id = auth.uid()));
CREATE POLICY "Own entries delete" ON public.ledger_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER ledgers_updated BEFORE UPDATE ON public.ledgers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ledger_entries_updated BEFORE UPDATE ON public.ledger_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Receipt read own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Receipt upload own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Receipt update own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Receipt delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

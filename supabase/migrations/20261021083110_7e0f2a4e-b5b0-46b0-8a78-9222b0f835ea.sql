CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.farm_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  crop_name text NOT NULL,
  farm_name text,
  category text NOT NULL CHECK (category IN ('seeds','fertilizers','pesticides','labor','irrigation','machinery','transportation','other')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL,
  quantity text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_expenses TO authenticated;
GRANT ALL ON public.farm_expenses TO service_role;
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own expenses" ON public.farm_expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX farm_expenses_user_date ON public.farm_expenses(user_id, expense_date);
CREATE TRIGGER farm_expenses_updated BEFORE UPDATE ON public.farm_expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.farm_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  crop_name text NOT NULL,
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg','quintal')),
  price_per_unit numeric(12,2) NOT NULL CHECK (price_per_unit > 0),
  total_amount numeric(14,2) GENERATED ALWAYS AS (round(quantity * price_per_unit, 2)) STORED,
  sale_date date NOT NULL,
  market_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_income TO authenticated;
GRANT ALL ON public.farm_income TO service_role;
ALTER TABLE public.farm_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own income" ON public.farm_income FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX farm_income_user_date ON public.farm_income(user_id, sale_date);
CREATE TRIGGER farm_income_updated BEFORE UPDATE ON public.farm_income FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Anniversary Cards — Phase B schema
-- Run this entire file in the Supabase SQL Editor (Project → SQL Editor → New query)

-- ─── PROFILES ──────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar text NOT NULL DEFAULT '👤',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ─── WALLETS ───────────────────────────────────────────────────────────────
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  hearts_balance integer NOT NULL DEFAULT 50,
  free_packs_used_today integer NOT NULL DEFAULT 0,
  free_packs_reset_date date,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all wallets" ON public.wallets
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can update all wallets" ON public.wallets
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ─── TASKS ─────────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL CHECK (type IN ('daily', 'special', 'secret')),
  reward integer NOT NULL DEFAULT 5,
  reward_type text NOT NULL DEFAULT 'hearts' CHECK (reward_type IN ('hearts', 'free_pack')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tasks" ON public.tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage tasks" ON public.tasks
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ─── TASK COMPLETIONS ──────────────────────────────────────────────────────
CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  period_key text NOT NULL,  -- YYYY-MM-DD for daily, 'once' for special/secret
  reward integer,
  reward_type text,
  UNIQUE (task_id, user_id, period_key)
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own completions" ON public.task_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON public.task_completions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all completions" ON public.task_completions
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete completions" ON public.task_completions
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ─── CARDS (pool) ──────────────────────────────────────────────────────────
CREATE TABLE public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number integer NOT NULL UNIQUE CHECK (card_number BETWEEN 1 AND 100),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  effect text NOT NULL DEFAULT 'holo',
  rarity_tier text NOT NULL DEFAULT 'rare',
  is_flat boolean NOT NULL DEFAULT false,
  photo_url text,
  year text,
  active boolean NOT NULL DEFAULT true,
  weight integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cards" ON public.cards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage cards" ON public.cards
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ─── USER COLLECTION ───────────────────────────────────────────────────────
CREATE TABLE public.user_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  card_number integer NOT NULL,
  count integer NOT NULL DEFAULT 1,
  last_added timestamptz DEFAULT now(),
  UNIQUE (user_id, card_id)
);

ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own collection" ON public.user_collection
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own collection" ON public.user_collection
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all collections" ON public.user_collection
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admin can delete from any collection" ON public.user_collection
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ─── TRIGGER: auto-create profile + wallet on signup ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '👤')
  );

  INSERT INTO public.wallets (user_id, hearts_balance)
  VALUES (NEW.id, 50);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── RPC: add card to collection (upsert + increment count) ────────────────
CREATE OR REPLACE FUNCTION public.add_to_collection(
  p_user_id uuid,
  p_card_id uuid,
  p_card_number integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_collection (user_id, card_id, card_number, count)
  VALUES (p_user_id, p_card_id, p_card_number, 1)
  ON CONFLICT (user_id, card_id)
  DO UPDATE SET
    count = user_collection.count + 1,
    last_added = now();
END;
$$;

-- ─── STORAGE: card-photos bucket ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-photos', 'card-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated upload to card-photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'card-photos');

CREATE POLICY "Public read card-photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'card-photos');

CREATE POLICY "Admin delete card-photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'card-photos'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Visora — Phase 3: allow a newly signed-up user to create their own
-- profile row (0001_init.sql only allowed SELECT/UPDATE on profiles).

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

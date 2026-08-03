-- Visora — Initial schema (Phase 2)
-- Tables: profiles, templates, render_logs
-- Includes Row Level Security policies.

-- 1. Users Profile & Subscription Info
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  plan_tier TEXT DEFAULT 'free', -- 'free', 'starter', 'pro', 'agency'
  monthly_quota INT DEFAULT 100,
  usage_this_month INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HTML/Tailwind Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_preset BOOLEAN DEFAULT FALSE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'ecommerce', 'media', 'certificate', 'banner'
  html_body TEXT NOT NULL,
  default_variables JSONB DEFAULT '{}'::jsonb,
  width INT DEFAULT 1200,
  height INT DEFAULT 630,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Render Logs
CREATE TABLE IF NOT EXISTS public.render_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id),
  render_time_ms INT NOT NULL,
  status_code INT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_render_logs_user_id ON public.render_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_render_logs_template_id ON public.render_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON public.profiles(api_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: a user may only read/update their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Templates: users manage their own templates; presets are readable by everyone
CREATE POLICY "Users can manage own templates"
  ON public.templates FOR ALL
  USING (auth.uid() = user_id OR is_preset = TRUE);

-- Render logs: users may only read their own render history
CREATE POLICY "Users can read own render logs"
  ON public.render_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own render logs"
  ON public.render_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

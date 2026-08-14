-- Anti-abuse protection for signups: IP rate limiting + a VPN/hosting
-- CIDR blocklist, enforced through Supabase Auth's "before-user-created"
-- hook (Authentication > Hooks in the dashboard).
--
-- This runs server-side, before the user row is ever inserted — so it
-- can't be bypassed by calling the Supabase Auth API directly and
-- skipping the frontend (unlike checks that only live in the Worker).
--
-- CAPTCHA (Cloudflare Turnstile) is configured separately in
-- Authentication > Bot and Abuse Protection in the dashboard — that's
-- pure dashboard config, no migration needed for it.

-- Every hook invocation (allowed or blocked) gets logged here so the
-- rate limit can't be gamed by an attacker who stays just under the
-- threshold on purpose — we count attempts, not just successful signups.
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_address INET NOT NULL,
  email TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_time
  ON public.signup_attempts (ip_address, created_at DESC);

-- Only the auth admin role (used internally by the hook) and service
-- role ever need to touch this table.
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

-- Known VPN / proxy / hosting-provider ranges. This is a *starting*
-- seed list of well-known commercial VPN exit ranges and generic cloud
-- hosting blocks (the two biggest sources of fake-account abuse) — not
-- exhaustive. New ranges can be added any time with:
--   INSERT INTO public.blocked_ip_ranges (cidr, reason) VALUES ('1.2.3.0/24', 'some VPN');
CREATE TABLE IF NOT EXISTS public.blocked_ip_ranges (
  id SERIAL PRIMARY KEY,
  cidr CIDR NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_ip_ranges ENABLE ROW LEVEL SECURITY;

-- Seed with commonly-abused datacenter/VPN ranges. Trimmed, high-signal
-- starter set — extend over time as you see abuse in signup_attempts.
INSERT INTO public.blocked_ip_ranges (cidr, reason) VALUES
  -- NordVPN
  ('185.156.172.0/22', 'NordVPN'),
  ('89.187.160.0/22', 'NordVPN'),
  -- ProtonVPN
  ('185.159.157.0/24', 'ProtonVPN'),
  ('185.107.44.0/22', 'ProtonVPN'),
  -- Surfshark
  ('149.40.48.0/20', 'Surfshark'),
  -- Mullvad
  ('185.213.154.0/24', 'Mullvad VPN'),
  -- M247 (widely used by many VPN brands as backend infra)
  ('89.187.128.0/18', 'M247 datacenter/VPN backend'),
  -- Generic low-cost VPS ranges frequently used for account-farming bots
  ('45.142.120.0/22', 'Generic VPS/proxy hosting'),
  ('185.220.100.0/22', 'Known Tor exit / proxy range')
ON CONFLICT (cidr) DO NOTHING;

-- The hook itself. Rejects signups when:
--   1. the IP is inside a known VPN/hosting CIDR, or
--   2. that IP has already attempted 3+ signups in the last 24 hours.
-- Every call is logged to signup_attempts regardless of outcome.
CREATE OR REPLACE FUNCTION public.hook_signup_abuse_protection(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  raw_ip text;
  client_ip inet;
  attempt_email text;
  is_blocked_range boolean := false;
  block_reason_text text;
  recent_attempts int;
  max_attempts_per_ip constant int := 3;
  window_hours constant int := 24;
BEGIN
  raw_ip := event->'metadata'->>'ip_address';
  attempt_email := event->'user'->>'email';

  -- No IP on the payload (shouldn't normally happen) — don't block, just log.
  IF raw_ip IS NULL OR raw_ip = '' THEN
    RETURN '{}'::jsonb;
  END IF;

  BEGIN
    client_ip := raw_ip::inet;
  EXCEPTION WHEN others THEN
    RETURN '{}'::jsonb;
  END;

  -- Check 1: known VPN/hosting range.
  SELECT reason INTO block_reason_text
  FROM public.blocked_ip_ranges
  WHERE client_ip <<= cidr
  LIMIT 1;

  IF block_reason_text IS NOT NULL THEN
    is_blocked_range := true;
  END IF;

  -- Check 2: too many attempts from this IP recently.
  SELECT count(*) INTO recent_attempts
  FROM public.signup_attempts
  WHERE ip_address = client_ip
    AND created_at > now() - (window_hours || ' hours')::interval;

  IF is_blocked_range THEN
    INSERT INTO public.signup_attempts (ip_address, email, blocked, block_reason)
    VALUES (client_ip, attempt_email, true, coalesce(block_reason_text, 'blocked IP range'));

    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Sign-ups are not available from VPN or proxy connections. Please disable your VPN and try again.'
      )
    );
  END IF;

  IF recent_attempts >= max_attempts_per_ip THEN
    INSERT INTO public.signup_attempts (ip_address, email, blocked, block_reason)
    VALUES (client_ip, attempt_email, true, 'rate limit: ' || recent_attempts || ' attempts in ' || window_hours || 'h');

    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 429,
        'message', 'Too many accounts have been created from this network recently. Please try again later.'
      )
    );
  END IF;

  -- Allowed — log the attempt and let signup proceed.
  INSERT INTO public.signup_attempts (ip_address, email, blocked)
  VALUES (client_ip, attempt_email, false);

  RETURN '{}'::jsonb;
END;
$$;

-- Only the internal auth admin role may call this (matches Supabase's
-- documented pattern for before-user-created hook functions).
GRANT EXECUTE
  ON FUNCTION public.hook_signup_abuse_protection
  TO supabase_auth_admin;

REVOKE EXECUTE
  ON FUNCTION public.hook_signup_abuse_protection
  FROM authenticated, anon, public;

-- ---------------------------------------------------------------------
-- Manual step required after running this migration:
--
-- Supabase Dashboard -> Authentication -> Hooks -> "Before User Created"
--   -> Enable, type "Postgres function", select
--      public.hook_signup_abuse_protection
--
-- Supabase Dashboard -> Authentication -> Bot and Abuse Protection
--   -> Enable CAPTCHA protection -> provider "Turnstile"
--   -> paste the Turnstile SECRET key (from Cloudflare dash -> Turnstile)
--
-- The Turnstile SITE key goes in Cloudflare Pages as
-- VITE_TURNSTILE_SITE_KEY (frontend env var, see Signup.tsx).
-- ---------------------------------------------------------------------

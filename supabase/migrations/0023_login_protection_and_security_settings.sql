-- Login abuse protection + configurable security settings + admin access
-- to Supabase's own login audit trail.
--
-- IMPORTANT CONSTRAINT (verified against Supabase's docs before writing
-- this): the "Password Verification Attempt" hook payload is only
-- `{ user_id, valid }` — no IP address. Unlike the "Before User Created"
-- hook (used for signup, see migration 0022), there's no way to block a
-- login attempt by IP from a Postgres hook. So:
--   - Login brute-force protection here is per-account (user_id), not
--     per-IP — lock an account out after N wrong passwords in a window,
--     the same pattern Supabase's own docs recommend.
--   - IP address on logins is still visible — just read-only, sourced
--     from Supabase's built-in `auth.audit_log_entries` (it does capture
--     IP for login events), exposed to admins via a SECURITY DEFINER
--     function below. You can *see* repeat IPs; you can't have Postgres
--     *reject* a login purely by IP the way signups can be rejected.
--   - blocked_ip_ranges (from 0022) still fully blocks signups from
--     those ranges. It does not and cannot block logins — there's no
--     hook wired for that. If IP-level login blocking becomes a hard
--     requirement, the fix is routing login through your own Worker
--     instead of calling Supabase Auth directly from the browser, so
--     the Worker can check the IP before ever forwarding the request.
--     That's a real architecture change, not a migration — flagging it,
--     not building it today.

-- ---------------------------------------------------------------------
-- Configurable security settings (single row) — the admin panel edits
-- this table directly instead of these being hardcoded constants.
CREATE TABLE IF NOT EXISTS public.security_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CONSTRAINT single_row CHECK (id),
  max_signup_attempts_per_ip INT NOT NULL DEFAULT 3,
  signup_window_hours INT NOT NULL DEFAULT 24,
  max_login_failures_per_account INT NOT NULL DEFAULT 5,
  login_lockout_window_minutes INT NOT NULL DEFAULT 15,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.security_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security settings" ON public.security_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update security settings" ON public.security_settings
  FOR UPDATE USING (public.is_admin());

-- ---------------------------------------------------------------------
-- Re-point the signup hook at the configurable settings instead of the
-- hardcoded constants from 0022. Logic is otherwise identical.
CREATE OR REPLACE FUNCTION public.hook_signup_abuse_protection(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  raw_ip text;
  client_ip inet;
  attempt_email text;
  block_reason_text text;
  recent_attempts int;
  settings record;
BEGIN
  SELECT * INTO settings FROM public.security_settings WHERE id = true;

  raw_ip := event->'metadata'->>'ip_address';
  attempt_email := event->'user'->>'email';

  IF raw_ip IS NULL OR raw_ip = '' THEN
    RETURN '{}'::jsonb;
  END IF;

  BEGIN
    client_ip := raw_ip::inet;
  EXCEPTION WHEN others THEN
    RETURN '{}'::jsonb;
  END;

  SELECT reason INTO block_reason_text
  FROM public.blocked_ip_ranges
  WHERE client_ip <<= cidr
  LIMIT 1;

  IF block_reason_text IS NOT NULL THEN
    INSERT INTO public.signup_attempts (ip_address, email, blocked, block_reason)
    VALUES (client_ip, attempt_email, true, coalesce(block_reason_text, 'blocked IP range'));

    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Sign-ups are not available from VPN or proxy connections. Please disable your VPN and try again.'
      )
    );
  END IF;

  SELECT count(*) INTO recent_attempts
  FROM public.signup_attempts
  WHERE ip_address = client_ip
    AND created_at > now() - (settings.signup_window_hours || ' hours')::interval;

  IF recent_attempts >= settings.max_signup_attempts_per_ip THEN
    INSERT INTO public.signup_attempts (ip_address, email, blocked, block_reason)
    VALUES (client_ip, attempt_email, true, 'rate limit: ' || recent_attempts || ' attempts in ' || settings.signup_window_hours || 'h');

    RETURN jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 429,
        'message', 'Too many accounts have been created from this network recently. Please try again later.'
      )
    );
  END IF;

  INSERT INTO public.signup_attempts (ip_address, email, blocked)
  VALUES (client_ip, attempt_email, false);

  RETURN '{}'::jsonb;
END;
$$;

-- ---------------------------------------------------------------------
-- Login brute-force protection — per account, not per IP (see note up
-- top on why IP isn't available here). Wire to Authentication > Hooks >
-- "Password Verification Attempt" in the Supabase dashboard.
CREATE TABLE IF NOT EXISTS public.login_failures (
  user_id UUID PRIMARY KEY,
  failure_count INT NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ
);

ALTER TABLE public.login_failures ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.hook_login_abuse_protection(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  uid uuid;
  is_valid boolean;
  settings record;
  existing record;
BEGIN
  SELECT * INTO settings FROM public.security_settings WHERE id = true;

  uid := (event->>'user_id')::uuid;
  is_valid := (event->>'valid')::boolean;

  SELECT * INTO existing FROM public.login_failures WHERE user_id = uid;

  -- Currently locked out.
  IF existing.locked_until IS NOT NULL AND existing.locked_until > now() THEN
    RETURN jsonb_build_object(
      'decision', 'reject',
      'message', 'Too many failed attempts. Try again in a few minutes.',
      'should_logout_user', false
    );
  END IF;

  IF is_valid THEN
    -- Correct password — clear any failure history for this account.
    DELETE FROM public.login_failures WHERE user_id = uid;
    RETURN jsonb_build_object('decision', 'continue');
  END IF;

  -- Wrong password — record/increment the failure.
  INSERT INTO public.login_failures (user_id, failure_count, last_failed_at)
  VALUES (uid, 1, now())
  ON CONFLICT (user_id) DO UPDATE
    SET failure_count = public.login_failures.failure_count + 1,
        last_failed_at = now(),
        locked_until = CASE
          WHEN public.login_failures.failure_count + 1 >= settings.max_login_failures_per_account
            THEN now() + (settings.login_lockout_window_minutes || ' minutes')::interval
          ELSE NULL
        END;

  RETURN jsonb_build_object('decision', 'continue');
END;
$$;

GRANT EXECUTE ON FUNCTION public.hook_login_abuse_protection TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.hook_login_abuse_protection FROM authenticated, anon, public;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.login_failures TO supabase_auth_admin;
REVOKE ALL ON public.login_failures FROM authenticated, anon, public;

-- ---------------------------------------------------------------------
-- Admin-only read access to Supabase's own login/signup audit trail
-- (auth.audit_log_entries) — this is where real IP addresses on login
-- events actually live. Exposed via SECURITY DEFINER since the `auth`
-- schema isn't directly queryable by the authenticated role.
CREATE OR REPLACE FUNCTION public.admin_get_auth_audit_log(result_limit INT DEFAULT 300)
RETURNS TABLE (
  id UUID,
  action TEXT,
  email TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.payload->>'action' AS action,
    COALESCE(e.payload->'actor_username', e.payload->'traits'->'email') #>> '{}' AS email,
    e.ip_address::text,
    e.created_at
  FROM auth.audit_log_entries e
  WHERE e.payload->>'action' IN ('login', 'user_signedup', 'logout', 'token_refreshed')
  ORDER BY e.created_at DESC
  LIMIT result_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_auth_audit_log TO authenticated;

-- Same treatment for the two abuse-tracking tables built in 0022 —
-- admins should be able to read them from the panel (previously only
-- the auth hook role could touch them at all).
CREATE POLICY "Admins can view signup attempts" ON public.signup_attempts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view blocked IP ranges" ON public.blocked_ip_ranges
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage blocked IP ranges" ON public.blocked_ip_ranges
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can view login failures" ON public.login_failures
  FOR SELECT USING (public.is_admin());

-- ---------------------------------------------------------------------
-- Manual step required after running this migration:
--
-- Supabase Dashboard -> Authentication -> Hooks -> "Password Verification
-- Attempt" -> Enable, type "Postgres function", select
-- public.hook_login_abuse_protection
--
-- (The signup hook from 0022 doesn't need re-wiring — same function
-- name, this migration only changed its body.)
-- ---------------------------------------------------------------------

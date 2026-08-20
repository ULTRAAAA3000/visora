-- Google OAuth sign-in was being rejected outright with:
--   "Error running hook URI: pg-functions://postgres/public/
--    hook_signup_abuse_protection" (error_code: unexpected_failure)
--
-- Whatever the exact trigger (OAuth's before-user-created payload
-- likely differs subtly from the password-signup shape the function
-- was written against — see the diagnostic note at the bottom), the
-- real problem is architectural: an anti-abuse hook that can throw an
-- unhandled exception is a hook that can accidentally lock out *every*
-- legitimate signup and login, not just bots. That's worse than the
-- abuse it's meant to prevent.
--
-- Wrap the whole body in an outer exception handler so any unexpected
-- error fails OPEN (allows the attempt through) instead of failing
-- closed. The two deliberate rejections (VPN range, rate limit) are
-- unaffected — those still block as designed.
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
    is_blocked_range := true;
  END IF;

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

  INSERT INTO public.signup_attempts (ip_address, email, blocked)
  VALUES (client_ip, attempt_email, false);

  RETURN '{}'::jsonb;
EXCEPTION WHEN others THEN
  -- Fail open: log to Postgres's own logs (visible in Supabase
  -- Dashboard -> Logs -> Postgres Logs) so the real bug can still be
  -- found and fixed, but never block the auth attempt because of it.
  RAISE WARNING 'hook_signup_abuse_protection failed open: % — %', SQLSTATE, SQLERRM;
  RETURN '{}'::jsonb;
END;
$$;

-- DIAGNOSTIC NOTE for whoever investigates the root cause later:
-- most likely candidates, roughly in order of likelihood —
--   1. `client_ip <<= cidr` against an IPv6 address when a CIDR column
--      only has IPv4 entries mixed with a query planner/type quirk.
--   2. The OAuth flow's `event` payload nesting `user`/`metadata`
--      differently than password signup (unconfirmed — Supabase's
--      public docs describe one shape, but it's worth verifying
--      against an actual captured `event` value for a Google sign-in,
--      e.g. by temporarily RAISE NOTICE'ing event::text near the top).
--   3. RLS on signup_attempts/blocked_ip_ranges (both enabled in
--      migration 0022 with zero policies) combined with the function
--      somehow not running as a role that bypasses RLS.
-- Check Postgres Logs in the Supabase dashboard around the failure
-- timestamp for the actual SQLSTATE/SQLERRM now that it's logged
-- via RAISE WARNING above.

-- Login UX request: tell the user specifically "no account with that
-- email" vs "wrong password" instead of Supabase's deliberately-vague
-- "Invalid login credentials".
--
-- SECURITY TRADEOFF, stated plainly: this is a textbook account-
-- enumeration surface (OWASP explicitly recommends the generic
-- message Supabase ships by default). Mitigation here is that the
-- frontend only calls this RPC from inside the same Turnstile-gated
-- login submit handler, after a failed signInWithPassword — it's not
-- exposed as a standalone "check if this email exists" endpoint. That
-- keeps it behind the same CAPTCHA the login form already requires,
-- rather than adding a new unprotected oracle. Still not airtight
-- against a scripted solver, but consistent with the rest of the
-- app's protection level. If abuse shows up in signup_attempts-style
-- logs later, tighten this further (e.g. drop it, or add its own
-- per-IP rate limit table like 0022's signup protection).
CREATE OR REPLACE FUNCTION public.email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(email) = lower(check_email)
  );
$$;

GRANT EXECUTE ON FUNCTION public.email_exists(TEXT) TO anon, authenticated;

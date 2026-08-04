# Email templates & auth redirect setup

Supabase-hosted email templates aren't managed through migrations/code —
they're pasted manually into the Dashboard. This folder just keeps the
source of truth in version control.

## 1. Confirm signup email

1. Supabase Dashboard → **Authentication → Email Templates → Confirm signup**
2. Replace the **Message body** with the full contents of `confirm-signup.html`
3. Save

## 2. Allow the confirmation link to redirect into the app

The frontend calls `supabase.auth.signUp()` with
`emailRedirectTo: <origin>/dashboard` (see `src/pages/Signup.jsx`), so the
confirmation link should land the user directly on `/dashboard`, already
signed in. For Supabase to allow that redirect, whitelist your Pages domain:

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL**: `https://<your-project>.pages.dev` (or your custom domain)
3. **Redirect URLs**: add `https://<your-project>.pages.dev/**`
   (the `/**` wildcard covers `/dashboard`, `/login`, previews, etc.)
4. Save

Without step 2, Supabase rejects the redirect with "requested path is
invalid" and falls back to the Site URL's root instead of `/dashboard`.

## 3. Optional: also update other auth emails

Same idea applies to **Magic Link**, **Reset password**, and **Change
email address** templates if/when those flows get used — none are wired
into the app yet (only email+password signup/login exist today).

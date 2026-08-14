# Email templates & auth redirect setup

Supabase-hosted email templates aren't managed through migrations/code —
they're pasted manually into the Dashboard. This folder just keeps the
source of truth in version control.

## 1. Confirm signup email

1. Supabase Dashboard → **Authentication → Email Templates → Confirm signup**
2. Replace the **Message body** with the full contents of `confirm-signup.html`
3. Save

## 2. Reset password email

1. Supabase Dashboard → **Authentication → Email Templates → Reset Password**
2. Replace the **Message body** with the full contents of `reset-password.html`
3. Save

The frontend calls `supabase.auth.resetPasswordForEmail()` with
`redirectTo: <origin>/reset-password` (see `src/pages/ForgotPassword.tsx`),
so this link needs the same redirect URL whitelisting as step 3 below —
`/reset-password` is covered by the same `/**` wildcard.

## 3. Allow redirect links into the app

The frontend calls `supabase.auth.signUp()` with
`emailRedirectTo: <origin>/dashboard` (see `src/pages/Signup.tsx`), so the
confirmation link should land the user directly on `/dashboard`, already
signed in. For Supabase to allow that redirect (and the reset-password one
above), whitelist your Pages domain:

1. Supabase Dashboard → **Authentication → URL Configuration**
2. **Site URL**: `https://visor-a.com`
3. **Redirect URLs**: add `https://visor-a.com/**`
   (the `/**` wildcard covers `/dashboard`, `/login`, `/reset-password`,
   previews, etc.)
4. Save

Without step 3, Supabase rejects the redirect with "requested path is
invalid" and falls back to the Site URL's root instead of the intended page.

**Not done automatically**: this is a Dashboard setting, not something a
git push touches — go set it now if you haven't, otherwise every auth
email link still points at the old `*.pages.dev` address.

## 4. Optional: also update remaining auth emails

Same idea applies to **Magic Link** and **Change email address** templates
if/when those flows get used — not wired into the app yet (email+password
signup/login/reset covers the current flows).

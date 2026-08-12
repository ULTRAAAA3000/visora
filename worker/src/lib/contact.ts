import type { SupabaseClient } from '@supabase/supabase-js';
import { json } from './auth';
import type { Env } from '../env';

const CONTACT_EMAIL = 'visora.image@gmail.com';
const MAX_FIELD_LENGTH = 5000;

interface ContactBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  // Honeypot — a real visitor never sees or fills this field (hidden
  // off-screen in the form). Any value here means it's a bot filling
  // every input it can find, so we quietly pretend to succeed instead
  // of telling it what tripped the filter.
  website?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Stores every submission in Supabase regardless of whether email
 * delivery is configured — visible in /admin either way — then best-
 * effort emails visora.image@gmail.com via Resend if RESEND_API_KEY is
 * set. A missing/failing Resend call never fails the request; the
 * message is already safely stored by that point.
 */
export async function handleContact(request: Request, env: Env, supabase: SupabaseClient): Promise<Response> {
  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  if (body.website) {
    // Honeypot tripped — respond as if it worked, don't store it.
    return json({ success: true });
  }

  const name = (body.name ?? '').trim().slice(0, 200);
  const email = (body.email ?? '').trim().slice(0, 200);
  const subject = (body.subject ?? '').trim().slice(0, 200);
  const message = (body.message ?? '').trim().slice(0, MAX_FIELD_LENGTH);

  if (!email || !EMAIL_RE.test(email)) {
    return json({ success: false, error: 'A valid email is required.' }, 400);
  }
  if (!message) {
    return json({ success: false, error: 'Message is required.' }, 400);
  }

  const { error: insertError } = await supabase.from('contact_messages').insert({
    name: name || null,
    email,
    subject: subject || null,
    message,
  });

  if (insertError) {
    console.error('Failed to store contact message', insertError);
    return json({ success: false, error: 'Could not send your message. Try again in a moment.' }, 500);
  }

  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Visora <contact@visora.io>', // update once the sending domain is verified in Resend
          to: [CONTACT_EMAIL],
          reply_to: email,
          subject: subject ? `[Visora contact] ${subject}` : '[Visora contact] New message',
          text: `From: ${name || 'Anonymous'} <${email}>\n\n${message}`,
        }),
      });
      if (!res.ok) {
        console.error('Resend send failed', res.status, await res.text());
      }
    } catch (err) {
      console.error('Resend send threw', err);
    }
  }

  return json({ success: true });
}

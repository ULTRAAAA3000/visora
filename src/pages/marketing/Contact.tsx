import { useState } from 'react';
import { Send, Check } from 'lucide-react';
import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import { usePageMeta } from '../../lib/usePageMeta';

const CONTACT_EMAIL = 'visora.image@gmail.com';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function Contact() {
  usePageMeta({
    title: 'Contact',
    description: 'Questions, bug reports, feature requests, or partnership inquiries — reach the Visora team directly.',
    path: '/contact',
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — real visitors never see this field
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_RENDER_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiBase) return;

    setStatus('sending');
    setError(null);
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/contact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus('error');
        setError(data.error ?? 'Something went wrong. Try again in a moment.');
        return;
      }
      setStatus('sent');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setStatus('error');
      setError('Could not reach the server. Try again in a moment.');
    }
  };

  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Contact</p>
        <h1 className="text-4xl font-bold text-white mb-4">Get in touch</h1>
        <p className="text-lg text-[#D7E2EA]/70 mb-10">
          Questions, bug reports, feature requests, partnership stuff — whatever it is, this goes straight to us.
          You can also reach us directly at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        {status === 'sent' ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <Check className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-white font-medium">Message sent.</p>
              <p className="text-sm text-gray-400">We'll get back to you at the email you gave us.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot — hidden from real visitors via CSS, not just visually offscreen tabbable */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute -left-[9999px] w-px h-px opacity-0"
              aria-hidden="true"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Message *</label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {apiBase ? (
              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-5 py-2.5 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                The form isn't wired up yet — email us directly at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-white underline underline-offset-2">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            )}
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}

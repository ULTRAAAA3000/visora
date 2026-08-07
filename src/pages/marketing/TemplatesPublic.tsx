import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, FileCode2 } from 'lucide-react';
import SiteHeader from '../../components/landing/SiteHeader';
import Footer from '../../components/landing/Footer';
import { supabase } from '../../lib/supabase';
import type { TemplateGalleryEntry } from '../../lib/database.types';

/**
 * Public gallery — anonymous visitors can browse what's available before
 * signing up. Reads from the `template_gallery` view (metadata only, no
 * html_body), which deliberately bypasses the tier-gated RLS on the base
 * `templates` table so pro/agency rows still show up (as locked) instead
 * of silently disappearing for logged-out visitors. See migration 0010.
 */
export default function TemplatesPublic() {
  const [templates, setTemplates] = useState<TemplateGalleryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    supabase
      .from('template_gallery')
      .select('*')
      .order('tier', { ascending: true })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) console.error(error);
        setTemplates(data ?? []);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-black min-h-screen">
      <SiteHeader transparentAtTop={false} />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-10 pt-36 pb-24">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Template Gallery</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">30 templates, ready to render</h1>
        <p className="text-lg text-[#D7E2EA]/70 max-w-2xl mb-14">
          Certificates, product banners, social cards, and more — pick one, fill in the fields, get an image URL
          back. <Link to="/signup" className="text-white underline underline-offset-2">Sign up free</Link> to use
          any of them.
        </p>

        {loading ? (
          <p className="text-white/40 text-sm">Loading templates…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className={`rounded-2xl border p-5 relative ${
                  tpl.tier === 'agency'
                    ? 'border-amber-400/30 bg-gradient-to-b from-amber-400/[0.08] to-transparent'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                {tpl.tier !== 'free' && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-full px-2 py-0.5">
                    {tpl.tier === 'agency' && <Crown className="w-2.5 h-2.5" />}
                    {tpl.tier}
                  </span>
                )}

                <div className="aspect-[4/3] rounded-lg bg-black/40 border border-white/10 mb-4 overflow-hidden flex items-center justify-center">
                  {tpl.preview_image_url ? (
                    <img
                      src={tpl.preview_image_url}
                      alt={tpl.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : tpl.tier === 'agency' ? (
                    <Crown className="w-6 h-6 text-amber-400/60" />
                  ) : (
                    <FileCode2 className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <h2 className="font-medium text-white mb-1 pr-14">{tpl.title}</h2>
                <p className="text-xs text-gray-500">
                  {tpl.category} · {tpl.width}×{tpl.height}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

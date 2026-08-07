-- Visora — Agency tier redesign. The original 5 (migration 0008) were
-- centered-text-on-gradient compositions — competent but thin for the
-- top tier of the gallery. Rebuilt with real layout complexity:
-- asymmetric grids, layered depth (glass panels, orbit rings, spotlight
-- glow), full-bleed photography where it makes sense, and denser
-- information hierarchy (chips, KPIs, coverlines) instead of a single
-- centered stack.

-- 1. Luxury Product Launch — asymmetric split: copy left, spotlight
--    pedestal with layered halo rings right, foil corner stripe.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Cormorant Garamond', serif; }
    .noise { background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 3px 3px; }
  </style>
</head>
<body class="noise bg-[#0A0A0A] w-[1600px] h-[900px] m-0 relative overflow-hidden flex">
  <div class="absolute -top-40 -right-40 w-[500px] h-[500px] rotate-45" style="background: linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent);"></div>

  <div class="w-[55%] h-full flex flex-col justify-center pl-24 pr-16 relative z-10">
    <p class="text-[11px] tracking-[0.5em] uppercase text-[#D4AF37] mb-8">Now Available</p>
    <h1 class="display text-[120px] leading-[0.92] text-white mb-8">{{product_name}}</h1>
    <div class="w-20 h-px bg-[#D4AF37] mb-8"></div>
    <p class="text-lg text-white/50 max-w-md mb-12">{{tagline}}</p>
    <div class="flex items-center gap-8">
      <div>
        <p class="text-[10px] uppercase tracking-widest text-white/30 mb-1">Release</p>
        <p class="text-sm text-white/70">{{release_date}}</p>
      </div>
      <div class="w-px h-8 bg-white/10"></div>
      <div>
        <p class="text-[10px] uppercase tracking-widest text-white/30 mb-1">Crafted</p>
        <p class="text-sm text-white/70">By Visora Atelier</p>
      </div>
    </div>
  </div>

  <div class="w-[45%] h-full relative flex items-center justify-center">
    <div class="absolute w-[420px] h-[420px] rounded-full" style="background: radial-gradient(circle, rgba(212,175,55,0.25), transparent 70%); filter: blur(6px);"></div>
    <div class="absolute w-[260px] h-[260px] rounded-full border border-[#D4AF37]/30" style="transform: rotate(20deg);"></div>
    <div class="absolute w-[340px] h-[340px] rounded-full border border-[#D4AF37]/15" style="transform: rotate(-15deg);"></div>
    <div class="w-40 h-40 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10"></div>
    <div class="absolute bottom-24 w-64 h-10 rounded-full" style="background: radial-gradient(ellipse, rgba(212,175,55,0.3), transparent 70%);"></div>
  </div>

  <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
  <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"></div>
</body>
</html>$html$
WHERE title = 'Luxury Product Launch' AND is_preset = TRUE;

-- 2. Premium Magazine Cover — full-bleed editorial photo instead of a
--    flat color block, scrims for legibility, wraparound coverlines.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;900&family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
  </style>
</head>
<body class="bg-black w-[1000px] h-[1300px] m-0 relative overflow-hidden">
  <img src="{{cover_image_url}}" class="absolute inset-0 w-full h-full object-cover" />
  <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40"></div>
  <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent"></div>

  <div class="relative h-full flex flex-col justify-between p-10">
    <div class="flex items-center justify-between">
      <span class="text-[10px] uppercase tracking-widest text-white/70">{{issue_date}}</span>
      <span class="text-[10px] uppercase tracking-widest text-white/70">Collector's Edition</span>
    </div>

    <h1 class="display text-[130px] text-center text-white leading-none" style="text-shadow: 0 4px 40px rgba(0,0,0,0.5);">{{magazine_name}}</h1>

    <div class="flex items-start justify-between px-2">
      <p class="text-xs uppercase tracking-widest text-[#E11D48] font-bold max-w-[180px] leading-snug" style="text-shadow: 0 2px 12px rgba(0,0,0,0.8);">{{coverline_1}}</p>
      <p class="text-xs uppercase tracking-widest text-white font-bold max-w-[180px] text-right leading-snug" style="text-shadow: 0 2px 12px rgba(0,0,0,0.8);">{{coverline_2}}</p>
    </div>

    <div>
      <h2 class="text-5xl font-black text-white leading-[1.05] mb-8" style="text-shadow: 0 4px 20px rgba(0,0,0,0.6);">{{cover_headline}}</h2>
      <div class="flex items-center justify-between">
        <div class="flex gap-[3px] items-end h-6">
          <div class="w-[3px] h-full bg-white"></div>
          <div class="w-[3px] h-4 bg-white"></div>
          <div class="w-[3px] h-full bg-white"></div>
          <div class="w-[3px] h-3 bg-white"></div>
          <div class="w-[3px] h-full bg-white"></div>
          <div class="w-[3px] h-5 bg-white"></div>
        </div>
        <span class="text-[10px] uppercase tracking-widest text-white/60">visora.io</span>
      </div>
    </div>
  </div>
</body>
</html>$html$,
    default_variables = '{"magazine_name": "RENDER", "cover_headline": "Inside the API doing 10M images a day", "issue_date": "Issue 12 — Aug 2026", "coverline_1": "The Chromium Advantage", "coverline_2": "Design Systems At Scale", "cover_image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&q=85"}'::jsonb
WHERE title = 'Premium Magazine Cover' AND is_preset = TRUE;

-- 3. Keynote Announcement — layered glass panels + orbit rings behind an
--    asymmetric (not centered) content block.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .glass { background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.12); }
  </style>
</head>
<body class="bg-[#0B1120] w-[1600px] h-[900px] m-0 relative overflow-hidden">
  <div class="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full" style="background: radial-gradient(circle, rgba(45,212,191,0.3), transparent 70%); filter: blur(20px);"></div>
  <div class="absolute -bottom-40 right-0 w-[600px] h-[600px] rounded-full" style="background: radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%); filter: blur(20px);"></div>
  <div class="absolute top-1/4 right-1/3 w-[300px] h-[300px] rounded-full" style="background: radial-gradient(circle, rgba(244,114,182,0.2), transparent 70%); filter: blur(20px);"></div>

  <div class="absolute right-24 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/10"></div>
  <div class="absolute right-24 top-1/2 w-[320px] h-[320px] rounded-full border border-white/10" style="transform: translateY(-50%) rotate(30deg);"></div>
  <div class="absolute right-40 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full" style="background: linear-gradient(135deg, rgba(45,212,191,0.3), rgba(167,139,250,0.3)); filter: blur(8px);"></div>

  <div class="relative h-full flex flex-col justify-center pl-24 pr-[520px]">
    <div class="glass inline-flex items-center gap-2 rounded-full px-4 py-2 w-fit mb-8">
      <span class="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
      <span class="text-xs uppercase tracking-widest text-white/70">{{event_name}} &middot; {{event_date}}</span>
    </div>

    <h1 class="text-7xl font-black text-white leading-[1.05] mb-6">{{speaker_name}}</h1>
    <p class="text-2xl text-white/70 font-medium mb-12 max-w-xl">{{keynote_title}}</p>

    <div class="flex items-center gap-4">
      <div class="glass rounded-xl px-5 py-3">
        <p class="text-[10px] uppercase tracking-widest text-white/40">Main Stage</p>
      </div>
      <div class="glass rounded-xl px-5 py-3">
        <p class="text-[10px] uppercase tracking-widest text-white/40">45 min</p>
      </div>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Keynote Announcement' AND is_preset = TRUE;

-- 4. Black-Tie Gala Invitation — richer laurel crest, full diagonal
--    hairline pattern instead of a flat fill.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Cormorant Garamond', serif; }
    .pattern { background-image: repeating-linear-gradient(45deg, rgba(201,162,75,0.05) 0px, rgba(201,162,75,0.05) 1px, transparent 1px, transparent 24px); }
  </style>
</head>
<body class="pattern bg-[#0B3D2E] w-[1200px] h-[1600px] m-0 relative overflow-hidden">
  <div class="absolute inset-[40px] border-2 border-[#C9A24B]"></div>
  <div class="absolute inset-[52px] border border-[#C9A24B]/50"></div>

  <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-24">
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" class="mb-10">
      <g stroke="#C9A24B" stroke-width="1.2" fill="none" opacity="0.85">
        <path d="M70 20 C 55 25, 45 40, 45 55 C 45 70, 55 82, 70 85"/>
        <path d="M70 20 C 85 25, 95 40, 95 55 C 95 70, 85 82, 70 85"/>
        <path d="M55 35 C 48 38, 44 45, 46 52"/>
        <path d="M85 35 C 92 38, 96 45, 94 52"/>
        <path d="M52 55 C 46 57, 43 63, 46 68"/>
        <path d="M88 55 C 94 57, 97 63, 94 68"/>
      </g>
      <circle cx="70" cy="52" r="22" stroke="#C9A24B" stroke-width="1.5" fill="#0B3D2E"/>
      <text x="70" y="60" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-size="24" fill="#C9A24B">V</text>
    </svg>

    <p class="text-xs tracking-[0.6em] uppercase text-[#C9A24B] mb-10">You Are Cordially Invited</p>
    <h1 class="display text-8xl text-white leading-[1.05] mb-10">{{event_name}}</h1>

    <div class="flex items-center gap-4 mb-10">
      <div class="w-16 h-px bg-[#C9A24B]"></div>
      <div class="w-2 h-2 rotate-45 bg-[#C9A24B]"></div>
      <div class="w-16 h-px bg-[#C9A24B]"></div>
    </div>

    <p class="display text-3xl text-[#C9A24B] mb-3">{{event_date}}</p>
    <p class="text-sm uppercase tracking-[0.3em] text-white/60 mb-4">{{venue}}</p>
    <div class="w-10 h-px bg-white/20 mb-4"></div>
    <p class="text-xs uppercase tracking-[0.4em] text-white/40">{{dress_code}}</p>
  </div>
</body>
</html>$html$
WHERE title = 'Black-Tie Gala Invitation' AND is_preset = TRUE;

-- 5. Annual Report Cover — full-bleed layered data-art background (not
--    just a bottom strip), KPI chips for information density.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#101B33] w-[1200px] h-[1600px] m-0 relative overflow-hidden">
  <svg class="absolute inset-0" width="1200" height="1600" viewBox="0 0 1200 1600" fill="none" preserveAspectRatio="none">
    <path d="M0 1200 L150 1100 L300 1150 L450 950 L600 1020 L750 800 L900 880 L1050 650 L1200 720 L1200 1600 L0 1600 Z" fill="url(#g1)"/>
    <path d="M0 1000 L150 1050 L300 900 L450 950 L600 800 L750 850 L900 700 L1050 750 L1200 600 L1200 1600 L0 1600 Z" fill="url(#g2)"/>
    <path d="M0 900 L200 850 L400 800 L600 700 L800 620 L1000 550 L1200 480" stroke="#C9A24B" stroke-width="2" opacity="0.4" fill="none"/>
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C9A24B" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#C9A24B" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4C6FFF" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#4C6FFF" stop-opacity="0"/>
      </linearGradient>
    </defs>
  </svg>

  <div class="relative h-full flex flex-col justify-between p-20">
    <div class="flex items-center justify-between">
      <span class="text-white/70 text-sm font-medium">{{company_name}}</span>
      <span class="text-[#C9A24B] text-xs uppercase tracking-[0.3em]">Annual Report</span>
    </div>

    <div>
      <p class="text-[220px] font-black text-white leading-none mb-6">{{report_year}}</p>
      <div class="w-24 h-1 bg-[#C9A24B] mb-8"></div>
      <p class="text-2xl text-white/60 max-w-lg mb-14">{{tagline}}</p>

      <div class="flex items-center gap-10">
        <div>
          <p class="text-3xl font-bold text-white">{{kpi_1_value}}</p>
          <p class="text-xs uppercase tracking-widest text-white/40 mt-1">{{kpi_1_label}}</p>
        </div>
        <div class="w-px h-10 bg-white/10"></div>
        <div>
          <p class="text-3xl font-bold text-white">{{kpi_2_value}}</p>
          <p class="text-xs uppercase tracking-widest text-white/40 mt-1">{{kpi_2_label}}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>$html$,
    default_variables = '{"company_name": "Visora Inc.", "report_year": "2026", "tagline": "A year of rendering the internet''s images, one pixel at a time.", "kpi_1_value": "1.2M", "kpi_1_label": "Renders / day", "kpi_2_value": "89ms", "kpi_2_label": "Avg. render time"}'::jsonb
WHERE title = 'Annual Report Cover' AND is_preset = TRUE;

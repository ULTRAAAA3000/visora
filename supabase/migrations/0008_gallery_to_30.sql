-- Visora — gallery expansion to 30 presets: 6 new free, 4 new pro,
-- and 5 new Agency-exclusive (tier = 'agency', gated per migration 0007).

-- ============= FREE (6) =============

INSERT INTO public.templates (user_id, is_preset, tier, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL, TRUE, 'free',
  'Newsletter Header',
  'newsletter',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600&family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Source Serif 4', serif; }
  </style>
</head>
<body class="bg-[#FAF3E8] w-[1200px] h-[400px] m-0 p-16 relative overflow-hidden">
  <div class="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#1F5C56]/10 -translate-y-1/3 translate-x-1/4"></div>

  <div class="relative h-full flex flex-col justify-between">
    <div class="flex items-center justify-between">
      <span class="serif text-2xl text-[#241F1A] font-semibold">{{newsletter_name}}</span>
      <span class="bg-[#1F5C56] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">
        Issue &#35;{{issue_number}}
      </span>
    </div>

    <div>
      <h1 class="serif text-5xl text-[#241F1A] leading-tight max-w-3xl mb-3">{{headline}}</h1>
      <p class="text-sm uppercase tracking-[0.2em] text-[#241F1A]/50">{{date}}</p>
    </div>
  </div>
</body>
</html>$html$,
  '{"newsletter_name": "The Weekly Ship", "issue_number": "42", "headline": "How we cut render time from 800ms to 89ms", "date": "August 5, 2026"}'::jsonb,
  1200, 400
),
(
  NULL, TRUE, 'free',
  'App Promo Banner',
  'app',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gradient-to-br from-[#6D28D9] to-[#2563EB] w-[1200px] h-[630px] m-0 relative overflow-hidden">
  <div class="absolute inset-0 flex items-center">
    <div class="w-3/5 pl-20 pr-8">
      <span class="inline-block bg-white/15 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-6">
        New App
      </span>
      <h1 class="text-6xl font-black text-white leading-[1.05] mb-6">{{app_name}}</h1>
      <p class="text-xl text-white/80 mb-10 max-w-md">{{tagline}}</p>
      <span class="inline-block bg-white text-[#2563EB] font-bold px-8 py-3.5 rounded-full">{{cta_text}}</span>
    </div>

    <div class="w-2/5 flex items-center justify-center">
      <div class="w-56 h-[420px] rounded-[40px] border-[6px] border-white/90 bg-white/10 relative shadow-2xl">
        <div class="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-black/40"></div>
      </div>
    </div>
  </div>
</body>
</html>$html$,
  '{"app_name": "Visora Mobile", "tagline": "Generate on-brand images from your phone, in seconds.", "cta_text": "Download Free"}'::jsonb,
  1200, 630
),
(
  NULL, TRUE, 'free',
  'Recipe Card',
  'food',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
  </style>
</head>
<body class="bg-[#C1663D] w-[1080px] h-[1350px] m-0 flex items-center justify-center p-16">
  <div class="w-full h-full bg-[#FBF3E9] rounded-[32px] shadow-2xl p-14 flex flex-col justify-between">
    <div>
      <p class="text-xs uppercase tracking-[0.3em] text-[#7A8B6F] font-bold mb-4">Recipe</p>
      <h1 class="display text-6xl text-[#3a2a1f] leading-tight mb-8">{{dish_name}}</h1>
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2 text-sm text-[#7A8B6F] font-semibold">&#9201; {{prep_time}}</span>
        <span class="flex items-center gap-2 text-sm text-[#7A8B6F] font-semibold">&#127860; {{servings}} servings</span>
      </div>
    </div>

    <div class="w-full h-64 rounded-2xl bg-[#C1663D]/15 border border-[#C1663D]/25"></div>

    <p class="text-sm uppercase tracking-[0.2em] text-[#7A8B6F]">Recipe by {{chef_name}}</p>
  </div>
</body>
</html>$html$,
  '{"dish_name": "Brown Butter Pasta", "prep_time": "25 min", "servings": "4", "chef_name": "Visora Kitchen"}'::jsonb,
  1080, 1350
),
(
  NULL, TRUE, 'free',
  'Conference Speaker Card',
  'event',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#0F1B2D] w-[1200px] h-[630px] m-0 p-16 relative overflow-hidden">
  <div class="absolute inset-0" style="background: radial-gradient(600px circle at 90% 10%, rgba(56,189,248,0.18), transparent 60%);"></div>

  <div class="relative h-full flex items-center gap-14">
    <div class="w-40 h-40 rounded-full bg-gradient-to-br from-[#38BDF8]/30 to-transparent border-2 border-[#38BDF8]/40 shrink-0"></div>

    <div>
      <span class="inline-block bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-6 border border-[#38BDF8]/30">
        {{conference_name}}
      </span>
      <h1 class="text-5xl font-black text-white leading-tight mb-4">{{speaker_name}}</h1>
      <p class="text-lg text-white/60 mb-6">{{speaker_title}}</p>
      <p class="text-2xl text-[#38BDF8] font-medium">&#8220;{{talk_title}}&#8221;</p>
    </div>
  </div>
</body>
</html>$html$,
  '{"speaker_name": "Dana Whitfield", "speaker_title": "Head of Engineering, Visora", "talk_title": "Rendering at the edge: lessons from 10M images", "conference_name": "EdgeConf 2026"}'::jsonb,
  1200, 630
),
(
  NULL, TRUE, 'free',
  'Testimonial Card',
  'social',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital@1&family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
  </style>
</head>
<body class="bg-[#F1EDFB] w-[1080px] h-[1080px] m-0 flex items-center justify-center p-20">
  <div class="w-full h-full bg-white rounded-[40px] shadow-xl flex flex-col items-center justify-center text-center px-20">
    <div class="flex gap-1 mb-8 text-[#F5B301] text-2xl">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
    <p class="display italic text-4xl text-[#3B2E5A] leading-snug mb-12">&#8220;{{quote_text}}&#8221;</p>
    <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#3B2E5A] to-[#8B7BC7] mb-4"></div>
    <p class="font-bold text-[#3B2E5A]">{{customer_name}}</p>
    <p class="text-sm text-[#3B2E5A]/60">{{customer_role}}</p>
  </div>
</body>
</html>$html$,
  '{"quote_text": "We replaced three tools with one Visora API call. Our OG images finally match our brand.", "customer_name": "Priya Nair", "customer_role": "Head of Growth, Loopline"}'::jsonb,
  1080, 1080
),
(
  NULL, TRUE, 'free',
  'Resume Header Banner',
  'resume',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#1C1C1C] w-[1200px] h-[400px] m-0 p-16 relative overflow-hidden">
  <div class="absolute bottom-0 left-0 right-0 h-1 bg-[#14B8A6]"></div>

  <div class="h-full flex flex-col justify-center">
    <h1 class="text-6xl font-black text-white mb-3">{{full_name}}</h1>
    <p class="text-xl text-[#14B8A6] font-medium mb-8">{{role_title}}</p>
    <div class="flex items-center gap-6 text-white/50 text-sm">
      <span>{{email}}</span>
      <span class="w-1 h-1 rounded-full bg-white/30"></span>
      <span>{{location}}</span>
    </div>
  </div>
</body>
</html>$html$,
  '{"full_name": "Alex Morgan", "role_title": "Senior Product Designer", "email": "alex@morgan.design", "location": "Berlin, Germany"}'::jsonb,
  1200, 400
);

-- ============= PRO (4) =============

INSERT INTO public.templates (user_id, is_preset, tier, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL, TRUE, 'pro',
  'Movie / Book Cover',
  'media',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
  </style>
</head>
<body class="bg-gradient-to-b from-[#2b0a12] to-[#0a0505] w-[1000px] h-[1500px] m-0 flex flex-col justify-between p-16 relative overflow-hidden">
  <div class="absolute inset-0" style="background: radial-gradient(700px circle at 50% 0%, rgba(122,17,40,0.4), transparent 60%);"></div>

  <div class="relative flex justify-between items-start">
    <span class="border border-[#D4AF37] text-[#D4AF37] text-xs uppercase tracking-widest px-3 py-1.5 rounded-full">{{rating}}</span>
  </div>

  <div class="relative text-center">
    <h1 class="display text-8xl font-black text-white leading-[0.95] mb-6">{{title}}</h1>
    <p class="text-lg text-white/60 italic">{{tagline}}</p>
  </div>

  <p class="relative text-center text-sm uppercase tracking-[0.3em] text-[#D4AF37]">{{author_or_cast}}</p>
</body>
</html>$html$,
  '{"title": "The Last Render", "tagline": "Every pixel tells a story.", "author_or_cast": "A Visora Studios Original", "rating": "R"}'::jsonb,
  1000, 1500
),
(
  NULL, TRUE, 'pro',
  'Crypto Stat Card',
  'finance',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#0B0F14] w-[1080px] h-[1080px] m-0 p-16 relative overflow-hidden">
  <div class="h-full flex flex-col justify-between">
    <div class="flex items-center justify-between">
      <span class="text-white text-2xl font-bold">{{ticker}}</span>
      <span class="text-white/40 text-sm">{{timeframe}}</span>
    </div>

    <div>
      <p class="text-8xl font-black text-white mb-4">{{price}}</p>
      <span class="inline-flex items-center gap-2 text-2xl font-bold text-[#22D3A5]">&#9650; {{change_pct}}</span>
    </div>

    <svg width="100%" height="120" viewBox="0 0 900 120" fill="none" preserveAspectRatio="none">
      <path d="M0 100 L100 80 L200 90 L300 50 L400 60 L500 30 L600 45 L700 15 L800 25 L900 5" stroke="#22D3A5" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</body>
</html>$html$,
  '{"ticker": "VSRA / USD", "price": "$4.82", "change_pct": "12.4%", "timeframe": "Last 24h"}'::jsonb,
  1080, 1080
),
(
  NULL, TRUE, 'pro',
  'Webinar Promo Banner',
  'marketing',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gradient-to-br from-[#312E81] to-[#7C3AED] w-[1200px] h-[630px] m-0 p-16 relative overflow-hidden">
  <div class="absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-white/5"></div>

  <div class="h-full flex flex-col justify-between relative">
    <span class="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full w-fit">
      <span class="w-2 h-2 rounded-full bg-red-400"></span> Live Webinar
    </span>

    <div>
      <h1 class="text-5xl font-extrabold text-white leading-tight max-w-3xl mb-4">{{webinar_title}}</h1>
      <p class="text-lg text-white/70">{{date_time}}</p>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-white/70 text-sm">with {{host_names}}</p>
      <span class="bg-white text-[#312E81] font-bold px-6 py-3 rounded-full text-sm">{{registration_cta}}</span>
    </div>
  </div>
</body>
</html>$html$,
  '{"webinar_title": "Scaling image rendering to millions of requests", "date_time": "Aug 20, 2026 · 5:00 PM UTC", "host_names": "Visora Engineering", "registration_cta": "Save Your Seat"}'::jsonb,
  1200, 630
),
(
  NULL, TRUE, 'pro',
  'Fitness Challenge Card',
  'fitness',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#14110F] w-[1080px] h-[1350px] m-0 p-16 relative overflow-hidden">
  <div class="absolute inset-0" style="background: radial-gradient(600px circle at 100% 0%, rgba(249,115,22,0.25), transparent 60%);"></div>

  <div class="relative h-full flex flex-col justify-between">
    <p class="text-sm uppercase tracking-[0.3em] text-[#F97316] font-bold">{{challenge_name}}</p>

    <div>
      <p class="text-9xl font-black text-white leading-none mb-2">{{day_current}}<span class="text-4xl text-white/40">/{{day_total}}</span></p>
      <p class="text-xl text-white/60">Day of the challenge</p>
    </div>

    <div>
      <div class="h-3 rounded-full bg-white/10 overflow-hidden mb-4">
        <div class="h-full bg-[#F97316] rounded-full" style="width: 40%"></div>
      </div>
      <p class="text-sm uppercase tracking-widest text-white/50">{{participant_name}}</p>
    </div>
  </div>
</body>
</html>$html$,
  '{"challenge_name": "30-Day Build Challenge", "day_current": "12", "day_total": "30", "participant_name": "Jordan Blake"}'::jsonb,
  1080, 1350
);

-- ============= AGENCY EXCLUSIVE (5) =============
-- Highest design effort in the gallery: layered gradients, foil accents,
-- glassmorphism, ornamental crests — reserved for the Agency plan and
-- gated so 'pro' does NOT unlock these (see migration 0007).

INSERT INTO public.templates (user_id, is_preset, tier, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL, TRUE, 'agency',
  'Luxury Product Launch',
  'luxury',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Cormorant Garamond', serif; }
    .noise {
      background-image: radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px);
      background-size: 3px 3px;
    }
  </style>
</head>
<body class="noise bg-[#0A0A0A] w-[1600px] h-[900px] m-0 relative overflow-hidden flex items-center justify-center">
  <div class="absolute inset-0" style="background: radial-gradient(900px circle at 50% 50%, rgba(212,175,55,0.16), transparent 65%);"></div>
  <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"></div>
  <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"></div>

  <div class="relative text-center px-20">
    <p class="text-[11px] tracking-[0.6em] uppercase text-[#D4AF37] mb-10">Now Available</p>
    <h1 class="display text-[130px] leading-[0.95] text-white mb-8">{{product_name}}</h1>
    <div class="flex items-center justify-center gap-4 mb-10">
      <div class="w-16 h-px bg-[#D4AF37]"></div>
      <div class="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]"></div>
      <div class="w-16 h-px bg-[#D4AF37]"></div>
    </div>
    <p class="text-lg text-white/50 tracking-wide mb-2">{{tagline}}</p>
    <p class="text-xs uppercase tracking-[0.4em] text-[#D4AF37]/80">{{release_date}}</p>
  </div>
</body>
</html>$html$,
  '{"product_name": "Aurum", "tagline": "Precision, redefined.", "release_date": "Arriving September 2026"}'::jsonb,
  1600, 900
),
(
  NULL, TRUE, 'agency',
  'Premium Magazine Cover',
  'magazine',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;900&family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
  </style>
</head>
<body class="bg-white w-[1000px] h-[1300px] m-0 p-10 relative overflow-hidden">
  <div class="w-full h-full border border-[#0C0C0C] relative flex flex-col">
    <div class="flex items-center justify-between px-8 pt-6">
      <span class="text-[10px] uppercase tracking-widest text-[#0C0C0C]/60">{{issue_date}}</span>
      <span class="text-[10px] uppercase tracking-widest text-[#0C0C0C]/60">Collector's Edition</span>
    </div>

    <h1 class="display text-[110px] text-center text-[#0C0C0C] leading-none mt-6 mb-6">{{magazine_name}}</h1>

    <div class="flex-1 mx-8 bg-[#E11D48]/6 border border-[#0C0C0C]/10 relative">
      <p class="absolute top-6 left-6 text-xs uppercase tracking-widest text-[#E11D48] font-bold max-w-[160px]">{{coverline_1}}</p>
      <p class="absolute top-6 right-6 text-xs uppercase tracking-widest text-[#0C0C0C]/70 font-bold max-w-[160px] text-right">{{coverline_2}}</p>
      <h2 class="absolute bottom-8 left-8 right-8 text-4xl font-black text-[#0C0C0C] leading-tight">{{cover_headline}}</h2>
    </div>

    <div class="flex items-center justify-between px-8 py-5">
      <div class="flex gap-[3px] items-end h-6">
        <div class="w-[3px] h-full bg-[#0C0C0C]"></div>
        <div class="w-[3px] h-4 bg-[#0C0C0C]"></div>
        <div class="w-[3px] h-full bg-[#0C0C0C]"></div>
        <div class="w-[3px] h-3 bg-[#0C0C0C]"></div>
        <div class="w-[3px] h-full bg-[#0C0C0C]"></div>
      </div>
      <span class="text-[10px] uppercase tracking-widest text-[#0C0C0C]/50">visora.io</span>
    </div>
  </div>
</body>
</html>$html$,
  '{"magazine_name": "RENDER", "cover_headline": "Inside the API doing 10M images a day", "issue_date": "Issue 12 — Aug 2026", "coverline_1": "The Chromium Advantage", "coverline_2": "Design Systems At Scale"}'::jsonb,
  1000, 1300
),
(
  NULL, TRUE, 'agency',
  'Keynote Announcement',
  'event',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .glass {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.12);
    }
  </style>
</head>
<body class="bg-[#0B1120] w-[1600px] h-[900px] m-0 relative overflow-hidden flex items-center justify-center">
  <div class="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full" style="background: radial-gradient(circle, rgba(45,212,191,0.35), transparent 70%); filter: blur(20px);"></div>
  <div class="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full" style="background: radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%); filter: blur(20px);"></div>
  <div class="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full" style="background: radial-gradient(circle, rgba(244,114,182,0.25), transparent 70%); filter: blur(20px);"></div>

  <div class="glass relative rounded-[36px] px-24 py-16 text-center max-w-4xl">
    <p class="text-xs uppercase tracking-[0.4em] text-white/50 mb-8">{{event_name}} &middot; {{event_date}}</p>
    <h1 class="text-7xl font-black text-white leading-tight mb-8">{{speaker_name}}</h1>
    <p class="text-2xl text-white/70 font-medium">{{keynote_title}}</p>
  </div>
</body>
</html>$html$,
  '{"speaker_name": "Mei Tanaka", "keynote_title": "Designing infrastructure that disappears", "event_name": "Visora Summit", "event_date": "Oct 3, 2026"}'::jsonb,
  1600, 900
),
(
  NULL, TRUE, 'agency',
  'Black-Tie Gala Invitation',
  'invitation',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Cormorant Garamond', serif; }
  </style>
</head>
<body class="bg-[#0B3D2E] w-[1200px] h-[1600px] m-0 relative overflow-hidden">
  <div class="absolute inset-[40px] border-2 border-[#C9A24B]"></div>
  <div class="absolute inset-[52px] border border-[#C9A24B]/50"></div>

  <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-24">
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" class="mb-10">
      <circle cx="40" cy="40" r="38" stroke="#C9A24B" stroke-width="1.5"/>
      <text x="40" y="50" text-anchor="middle" font-family="'Cormorant Garamond', serif" font-size="28" fill="#C9A24B">V</text>
    </svg>

    <p class="text-xs tracking-[0.6em] uppercase text-[#C9A24B] mb-10">You Are Cordially Invited</p>
    <h1 class="display text-8xl text-white leading-[1.05] mb-10">{{event_name}}</h1>

    <div class="flex items-center gap-4 mb-10">
      <div class="w-16 h-px bg-[#C9A24B]"></div>
      <div class="w-2 h-2 rotate-45 bg-[#C9A24B]"></div>
      <div class="w-16 h-px bg-[#C9A24B]"></div>
    </div>

    <p class="display text-3xl text-[#C9A24B] mb-3">{{event_date}}</p>
    <p class="text-sm uppercase tracking-[0.3em] text-white/60 mb-16">{{venue}}</p>
    <p class="text-xs uppercase tracking-[0.4em] text-white/40">{{dress_code}}</p>
  </div>
</body>
</html>$html$,
  '{"event_name": "The Visora Gala", "event_date": "December 12, 2026", "venue": "The Grand Atrium, New York", "dress_code": "Black Tie"}'::jsonb,
  1200, 1600
),
(
  NULL, TRUE, 'agency',
  'Annual Report Cover',
  'corporate',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#101B33] w-[1200px] h-[1600px] m-0 p-20 relative overflow-hidden">
  <svg class="absolute bottom-0 left-0 right-0 opacity-40" width="1200" height="500" viewBox="0 0 1200 500" fill="none" preserveAspectRatio="none">
    <path d="M0 400 L150 320 L300 360 L450 220 L600 260 L750 140 L900 180 L1050 60 L1200 100 L1200 500 L0 500 Z" fill="url(#g1)"/>
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C9A24B" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#C9A24B" stop-opacity="0"/>
      </linearGradient>
    </defs>
  </svg>

  <div class="relative h-full flex flex-col justify-between">
    <div class="flex items-center justify-between">
      <span class="text-white/70 text-sm font-medium">{{company_name}}</span>
      <span class="text-[#C9A24B] text-xs uppercase tracking-[0.3em]">Annual Report</span>
    </div>

    <div>
      <p class="text-[200px] font-black text-white leading-none mb-6">{{report_year}}</p>
      <div class="w-24 h-1 bg-[#C9A24B] mb-8"></div>
      <p class="text-2xl text-white/60 max-w-lg">{{tagline}}</p>
    </div>
  </div>
</body>
</html>$html$,
  '{"company_name": "Visora Inc.", "report_year": "2026", "tagline": "A year of rendering the internet''s images, one pixel at a time."}'::jsonb,
  1200, 1600
);

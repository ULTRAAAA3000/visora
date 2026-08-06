-- Visora — design pass #2: lift the flattest presets to the same bar as
-- the rest of the gallery (roadmap item 2). Matches by title, no dupes.

-- Newsletter Header — was flat cream + one soft circle; adds a ruled
-- underline device and a second layered circle for depth.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Source Serif 4', serif; }
  </style>
</head>
<body class="bg-[#FAF3E8] w-[1200px] h-[400px] m-0 p-16 relative overflow-hidden">
  <div class="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#1F5C56]/10 -translate-y-1/3 translate-x-1/4"></div>
  <div class="absolute top-10 right-24 w-24 h-24 rounded-full border border-[#1F5C56]/20"></div>
  <div class="absolute bottom-0 left-0 w-1.5 h-full bg-[#1F5C56]"></div>

  <div class="relative h-full flex flex-col justify-between pl-6">
    <div class="flex items-center justify-between">
      <span class="serif text-2xl text-[#241F1A] font-semibold">{{newsletter_name}}</span>
      <span class="bg-[#1F5C56] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">
        Issue &#35;{{issue_number}}
      </span>
    </div>

    <div>
      <div class="w-14 h-[3px] bg-[#1F5C56] mb-5"></div>
      <h1 class="serif text-5xl text-[#241F1A] leading-tight max-w-3xl mb-3">{{headline}}</h1>
      <p class="text-sm uppercase tracking-[0.2em] text-[#241F1A]/50">{{date}}</p>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Newsletter Header' AND is_preset = TRUE;

-- Resume Header Banner — was single accent line + flat text stack; adds a
-- subtle initials monogram block for visual anchor.
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
<body class="bg-[#1C1C1C] w-[1200px] h-[400px] m-0 p-16 relative overflow-hidden">
  <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#14B8A6] via-[#14B8A6]/40 to-transparent"></div>
  <div class="absolute inset-0" style="background: radial-gradient(500px circle at 95% 0%, rgba(20,184,166,0.12), transparent 60%);"></div>

  <div class="relative h-full flex items-center gap-10">
    <div class="w-24 h-24 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center shrink-0">
      <span class="text-3xl font-black text-[#14B8A6]">{{initials}}</span>
    </div>

    <div>
      <h1 class="text-6xl font-black text-white mb-3">{{full_name}}</h1>
      <p class="text-xl text-[#14B8A6] font-medium mb-8">{{role_title}}</p>
      <div class="flex items-center gap-6 text-white/50 text-sm">
        <span>{{email}}</span>
        <span class="w-1 h-1 rounded-full bg-white/30"></span>
        <span>{{location}}</span>
      </div>
    </div>
  </div>
</body>
</html>$html$,
    default_variables = '{"full_name": "Alex Morgan", "role_title": "Senior Product Designer", "email": "alex@morgan.design", "location": "Berlin, Germany", "initials": "AM"}'::jsonb
WHERE title = 'Resume Header Banner' AND is_preset = TRUE;

-- App Promo Banner — phone silhouette was a bare rounded rect; adds a
-- mini app-icon grid inside the "screen" and a soft glow behind it.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
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

    <div class="w-2/5 flex items-center justify-center relative">
      <div class="absolute w-72 h-72 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative w-56 h-[420px] rounded-[40px] border-[6px] border-white/90 bg-[#1e1147]/60 shadow-2xl overflow-hidden">
        <div class="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-black/40 z-10"></div>
        <div class="grid grid-cols-3 gap-3 p-6 pt-10">
          <div class="aspect-square rounded-xl bg-white/25"></div>
          <div class="aspect-square rounded-xl bg-white/15"></div>
          <div class="aspect-square rounded-xl bg-white/20"></div>
          <div class="aspect-square rounded-xl bg-white/15"></div>
          <div class="aspect-square rounded-xl bg-white/25"></div>
          <div class="aspect-square rounded-xl bg-white/15"></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'App Promo Banner' AND is_preset = TRUE;

-- Job Opening Card — flat two-tone split; adds a subtle dot-grid texture
-- to the dark block so it's not a completely flat fill.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .split { clip-path: polygon(38% 0, 100% 0, 100% 100%, 0% 100%); }
    .dotgrid { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 22px 22px; }
  </style>
</head>
<body class="bg-[#F4F1EA] w-[1200px] h-[630px] m-0 relative overflow-hidden">
  <div class="split dotgrid absolute inset-0 bg-[#14140F]"></div>

  <div class="absolute inset-0 flex">
    <div class="w-[38%] flex flex-col justify-center pl-16 pr-8">
      <span class="inline-block bg-[#FFB238] text-[#14140F] text-xs font-black uppercase tracking-wider px-4 py-2 rounded-full w-fit mb-6">
        {{employment_type}}
      </span>
      <p class="text-sm uppercase tracking-[0.2em] text-[#14140F]/60">We're hiring</p>
    </div>

    <div class="flex-1 flex flex-col justify-center pl-16 pr-20">
      <h1 class="text-6xl font-black text-white leading-[1.05] mb-6">{{job_title}}</h1>
      <p class="text-2xl text-white/70 font-medium">{{company_name}} &middot; {{location}}</p>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Job Opening Card' AND is_preset = TRUE;

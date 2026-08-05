-- Visora — design pass on the preset gallery.
--
-- The original 15 presets (0003/0004/0005) were functionally correct but
-- visually thin: flat background + centered text, little to distinguish
-- one category from another. This migration replaces each html_body with
-- a template that has an actual design system (named palette, deliberate
-- type pairing, one signature visual device tied to the subject) instead
-- of reaching for the same black-or-white-box-with-text default every time.
--
-- Matches existing rows by title, so no duplicate presets are created.

-- 1. Certificate of Completion — cream/forest/gold, ornate frame with
--    corner flourishes and a wax-seal-style badge.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,600&family=Inter:wght@400;500;600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
  </style>
</head>
<body class="bg-[#FBF7EF] w-[1600px] h-[1131px] m-0 p-0 relative overflow-hidden">
  <div class="absolute inset-[36px] border-[3px] border-[#16342B]"></div>
  <div class="absolute inset-[46px] border border-[#C9A24B]"></div>

  <svg class="absolute top-[46px] left-[46px]" width="90" height="90" viewBox="0 0 90 90" fill="none">
    <path d="M2 88 Q2 2 88 2" stroke="#C9A24B" stroke-width="2" fill="none"/>
    <circle cx="2" cy="88" r="4" fill="#C9A24B"/>
  </svg>
  <svg class="absolute top-[46px] right-[46px] scale-x-[-1]" width="90" height="90" viewBox="0 0 90 90" fill="none">
    <path d="M2 88 Q2 2 88 2" stroke="#C9A24B" stroke-width="2" fill="none"/>
    <circle cx="2" cy="88" r="4" fill="#C9A24B"/>
  </svg>
  <svg class="absolute bottom-[46px] left-[46px] scale-y-[-1]" width="90" height="90" viewBox="0 0 90 90" fill="none">
    <path d="M2 88 Q2 2 88 2" stroke="#C9A24B" stroke-width="2" fill="none"/>
    <circle cx="2" cy="88" r="4" fill="#C9A24B"/>
  </svg>
  <svg class="absolute bottom-[46px] right-[46px] scale-[-1]" width="90" height="90" viewBox="0 0 90 90" fill="none">
    <path d="M2 88 Q2 2 88 2" stroke="#C9A24B" stroke-width="2" fill="none"/>
    <circle cx="2" cy="88" r="4" fill="#C9A24B"/>
  </svg>

  <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-40">
    <p class="text-xs tracking-[0.5em] uppercase text-[#C9A24B] mb-8">Certificate of Completion</p>
    <p class="display italic text-2xl text-[#16342B] mb-3">This certifies that</p>
    <h1 class="display text-7xl text-[#16342B] mb-8 px-10 pb-4 border-b border-[#C9A24B]">{{recipient_name}}</h1>
    <p class="text-lg text-[#3a3a3a] max-w-2xl mb-3">has successfully completed the course</p>
    <h2 class="display italic text-4xl text-[#16342B] mb-16">{{course_title}}</h2>

    <div class="flex items-end gap-28 mt-auto">
      <div class="text-center">
        <p class="display text-xl text-[#16342B] border-t border-dotted border-[#8a8a8a] pt-2 px-10">{{issue_date}}</p>
        <p class="text-[10px] uppercase tracking-[0.3em] text-[#8a8a8a] mt-1">Date</p>
      </div>

      <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#C9A24B] to-[#8a6b2c] flex items-center justify-center shadow-lg -mb-6">
        <div class="w-20 h-20 rounded-full border-2 border-[#FBF7EF] flex items-center justify-center">
          <span class="display text-[#FBF7EF] text-xs tracking-widest">V &#9670; A</span>
        </div>
      </div>

      <div class="text-center">
        <p class="display text-xl text-[#16342B] border-t border-dotted border-[#8a8a8a] pt-2 px-10">{{issuer_name}}</p>
        <p class="text-[10px] uppercase tracking-[0.3em] text-[#8a8a8a] mt-1">Issued by</p>
      </div>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Certificate of Completion' AND is_preset = TRUE;

-- 2. Social Quote Card — paper + diagonal ink-blue block, oversized quote glyph.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
    .diagonal { clip-path: polygon(0 38%, 100% 0%, 100% 100%, 0% 100%); }
  </style>
</head>
<body class="bg-[#F3EEE4] w-[1080px] h-[1080px] m-0 relative overflow-hidden">
  <div class="diagonal absolute inset-0 bg-[#16233F]"></div>
  <span class="display absolute top-16 left-16 text-[220px] leading-none text-[#FF6B4A] select-none">&#8220;</span>

  <div class="absolute inset-0 flex flex-col justify-end p-24 pb-28">
    <h1 class="display text-6xl leading-[1.15] text-white font-semibold max-w-3xl mb-16">{{quote_text}}</h1>
    <div class="flex items-center gap-4">
      <div class="w-10 h-[2px] bg-[#FF6B4A]"></div>
      <p class="text-lg text-white/80 tracking-wide">{{author_name}}</p>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Social Quote Card' AND is_preset = TRUE;

-- 3. E-commerce Product Banner — cream/coral, tilted product frame, die-cut price ticket.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;800&family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
    .ticket { position: relative; }
    .ticket::before {
      content: ''; position: absolute; right: -14px; top: 50%; transform: translateY(-50%);
      width: 28px; height: 28px; background: #FFF6EA; border-radius: 999px;
    }
  </style>
</head>
<body class="bg-[#FFF6EA] w-[1200px] h-[630px] m-0 p-16 relative overflow-hidden">
  <div class="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-[#FF5A36]/10"></div>
  <div class="absolute right-40 bottom-0 w-40 h-40 rounded-full bg-[#FF5A36]/10"></div>

  <div class="w-full h-full flex gap-14 items-center relative">
    <div class="relative w-[440px] h-[440px] shrink-0">
      <div class="absolute inset-0 rounded-3xl bg-[#1B1B1B]/10 rotate-3"></div>
      <img src="{{image_url}}" class="relative w-full h-full object-cover rounded-3xl -rotate-2 shadow-2xl border-4 border-white" />
      <div class="absolute -top-4 -left-4 bg-[#1B1B1B] text-white text-xs font-bold px-4 py-2 rounded-full -rotate-6 shadow-lg">
        {{discount}}
      </div>
    </div>

    <div class="flex-1 flex flex-col justify-between h-full py-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-[#FF5A36] font-bold mb-4">New Arrival</p>
        <h1 class="display text-5xl font-extrabold text-[#1B1B1B] leading-tight mb-2">{{title}}</h1>
      </div>

      <div class="flex items-center gap-0">
        <div class="ticket bg-[#1B1B1B] text-white px-8 py-5 rounded-l-2xl">
          <p class="text-4xl font-black">{{price}}</p>
        </div>
        <div class="bg-[#FFF6EA] border-2 border-dashed border-[#1B1B1B]/20 px-6 py-5 rounded-r-2xl">
          <p class="text-lg text-[#8a8a8a] line-through font-bold">{{old_price}}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'E-commerce Product Banner' AND is_preset = TRUE;

-- 4. Event Invitation — midnight/gold, art-deco fan corners.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Cormorant Garamond', serif; }
  </style>
</head>
<body class="bg-[#171422] w-[1080px] h-[1350px] m-0 relative overflow-hidden">
  <svg class="absolute top-0 left-0" width="220" height="220" viewBox="0 0 220 220" fill="none">
    <g stroke="#D4AF7A" stroke-width="1" opacity="0.7">
      <path d="M0 40 Q100 40 100 140"/>
      <path d="M0 70 Q80 70 80 160"/>
      <path d="M0 100 Q60 100 60 180"/>
      <path d="M0 0 L0 220 L220 220" stroke-width="2"/>
    </g>
  </svg>
  <svg class="absolute top-0 right-0 scale-x-[-1]" width="220" height="220" viewBox="0 0 220 220" fill="none">
    <g stroke="#D4AF7A" stroke-width="1" opacity="0.7">
      <path d="M0 40 Q100 40 100 140"/>
      <path d="M0 70 Q80 70 80 160"/>
      <path d="M0 100 Q60 100 60 180"/>
      <path d="M0 0 L0 220 L220 220" stroke-width="2"/>
    </g>
  </svg>
  <svg class="absolute bottom-0 left-0 scale-y-[-1]" width="220" height="220" viewBox="0 0 220 220" fill="none">
    <g stroke="#D4AF7A" stroke-width="1" opacity="0.7">
      <path d="M0 40 Q100 40 100 140"/>
      <path d="M0 70 Q80 70 80 160"/>
      <path d="M0 100 Q60 100 60 180"/>
      <path d="M0 0 L0 220 L220 220" stroke-width="2"/>
    </g>
  </svg>
  <svg class="absolute bottom-0 right-0 scale-[-1]" width="220" height="220" viewBox="0 0 220 220" fill="none">
    <g stroke="#D4AF7A" stroke-width="1" opacity="0.7">
      <path d="M0 40 Q100 40 100 140"/>
      <path d="M0 70 Q80 70 80 160"/>
      <path d="M0 100 Q60 100 60 180"/>
      <path d="M0 0 L0 220 L220 220" stroke-width="2"/>
    </g>
  </svg>

  <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-24">
    <p class="text-xs tracking-[0.5em] uppercase text-[#C98B90] mb-8">You're Invited</p>
    <h1 class="display text-7xl text-white leading-tight mb-10">{{event_name}}</h1>

    <div class="flex items-center gap-4 mb-10">
      <div class="w-16 h-px bg-[#D4AF7A]"></div>
      <div class="w-2 h-2 rotate-45 bg-[#D4AF7A]"></div>
      <div class="w-16 h-px bg-[#D4AF7A]"></div>
    </div>

    <p class="display text-3xl text-[#D4AF7A] mb-3">{{event_date}}</p>
    <p class="text-sm uppercase tracking-[0.3em] text-white/60 mb-20">{{event_location}}</p>
    <p class="text-xs uppercase tracking-[0.4em] text-[#C98B90]">Hosted by {{host_name}}</p>
  </div>
</body>
</html>$html$
WHERE title = 'Event Invitation' AND is_preset = TRUE;

-- 5. Job Opening Card — cream/ink diagonal split, amber tag.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .split { clip-path: polygon(38% 0, 100% 0, 100% 100%, 0% 100%); }
  </style>
</head>
<body class="bg-[#F4F1EA] w-[1200px] h-[630px] m-0 relative overflow-hidden">
  <div class="split absolute inset-0 bg-[#14140F]"></div>

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

-- 6. Blog Post OG Image — paper/brick, sticky-note eyebrow tab.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Inter:wght@400;500;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Source Serif 4', serif; }
  </style>
</head>
<body class="bg-[#FAF6F0] w-[1200px] h-[630px] m-0 p-0 relative overflow-hidden">
  <div class="absolute top-0 left-20 bg-[#B5442E] text-white text-xs font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-b-lg">
    Article
  </div>

  <div class="absolute inset-0 flex flex-col justify-center px-20">
    <h1 class="serif text-6xl leading-[1.12] text-[#201C1C] max-w-4xl mb-10">{{post_title}}</h1>
    <div class="flex items-center gap-4 text-sm text-[#5a5450]">
      <span class="font-semibold text-[#201C1C]">{{author_name}}</span>
      <span class="w-1 h-1 rounded-full bg-[#B5442E]"></span>
      <span>{{read_time}}</span>
    </div>
  </div>

  <div class="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#B5442E] via-[#D9895F] to-[#B5442E]"></div>
</body>
</html>$html$
WHERE title = 'Blog Post OG Image' AND is_preset = TRUE;

-- 7. Social Post Card — reworked as an editorial note card (folded corner)
--    instead of a generic dark tweet-embed clone.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500&family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
    .fold { clip-path: polygon(0 0, calc(100% - 56px) 0, 100% 56px, 100% 100%, 0 100%); }
  </style>
</head>
<body class="bg-[#0F3D3E] w-[1200px] h-[675px] m-0 flex items-center justify-center p-16">
  <div class="fold relative w-full h-full bg-[#FAF6EE] shadow-2xl p-16 flex flex-col justify-between">
    <div class="absolute top-0 right-0 w-14 h-14 bg-[#0F3D3E]/20" style="clip-path: polygon(100% 0, 0 0, 100% 100%);"></div>

    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#0F3D3E]"></div>
      <div>
        <p class="font-bold text-[#14140F] text-lg">{{display_name}}</p>
        <p class="text-[#8a8178] text-sm">@{{handle}}</p>
      </div>
    </div>

    <p class="display italic text-4xl leading-snug text-[#14140F] max-w-3xl">{{post_text}}</p>

    <div class="flex items-center justify-between">
      <svg width="120" height="16" viewBox="0 0 120 16" fill="none">
        <path d="M2 12 Q20 2 40 10 T78 10 T118 8" stroke="#FF6B4A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </svg>
      <p class="text-[#8a8178] text-sm">{{post_time}}</p>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Social Post Card' AND is_preset = TRUE;

-- 8. GitHub Project Banner — true dark, dot-grid texture, glow, blinking-cursor block.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
    body { font-family: 'JetBrains Mono', monospace; }
    .dotgrid { background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 24px 24px; }
  </style>
</head>
<body class="dotgrid bg-[#0B0E14] w-[1280px] h-[640px] m-0 p-20 relative overflow-hidden">
  <div class="absolute inset-0" style="background: radial-gradient(600px circle at 85% 15%, rgba(61,220,132,0.12), transparent 60%);"></div>

  <div class="relative h-full flex flex-col justify-between">
    <div class="flex items-center gap-2 text-[#66D9EF] text-sm">
      <span class="text-[#3DDC84]">$</span>
      <span>git clone {{repo_name}}</span>
      <span class="inline-block w-[10px] h-[20px] bg-[#3DDC84] ml-1"></span>
    </div>

    <div>
      <h1 class="text-6xl font-bold text-white mb-4 flex items-center gap-4">
        <span class="text-[#3DDC84]">&gt;</span>{{repo_name}}
      </h1>
      <p class="text-xl text-[#8b949e] max-w-3xl leading-relaxed">{{tagline}}</p>
    </div>

    <div class="flex items-center gap-8 text-[#8b949e] text-sm">
      <span class="flex items-center gap-2"><span class="text-[#e3b341]">&#9733;</span>{{stars}}</span>
      <span class="w-px h-4 bg-[#30363d]"></span>
      <span>{{license}}</span>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'GitHub Project Banner' AND is_preset = TRUE;

-- 9. Birthday Card — coral/cream, confetti dots, ribbon-notch banner.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter:wght@400;500&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .display { font-family: 'Fraunces', serif; }
    .confetti {
      background-image:
        radial-gradient(circle, #FFD166 8px, transparent 9px),
        radial-gradient(circle, #06D6A0 6px, transparent 7px),
        radial-gradient(circle, #FFFBF3 5px, transparent 6px),
        radial-gradient(circle, #4A1942 4px, transparent 5px);
      background-size: 220px 220px, 180px 180px, 140px 140px, 260px 260px;
      background-position: 0 0, 60px 100px, 140px 40px, 200px 180px;
    }
    .banner { clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%); }
  </style>
</head>
<body class="confetti bg-[#FF6F59] w-[1080px] h-[1080px] m-0 flex items-center justify-center p-20">
  <div class="relative w-full h-full bg-[#FFFBF3] rounded-[48px] shadow-2xl flex flex-col items-center justify-center text-center px-16">
    <div class="banner absolute -top-2 left-1/2 -translate-x-1/2 w-40 bg-[#4A1942] pt-6 pb-8 flex items-start justify-center">
      <span class="text-white text-[10px] uppercase tracking-[0.3em] font-bold">Happy Birthday</span>
    </div>

    <h1 class="display text-7xl text-[#4A1942] mt-16 mb-10">{{recipient_name}}</h1>
    <p class="text-xl text-[#6b5a63] max-w-xl mb-10 leading-relaxed">{{message}}</p>
    <div class="w-12 h-px bg-[#FF6F59] mb-6"></div>
    <p class="text-sm uppercase tracking-[0.2em] text-[#4A1942]/60">{{sender_name}}</p>
  </div>
</body>
</html>$html$
WHERE title = 'Birthday Card' AND is_preset = TRUE;

-- 10. Podcast Episode Cover — ink/coral, soundwave bar graphic.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;800;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#121212] w-[1400px] h-[1400px] m-0 p-24 relative overflow-hidden">
  <div class="absolute inset-0" style="background: radial-gradient(800px circle at 80% -10%, rgba(255,90,95,0.25), transparent 60%);"></div>

  <div class="relative h-full flex flex-col justify-between">
    <div class="flex items-center justify-between">
      <span class="text-white/90 text-xl font-bold uppercase tracking-[0.15em]">{{show_name}}</span>
      <span class="flex items-center justify-center w-24 h-24 rounded-full border-2 border-[#FF5A5F] text-[#FF5A5F] font-black text-xl">
        {{episode_number}}
      </span>
    </div>

    <h1 class="text-8xl font-black text-white leading-[1.02] max-w-5xl">{{episode_title}}</h1>

    <div>
      <p class="text-2xl text-white/70 font-medium mb-10">with {{host_name}}</p>
      <div class="flex items-end gap-[6px] h-16">
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:35%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:70%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:45%"></div>
        <div class="w-[10px] bg-white/80 rounded-full" style="height:90%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:55%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:30%"></div>
        <div class="w-[10px] bg-white/80 rounded-full" style="height:80%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:50%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:65%"></div>
        <div class="w-[10px] bg-white/80 rounded-full" style="height:40%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:75%"></div>
        <div class="w-[10px] bg-[#FF5A5F] rounded-full" style="height:25%"></div>
      </div>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Podcast Episode Cover' AND is_preset = TRUE;

-- 11. Modern Invoice Header — navy/ivory diagonal split, gold accent.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .cut { clip-path: polygon(0 0, 62% 0, 48% 100%, 0 100%); }
  </style>
</head>
<body class="bg-[#F7F3EC] w-[1200px] h-[400px] m-0 relative overflow-hidden">
  <div class="cut absolute inset-0 bg-[#16233F]"></div>

  <div class="absolute inset-0 flex items-center">
    <div class="w-[46%] pl-16 pr-8">
      <p class="text-[#B08D57] text-xs uppercase tracking-[0.3em] font-bold mb-3">Invoice</p>
      <h1 class="text-3xl font-extrabold text-white">{{company_name}}</h1>
    </div>

    <div class="flex-1 flex items-center justify-between pl-8 pr-16">
      <div>
        <p class="text-sm text-[#16233F]/60">#{{invoice_number}}</p>
        <p class="text-sm text-[#16233F]/60">Bill to: {{client_name}}</p>
      </div>
      <div class="text-right">
        <p class="text-4xl font-black text-[#16233F]">{{total_amount}}</p>
        <p class="text-sm text-[#B08D57] font-semibold mt-1">Due {{due_date}}</p>
      </div>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Modern Invoice Header' AND is_preset = TRUE;

-- 12. SaaS Pricing Card — indigo, grid-line texture, glowing violet orb.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .grid-lines {
      background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 40px 40px;
    }
  </style>
</head>
<body class="grid-lines bg-[#0E0B2E] w-[800px] h-[1000px] m-0 p-14 relative overflow-hidden">
  <div class="absolute top-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full" style="background: radial-gradient(circle, rgba(139,92,246,0.55), transparent 70%); filter: blur(10px);"></div>

  <div class="relative w-full h-full flex flex-col justify-between">
    <div>
      <span class="inline-block bg-[#8B5CF6] text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-10">
        {{plan_name}}
      </span>
      <div class="flex items-baseline gap-2">
        <span class="text-8xl font-black text-white">{{price}}</span>
        <span class="text-lg text-white/50">/{{billing_period}}</span>
      </div>
    </div>

    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs">&#10003;</span>
        <p class="text-white text-lg">{{feature_1}}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs">&#10003;</span>
        <p class="text-white text-lg">{{feature_2}}</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs">&#10003;</span>
        <p class="text-white text-lg">{{feature_3}}</p>
      </div>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'SaaS Pricing Card' AND is_preset = TRUE;

-- 13. Real Estate Listing — warm white/navy, pennant "For Sale" badge.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600&family=Inter:wght@400;500;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Source Serif 4', serif; }
    .pennant { clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%); }
  </style>
</head>
<body class="bg-[#FAF8F5] w-[1200px] h-[800px] m-0 flex">
  <div class="relative w-3/5 h-full">
    <img src="{{image_url}}" class="w-full h-full object-cover" />
    <div class="pennant absolute top-0 left-12 w-28 bg-[#A98554] pt-4 pb-6 flex items-start justify-center">
      <span class="text-white text-[10px] font-bold uppercase tracking-wider">For Sale</span>
    </div>
  </div>

  <div class="w-2/5 h-full flex flex-col justify-between p-12 bg-[#1C2B39]">
    <div>
      <p class="text-[#A98554] text-xs uppercase tracking-[0.25em] font-bold mb-4">New Listing</p>
      <h1 class="serif text-3xl text-white leading-snug mb-6">{{address}}</h1>
      <p class="text-5xl font-black text-white">{{price}}</p>
    </div>

    <div class="flex gap-6 text-white/70 text-sm border-t border-white/10 pt-6">
      <span>{{beds}} beds</span>
      <span class="w-px h-4 bg-white/20"></span>
      <span>{{baths}} baths</span>
      <span class="w-px h-4 bg-white/20"></span>
      <span>{{sqft}} sqft</span>
    </div>
  </div>
</body>
</html>$html$
WHERE title = 'Real Estate Listing' AND is_preset = TRUE;

-- 14. Wedding Save the Date — ivory/sage/gold, botanical line-art corners,
--     monogram circle. Adds a new {{monogram}} field to default_variables.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Cormorant Garamond', serif; }
  </style>
</head>
<body class="bg-[#FBF6EF] w-[1080px] h-[1350px] m-0 relative overflow-hidden">
  <svg class="absolute top-10 left-10" width="180" height="180" viewBox="0 0 180 180" fill="none">
    <g stroke="#8A9A7E" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M10 170 C 10 90, 90 10, 170 10"/>
      <path d="M30 150 C 50 120, 60 100, 40 70"/>
      <path d="M55 125 C 75 110, 95 100, 90 75"/>
      <path d="M80 100 C 100 90, 115 80, 105 55"/>
    </g>
  </svg>
  <svg class="absolute bottom-10 right-10 scale-[-1]" width="180" height="180" viewBox="0 0 180 180" fill="none">
    <g stroke="#8A9A7E" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M10 170 C 10 90, 90 10, 170 10"/>
      <path d="M30 150 C 50 120, 60 100, 40 70"/>
      <path d="M55 125 C 75 110, 95 100, 90 75"/>
      <path d="M80 100 C 100 90, 115 80, 105 55"/>
    </g>
  </svg>

  <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-24">
    <div class="w-20 h-20 rounded-full border border-[#B8965A] flex items-center justify-center mb-10">
      <span class="serif text-2xl text-[#B8965A]">{{monogram}}</span>
    </div>

    <p class="text-xs uppercase tracking-[0.5em] text-[#8A9A7E] mb-8">Save the Date</p>
    <h1 class="serif text-8xl text-[#3a3a3a] leading-tight mb-10">{{couple_names}}</h1>

    <div class="flex items-center gap-4 mb-10">
      <div class="w-14 h-px bg-[#B8965A]"></div>
      <div class="w-1.5 h-1.5 rotate-45 bg-[#B8965A]"></div>
      <div class="w-14 h-px bg-[#B8965A]"></div>
    </div>

    <p class="serif text-3xl text-[#3a3a3a] mb-3">{{wedding_date}}</p>
    <p class="text-sm uppercase tracking-[0.3em] text-[#8a8a8a]">{{location}}</p>
  </div>
</body>
</html>$html$,
    default_variables = '{"couple_names": "Emma & James", "wedding_date": "June 20, 2027", "location": "Lake Como, Italy", "monogram": "E & J"}'::jsonb
WHERE title = 'Wedding Save the Date' AND is_preset = TRUE;

-- 15. Year in Review Stats — ink/teal/coral, bar-chart accent device, timeline rail.
UPDATE public.templates
SET html_body = $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#101014] w-[1080px] h-[1350px] m-0 p-20 relative overflow-hidden">
  <div class="absolute left-[92px] top-[220px] bottom-[140px] w-px bg-white/10"></div>

  <div class="relative h-full flex flex-col justify-between">
    <h1 class="text-3xl font-medium text-white">{{year}} in review</h1>

    <div class="space-y-16 pl-16">
      <div class="relative">
        <div class="absolute -left-16 top-3 w-3 h-3 rounded-full bg-[#2DD4BF]"></div>
        <div class="h-2 rounded-full bg-[#2DD4BF] mb-4" style="width: 70%"></div>
        <p class="text-7xl font-black text-white leading-none">{{stat_1_value}}</p>
        <p class="text-lg text-white/50 mt-2">{{stat_1_label}}</p>
      </div>

      <div class="relative">
        <div class="absolute -left-16 top-3 w-3 h-3 rounded-full bg-[#FF6B5B]"></div>
        <div class="h-2 rounded-full bg-[#FF6B5B] mb-4" style="width: 45%"></div>
        <p class="text-7xl font-black text-white leading-none">{{stat_2_value}}</p>
        <p class="text-lg text-white/50 mt-2">{{stat_2_label}}</p>
      </div>

      <div class="relative">
        <div class="absolute -left-16 top-3 w-3 h-3 rounded-full bg-white"></div>
        <div class="h-2 rounded-full bg-white mb-4" style="width: 55%"></div>
        <p class="text-7xl font-black text-white leading-none">{{stat_3_value}}</p>
        <p class="text-lg text-white/50 mt-2">{{stat_3_label}}</p>
      </div>
    </div>

    <p class="text-sm text-white/30">Generated with Visora</p>
  </div>
</body>
</html>$html$
WHERE title = 'Year in Review Stats' AND is_preset = TRUE;

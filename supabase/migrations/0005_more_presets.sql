-- Visora — preset gallery expansion #2 (4 free + 4 premium).

-- ===== Free =====

INSERT INTO public.templates (user_id, is_preset, is_premium, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL,
  TRUE,
  FALSE,
  'Blog Post OG Image',
  'og-image',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Source+Serif+4:wght@600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Source Serif 4', serif; }
  </style>
</head>
<body class="bg-[#fdfcfa] w-[1200px] h-[630px] flex items-center justify-center p-20 m-0">
  <div class="w-full h-full flex flex-col justify-between">
    <span class="text-xs uppercase tracking-[0.2em] text-gray-400">Article</span>
    <h1 class="serif text-6xl leading-[1.1] text-[#1a1a1a] max-w-4xl">{{post_title}}</h1>
    <div class="flex items-center gap-3 text-sm text-gray-500">
      <span>{{author_name}}</span>
      <span>·</span>
      <span>{{read_time}}</span>
    </div>
  </div>
</body>
</html>$html$,
  '{"post_title": "Why deterministic rendering beats AI image generation for OG images", "author_name": "Visora Team", "read_time": "6 min read"}'::jsonb,
  1200,
  630
),
(
  NULL,
  TRUE,
  FALSE,
  'Social Post Card',
  'social',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-black w-[1200px] h-[675px] flex items-center justify-center p-16 m-0">
  <div class="w-full h-full bg-[#16181c] border border-[#2f3336] rounded-2xl p-12 flex flex-col justify-between">
    <div class="flex items-center gap-3">
      <div class="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500"></div>
      <div>
        <p class="text-white font-bold text-lg">{{display_name}}</p>
        <p class="text-gray-500 text-sm">@{{handle}}</p>
      </div>
    </div>
    <p class="text-white text-4xl leading-snug font-medium">{{post_text}}</p>
    <p class="text-gray-500 text-sm">{{post_time}}</p>
  </div>
</body>
</html>$html$,
  '{"display_name": "Visora", "handle": "visora_io", "post_text": "Shipped: real headless Chromium rendering, sub-150ms, via one POST request.", "post_time": "9:41 AM · Aug 4, 2026"}'::jsonb,
  1200,
  675
),
(
  NULL,
  TRUE,
  FALSE,
  'GitHub Project Banner',
  'dev',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
    body { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-[#0d1117] w-[1280px] h-[640px] flex items-center justify-center p-20 m-0">
  <div class="w-full h-full flex flex-col justify-between">
    <div class="flex items-center gap-2 text-[#58a6ff] text-sm">
      <span>&gt;</span>
      <span>git clone {{repo_name}}</span>
    </div>
    <div>
      <h1 class="text-6xl font-bold text-white mb-4">{{repo_name}}</h1>
      <p class="text-xl text-[#8b949e] max-w-3xl">{{tagline}}</p>
    </div>
    <div class="flex items-center gap-6 text-[#8b949e] text-sm">
      <span>&#9733; {{stars}}</span>
      <span>{{license}}</span>
    </div>
  </div>
</body>
</html>$html$,
  '{"repo_name": "visora", "tagline": "Deterministic HTML/Tailwind to image rendering, powered by headless Chromium.", "stars": "2.4k", "license": "MIT License"}'::jsonb,
  1280,
  640
),
(
  NULL,
  TRUE,
  FALSE,
  'Birthday Card',
  'greeting',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Fraunces:wght@600&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Fraunces', serif; }
  </style>
</head>
<body class="bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400 w-[1080px] h-[1080px] flex items-center justify-center p-20 m-0">
  <div class="w-full h-full bg-white/90 rounded-[40px] flex flex-col items-center justify-center text-center px-16">
    <p class="text-sm uppercase tracking-[0.3em] text-gray-500 mb-6">Happy Birthday</p>
    <h1 class="serif text-7xl text-[#2a2a2a] mb-10">{{recipient_name}}</h1>
    <p class="text-xl text-gray-600 max-w-xl mb-10">{{message}}</p>
    <p class="text-sm text-gray-400">— {{sender_name}}</p>
  </div>
</body>
</html>$html$,
  '{"recipient_name": "Alex", "message": "Wishing you a year as bright and bold as you are.", "sender_name": "The whole team"}'::jsonb,
  1080,
  1080
);

-- ===== Premium =====

INSERT INTO public.templates (user_id, is_preset, is_premium, title, category, html_body, default_variables, width, height)
VALUES
(
  NULL,
  TRUE,
  TRUE,
  'SaaS Pricing Card',
  'pricing',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#0a0a0a] w-[800px] h-[1000px] flex items-center justify-center p-12 m-0">
  <div class="w-full h-full bg-gradient-to-b from-[#151515] to-black border border-white/10 rounded-3xl p-12 flex flex-col justify-between">
    <div>
      <span class="inline-block bg-white text-black text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-8">
        {{plan_name}}
      </span>
      <div class="flex items-baseline gap-2 mb-2">
        <span class="text-7xl font-black text-white">{{price}}</span>
        <span class="text-lg text-gray-500">/{{billing_period}}</span>
      </div>
    </div>
    <div class="space-y-4">
      <p class="text-white text-lg flex items-center gap-3">&#10003; {{feature_1}}</p>
      <p class="text-white text-lg flex items-center gap-3">&#10003; {{feature_2}}</p>
      <p class="text-white text-lg flex items-center gap-3">&#10003; {{feature_3}}</p>
    </div>
  </div>
</body>
</html>$html$,
  '{"plan_name": "Pro", "price": "$49", "billing_period": "month", "feature_1": "50,000 renders / month", "feature_2": "Custom fonts & assets", "feature_3": "Priority support"}'::jsonb,
  800,
  1000
),
(
  NULL,
  TRUE,
  TRUE,
  'Real Estate Listing',
  'realestate',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-white w-[1200px] h-[800px] flex m-0">
  <img src="{{image_url}}" class="w-3/5 h-full object-cover" />
  <div class="w-2/5 h-full flex flex-col justify-between p-12">
    <div>
      <span class="inline-block bg-black text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6">
        For Sale
      </span>
      <h1 class="text-3xl font-bold text-black mb-2">{{address}}</h1>
      <p class="text-4xl font-black text-black">{{price}}</p>
    </div>
    <div class="flex gap-6 text-gray-700 text-sm border-t border-gray-200 pt-6">
      <span>{{beds}} beds</span>
      <span>{{baths}} baths</span>
      <span>{{sqft}} sqft</span>
    </div>
  </div>
</body>
</html>$html$,
  '{"image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900", "address": "128 Maple Street, Austin, TX", "price": "$685,000", "beds": "4", "baths": "3", "sqft": "2,450"}'::jsonb,
  1200,
  800
),
(
  NULL,
  TRUE,
  TRUE,
  'Wedding Save the Date',
  'greeting',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .serif { font-family: 'Cormorant Garamond', serif; }
  </style>
</head>
<body class="bg-[#f7f3ee] w-[1080px] h-[1350px] flex items-center justify-center p-16 m-0">
  <div class="w-full h-full border border-[#b08d57] flex flex-col items-center justify-center text-center px-16">
    <p class="text-xs uppercase tracking-[0.4em] text-[#b08d57] mb-10">Save the Date</p>
    <h1 class="serif text-8xl text-[#2a2a2a] leading-tight mb-10">{{couple_names}}</h1>
    <div class="w-20 h-px bg-[#b08d57] mb-10"></div>
    <p class="serif text-3xl text-[#3a3a3a] mb-4">{{wedding_date}}</p>
    <p class="text-sm uppercase tracking-widest text-gray-500">{{location}}</p>
  </div>
</body>
</html>$html$,
  '{"couple_names": "Emma & James", "wedding_date": "June 20, 2027", "location": "Lake Como, Italy"}'::jsonb,
  1080,
  1350
),
(
  NULL,
  TRUE,
  TRUE,
  'Year in Review Stats',
  'stats',
  $html$<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;900&display=swap');
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-[#111015] w-[1080px] h-[1350px] flex items-center justify-center p-16 m-0">
  <div class="w-full h-full flex flex-col justify-between">
    <h1 class="text-2xl font-medium text-white">{{year}} in review</h1>
    <div class="space-y-14">
      <div>
        <p class="text-8xl font-black text-white leading-none">{{stat_1_value}}</p>
        <p class="text-lg text-gray-400 mt-2">{{stat_1_label}}</p>
      </div>
      <div>
        <p class="text-8xl font-black text-white leading-none">{{stat_2_value}}</p>
        <p class="text-lg text-gray-400 mt-2">{{stat_2_label}}</p>
      </div>
      <div>
        <p class="text-8xl font-black text-white leading-none">{{stat_3_value}}</p>
        <p class="text-lg text-gray-400 mt-2">{{stat_3_label}}</p>
      </div>
    </div>
    <p class="text-sm text-gray-600">Generated with Visora</p>
  </div>
</body>
</html>$html$,
  '{"year": "2026", "stat_1_value": "1.2M", "stat_1_label": "Images rendered", "stat_2_value": "89ms", "stat_2_label": "Average render time", "stat_3_value": "340+", "stat_3_label": "Active developers"}'::jsonb,
  1080,
  1350
);
